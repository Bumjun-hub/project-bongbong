import { useEffect, useRef, type PointerEvent, type MouseEvent } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { cursorPosition, getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { DRAG_POLL_INTERVAL, DRAG_THRESHOLD } from "../constants/character";

interface DragActions {
  hold: () => void;
  startDrag: () => void;
  reset: () => void;
  greet: () => void;
  clampToScreen: () => Promise<void>;
  waitForMovement: () => Promise<void>;
}
interface Gesture {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  dragging: boolean;
  finishing: boolean;
  ready: Promise<void>;
  movement: Promise<void>;
}

export function useCharacterDrag(actions: DragActions) {
  const latest = useRef(actions);
  latest.current = actions;
  const gesture = useRef<Gesture | null>(null);
  const mounted = useRef(true);
  const pollTimer = useRef<number | undefined>(undefined);
  const active = (current: Gesture) => mounted.current && gesture.current === current;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      gesture.current = null;
      window.clearTimeout(pollTimer.current);
    };
  }, []);

  async function moveToCursor(current: Gesture) {
    const cursor = await cursorPosition();
    if (!active(current)) return;
    await getCurrentWindow().setPosition(new PhysicalPosition(
      Math.round(cursor.x - current.offsetX), Math.round(cursor.y - current.offsetY),
    ));
  }

  async function finish(current: Gesture, cancelled = false) {
    if (!active(current) || current.finishing) return;
    current.finishing = true;
    window.clearTimeout(pollTimer.current);
    try {
      await current.ready;
      await current.movement;
      if (!active(current)) return;
      if (isTauri() && current.dragging) await moveToCursor(current);
      if (active(current)) await latest.current.clampToScreen();
    } catch (error) {
      console.error("[Character] Drag finish:", error);
    } finally {
      if (active(current)) {
        gesture.current = null;
        if (current.dragging || cancelled) latest.current.reset();
        else latest.current.greet();
      }
    }
  }

  // Move the real window directly: no Windows modal move loop or outline preview.
  // Only one position request is in flight, and polling exists only while held.
  async function tick(current: Gesture) {
    if (!active(current) || current.finishing) return;
    try {
      await current.ready;
      if (!active(current) || current.finishing) return;
      const [down, cursor] = await Promise.all([
        invoke<boolean>("left_mouse_down"), cursorPosition(),
      ]);
      if (!active(current) || current.finishing) return;
      if (!down) { await finish(current); return; }
      if (!current.dragging && Math.hypot(cursor.x - current.x, cursor.y - current.y) >= DRAG_THRESHOLD * current.scale) {
        current.dragging = true;
        latest.current.startDrag();
      }
      if (current.dragging) {
        current.movement = getCurrentWindow().setPosition(new PhysicalPosition(
          Math.round(cursor.x - current.offsetX), Math.round(cursor.y - current.offsetY),
        ));
        await current.movement;
      }
      if (active(current) && !current.finishing) {
        pollTimer.current = window.setTimeout(() => void tick(current), DRAG_POLL_INTERVAL);
      }
    } catch (error) {
      console.error("[Character] Live drag:", error);
      await finish(current, true);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || !event.isPrimary || gesture.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    latest.current.hold();
    const scale = window.devicePixelRatio;
    const current: Gesture = {
      x: event.screenX, y: event.screenY,
      screenX: event.screenX, screenY: event.screenY,
      offsetX: event.clientX * scale, offsetY: event.clientY * scale,
      scale, dragging: false, finishing: false,
      ready: Promise.resolve(), movement: Promise.resolve(),
    };
    gesture.current = current;
    if (isTauri()) {
      // Use the original local grab point, not a later cursor sample. The window
      // is borderless, so its outer origin also equals the WebView origin.
      current.ready = (async () => {
        await latest.current.waitForMovement();
        const position = await getCurrentWindow().outerPosition();
        current.x = position.x + current.offsetX;
        current.y = position.y + current.offsetY;
      })();
      void tick(current);
    }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.dragging || current.finishing) return;
    if (Math.hypot(event.screenX - current.screenX, event.screenY - current.screenY) >= DRAG_THRESHOLD) {
      current.dragging = true;
      latest.current.startDrag();
    }
  }

  const end = () => { if (gesture.current) void finish(gesture.current); };
  const cancel = () => { if (gesture.current) void finish(gesture.current, true); };
  return {
    onPointerDown, onPointerMove,
    onPointerUp: end,
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
    // Pointerup handles clicks; suppress the synthetic click after a drag.
    onClick: (event: MouseEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); },
  };
}
