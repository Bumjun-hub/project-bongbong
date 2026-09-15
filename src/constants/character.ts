import type { CharacterAnimation, CharacterState } from "../types/character";
export const IDLE_DURATION = 5_000;
export const WALK_DURATION = 10_000;
export const WALK_INTERVAL = 32;
export const WALK_SPEED = 2; // Physical pixels per tick.
export const DRAG_THRESHOLD = 4; // CSS pixels.
export const DRAG_POLL_INTERVAL = 40;
export const CHARACTER_SIZE = 128;
export const CHARACTER_IMAGE = "/character/bongbong.png";
// Replace frames with sprite URLs when more images are available.
export const CHARACTER_ANIMATIONS: Record<CharacterState, CharacterAnimation> = {
  idle: { frames: [CHARACTER_IMAGE], frameDuration: 250 },
  walk: { frames: [CHARACTER_IMAGE], frameDuration: 120 },
  sleep: { frames: [CHARACTER_IMAGE], frameDuration: 500 },
};
