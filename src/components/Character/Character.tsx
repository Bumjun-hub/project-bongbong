import { useEffect, useState } from "react";
import { CHARACTER_ANIMATIONS, CHARACTER_SIZE } from "../../constants/character";
import { useCharacterState } from "../../hooks/useCharacterState";
import { usePetWindow } from "../../hooks/usePetWindow";
import { useCharacterDrag } from "../../hooks/useCharacterDrag";
import styles from "./Character.module.css";

export function Character() {
  const character = useCharacterState();
  const petWindow = usePetWindow(character.state, character.isHolding, character.holding);
  const drag = useCharacterDrag({ ...character, ...petWindow });
  const animation = CHARACTER_ANIMATIONS[character.state];
  const [frame, setFrame] = useState(0);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = animation.frames[frame % animation.frames.length];
  useEffect(() => {
    setFrame(0);
    if (animation.frames.length < 2 || character.isHolding) return;
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % animation.frames.length), animation.frameDuration);
    return () => window.clearInterval(timer);
  }, [animation, character.isHolding]);
  return (
    <main className={styles.stage}>
      {import.meta.env.DEV && <span className={styles.state}>{character.isDragging ? "DRAG" : character.state.toUpperCase()}</span>}
      <div className={styles.character} data-state={character.state} data-holding={character.isHolding}
        style={{ width: CHARACTER_SIZE, height: CHARACTER_SIZE }} role="button" tabIndex={0}
        aria-label="봉봉 — 클릭하면 깨어나고, 드래그하면 이동합니다" {...drag}
        onKeyDown={(event) => {
          if (!character.isHolding && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault(); character.reset();
          }
        }} onContextMenu={(event) => event.preventDefault()}>
        <div className={styles.facing} style={{ transform: `scaleX(${petWindow.direction})` }}>
          {source && failedSource !== source ? (
            <img className={styles.image} src={source} alt="봉봉" draggable={false} onError={() => setFailedSource(source)} />
          ) : (
            <span className={styles.fallback} role="img" aria-label="캐릭터 이미지를 public/character/bongbong.png에 넣어주세요">••</span>
          )}
        </div>
      </div>
    </main>
  );
}
