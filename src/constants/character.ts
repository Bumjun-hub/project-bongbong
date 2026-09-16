import type { CharacterAnimation, CharacterState } from "../types/character";
import manifest from "../assets/character/manifest-192.json";
import sleepManifest from "../assets/character/manifest-sleep-138.json";
export const IDLE_DURATION = 5_000;
export const WALK_DURATION = 10_000;
export const WALK_INTERVAL = 16;
export const WALK_SPEED = 1; // Physical pixels per tick; smaller steps keep movement smooth.
export const DRAG_THRESHOLD = 4; // CSS pixels.
export const DRAG_POLL_INTERVAL = 16;
export const CHARACTER_SIZE = 192;
export const SLEEP_SIZE = 138;
export const CHARACTER_IMAGE = "/character/bongbong.png";
export const CHARACTER_ATLAS = "/character/animations/bongbong-atlas-192.png";
export const SLEEP_ATLAS = "/character/animations/bongbong-sleep-138.png";
export const SLEEP_ATLAS_LAYOUT = sleepManifest.frame_layout;
export const ATLAS_LAYOUT = manifest.frame_layout;
// Read explicit rectangles from sprite-gen; never guess the grid at runtime.
export const CHARACTER_ANIMATIONS: Record<CharacterState, CharacterAnimation> = {
  idle: { frames: manifest.frame_layout.rows.idle, frameDuration: 250, loop: true },
  walk: { frames: manifest.frame_layout.rows.walk, frameDuration: 1000 / manifest.frame_layout.rows.walk.length, loop: true },
  sleep: { frames: sleepManifest.frame_layout.rows.sleep, frameDuration: 500, loop: true },
  wave: { frames: manifest.frame_layout.rows.wave, frameDuration: 1000 / 6, loop: false },
};
