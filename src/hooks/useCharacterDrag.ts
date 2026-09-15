import { useEffect, useRef, type PointerEvent, type MouseEvent } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { DRAG_POLL_INTERVAL, DRAG_THRESHOLD } from "../constants/character";
interface DragActions {
  hold: () => void;
  startDrag: () => void;
  reset: () => void;
  clampToScreen: () => Promise<void>;
  waitForMovement: () => Promise<void>;
}
export function useCharacterDrag(actions: DragActions) {
  const latest = useRef(actions);
  latest.current = actions;
  const gesture = useRef<{ x: number; y: number; native: boolean; finishing: boolean } | null>(null);
  const mounted = useRef(true);
  const pollTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      gesture.current = null;
      window.clearTimeout(pollTimer.current);
    };
  }, []);
  async function finish() {
    const current = gesture.current;
    if (!current || current.finishing) return;
    current.finishing = true;
    window.clearTimeout(pollTimer.current);
    try { await latest.current.clampToScreen(); }
    catch (error) { console.error("[Character] Position correction:", error); }
    finally {
      if (mounted.current && gesture.current === current) {
        gesture.current = null;
        latest.current.reset();
      }
    }
  }
  // Windows native drag can consume DOM pointerup/cancel events.
  async function pollRelease() {
    if (!mounted.current || !gesture.current || gesture.current.finishing) return;
    try {
      const down = await invoke<boolean>("left_mouse_down");
      if (!mounted.current || !gesture.current) return;
      if (!down) { await finish(); return; }
      pollTimer.current = window.setTimeout(pollRelease, DRAG_POLL_INTERVAL);
    } catch (error) {
      console.error("[Character] Mouse release check:", error);
      await finish();
    }
  }
  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || !event.isPrimary || gesture.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { x: event.screenX, y: event.screenY, native: false, finishing: false };
    latest.current.hold();
    if (isTauri()) pollTimer.current = window.setTimeout(pollRelease, DRAG_POLL_INTERVAL);
  }
  async function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.native || current.finishing) return;
    if (Math.hypot(event.screenX - current.x, event.screenY - current.y) < DRAG_THRESHOLD) return;
    current.native = true;
    latest.current.startDrag();
    if (!isTauri()) return;
    try {
      await latest.current.waitForMovement();
      if (gesture.current !== current || current.finishing) return;
      if (!(await invoke<boolean>("left_mouse_down"))) { await finish(); return; }
      await getCurrentWindow().startDragging();
      // Resolution means request accepted, not necessarily mouse released.
    } catch (error) {
      console.error("[Character] Native drag:", error);
      await finish();
    }
  }
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: () => { void finish(); },
    onPointerCancel: () => { if (!gesture.current?.native || !isTauri()) void finish(); },
    // Pointerup handles clicks; suppress the synthetic click after a drag.
    onClick: (event: MouseEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); },
  };
}
