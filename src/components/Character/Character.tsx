import { useEffect, useState } from "react";
import { ATLAS_LAYOUT, CHARACTER_ANIMATIONS, CHARACTER_ATLAS, CHARACTER_IMAGE, CHARACTER_SIZE, SLEEP_SIZE, SLEEP_ATLAS, SLEEP_ATLAS_LAYOUT } from "../../constants/character";
import { useCharacterState } from "../../hooks/useCharacterState";
import { usePetWindow } from "../../hooks/usePetWindow";
import { useCharacterDrag } from "../../hooks/useCharacterDrag";
import type { CharacterState } from "../../types/character";
import styles from "./Character.module.css";

function Sprite({ state, onComplete }: { state: CharacterState; onComplete: () => void }) {
  const animation = CHARACTER_ANIMATIONS[state];
  const [frame, setFrame] = useState(0);
  const [failedAtlas, setFailedAtlas] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);
  const rect = animation.frames[frame];
  const size = state === "sleep" ? SLEEP_SIZE : CHARACTER_SIZE;
  const layout = state === "sleep" ? SLEEP_ATLAS_LAYOUT : ATLAS_LAYOUT;
  const atlas = state === "sleep" ? SLEEP_ATLAS : CHARACTER_ATLAS;
  const scale = size / rect.w;

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      if (!animation.loop && index === animation.frames.length - 1) {
        window.clearInterval(timer);
        onComplete();
        return;
      }
      index = (index + 1) % animation.frames.length;
      setFrame(index);
    }, animation.frameDuration);
    return () => window.clearInterval(timer);
  }, [animation, onComplete]);

  if (failedAtlas) {
    return failedFallback
      ? <span className={styles.fallback} role="img" aria-label="캐릭터 이미지를 찾을 수 없습니다">••</span>
      : <img className={styles.image} src={CHARACTER_IMAGE} alt="봉봉" draggable={false} onError={() => setFailedFallback(true)} />;
  }
  return (
    <span className={styles.viewport} data-frame={frame}
      style={{ width: size, height: size, left: (CHARACTER_SIZE - size) / 2, top: CHARACTER_SIZE - size }}>
      <img className={styles.atlas} src={atlas} alt="봉봉" draggable={false}
        style={{ width: layout.sheetWidth * scale, height: layout.sheetHeight * scale,
          left: -rect.x * scale, top: -rect.y * scale }}
        onError={() => setFailedAtlas(true)} />
    </span>
  );
}

export function Character() {
  const character = useCharacterState();
  const petWindow = usePetWindow(character.state, character.isHolding, character.holding);
  const drag = useCharacterDrag({ ...character, ...petWindow });
  return (
    <main className={styles.stage}>
      {import.meta.env.DEV && <span className={styles.state}>{character.isDragging ? "DRAG" : character.state.toUpperCase()}</span>}
      <div className={styles.character} data-state={character.state} data-holding={character.isHolding}
        style={{ width: CHARACTER_SIZE, height: CHARACTER_SIZE }} role="button" tabIndex={0}
        aria-label="봉봉 — 클릭하면 손 인사, 드래그하면 이동합니다" {...drag}
        onKeyDown={(event) => {
          if (!character.isHolding && !event.repeat && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault(); character.greet();
          }
        }} onContextMenu={(event) => event.preventDefault()}>
        <div className={styles.facing} style={{ transform: `scaleX(${petWindow.direction})` }}>
          <Sprite key={`${character.state}-${character.revision}`} state={character.state} onComplete={character.finishWave} />
        </div>
      </div>
    </main>
  );
}
