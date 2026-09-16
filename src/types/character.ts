export type CharacterState = "idle" | "walk" | "sleep" | "wave";
export type Direction = 1 | -1;
export interface CharacterAnimation {
  frames: readonly { x: number; y: number; w: number; h: number }[];
  frameDuration: number;
  loop: boolean;
}
