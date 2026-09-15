import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow, primaryMonitor, PhysicalPosition } from "@tauri-apps/api/window";
import { WALK_INTERVAL, WALK_SPEED } from "../constants/character";
import type { CharacterState, Direction } from "../types/character";

export function usePetWindow(state: CharacterState, isHolding: boolean, holding: RefObject<boolean>) {
  const [direction, setDirection] = useState<Direction>(1);
  const facing = useRef<Direction>(1);
  // Native drag waits for the last position write, preventing a stale walk jump.
  const pending = useRef<Promise<void>>(Promise.resolve());
  const waitForMovement = useCallback(() => pending.current, []);
  const clampToScreen = useCallback(async () => {
    if (!isTauri()) return;
    await pending.current;
    const win = getCurrentWindow();
    const [monitor, size, position] = await Promise.all([primaryMonitor(), win.outerSize(), win.outerPosition()]);
    if (!monitor) throw new Error("Primary monitor is unavailable");
    const area = monitor.workArea;
    const x = Math.max(area.position.x, Math.min(position.x, area.position.x + Math.max(0, area.size.width - size.width)));
    const y = Math.max(area.position.y, Math.min(position.y, area.position.y + Math.max(0, area.size.height - size.height)));
    if (x !== position.x || y !== position.y) await win.setPosition(new PhysicalPosition(x, y));
  }, []);
  useEffect(() => {
    void clampToScreen().catch((error) => console.error("[Character] Initial position:", error));
  }, [clampToScreen]);
  useEffect(() => {
    if (!isTauri() || state !== "walk" || isHolding) return;
    let cancelled = false;
    let timer: number | undefined;
    const win = getCurrentWindow();
    const tick = async () => {
      if (cancelled || holding.current) return;
      const move = async () => {
        const [monitor, size, position] = await Promise.all([primaryMonitor(), win.outerSize(), win.outerPosition()]);
        if (cancelled || holding.current) return;
        if (!monitor) throw new Error("Primary monitor is unavailable");
        const area = monitor.workArea;
        const minX = area.position.x;
        const maxX = minX + Math.max(0, area.size.width - size.width);
        let x = position.x + WALK_SPEED * facing.current;
        if (x >= maxX) { x = maxX; facing.current = -1; }
        else if (x <= minX) { x = minX; facing.current = 1; }
        const y = Math.max(area.position.y, Math.min(position.y, area.position.y + Math.max(0, area.size.height - size.height)));
        setDirection(facing.current);
        await win.setPosition(new PhysicalPosition(x, y));
      };
      pending.current = move().catch((error) => {
        cancelled = true;
        console.error("[Character] Walk stopped:", error);
      });
      await pending.current;
      if (!cancelled && !holding.current) timer = window.setTimeout(tick, WALK_INTERVAL);
    };
    void tick();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [state, isHolding, holding]);
  return { direction, clampToScreen, waitForMovement };
}
