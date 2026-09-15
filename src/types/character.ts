export type CharacterState = "idle" | "walk" | "sleep";
export type Direction = 1 | -1;
export interface CharacterAnimation {
  frames: readonly string[];
  frameDuration: number;
}
