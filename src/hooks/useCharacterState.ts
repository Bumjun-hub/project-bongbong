import { useCallback, useEffect, useRef, useState } from "react";
import { IDLE_DURATION, WALK_DURATION } from "../constants/character";
import type { CharacterState } from "../types/character";
const PHASES: readonly CharacterState[] = ["idle", "walk", "idle", "sleep"];

export function useCharacterState() {
  const [phase, setPhase] = useState(0);
  const [revision, setRevision] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const holding = useRef(false);
  const state: CharacterState = isWaving ? "wave" : PHASES[phase];
  const reset = useCallback(() => {
    holding.current = false;
    setIsHolding(false);
    setIsDragging(false);
    setIsWaving(false);
    setPhase(0);
    setRevision((value) => value + 1);
  }, []);
  const greet = useCallback(() => {
    holding.current = false;
    setIsHolding(false);
    setIsDragging(false);
    setPhase(0);
    setIsWaving(true);
    setRevision((value) => value + 1);
  }, []);
  const finishWave = useCallback(() => {
    setIsWaving(false);
    setPhase(0);
    setRevision((value) => value + 1);
  }, []);
  const hold = useCallback(() => {
    holding.current = true; // Stop async movement before React commits.
    setIsHolding(true);
  }, []);
  const startDrag = useCallback(() => setIsDragging(true), []);
  const selectState = useCallback((next: CharacterState) => {
    if (holding.current) return;
    setIsWaving(next === "wave");
    setPhase(next === "idle" ? 0 : next === "walk" ? 1 : 3);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    if (isHolding || state === "sleep" || state === "wave") return;
    const timer = window.setTimeout(() => {
      if (!holding.current) setPhase((value) => Math.min(value + 1, 3));
    }, state === "walk" ? WALK_DURATION : IDLE_DURATION);
    return () => window.clearTimeout(timer);
  }, [phase, state, isHolding, revision]);
  useEffect(() => {
    if (import.meta.env.DEV) console.info(`[Character] ${isDragging ? "DRAG" : state.toUpperCase()}`);
  }, [state, isDragging, revision]);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "1") selectState("idle");
      if (event.key === "2") selectState("walk");
      if (event.key === "3") selectState("sleep");
      if (event.key === "4") selectState("wave");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectState]);
  return { state, revision, isDragging, isHolding, holding, reset, greet, finishWave, hold, startDrag };
}
