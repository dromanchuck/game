import {
  createGameEngine,
  type Direction,
  type GameSnapshot,
  type GameStorage,
} from '@grid-bomb-dodge/game-core';
import { useEffect, useState } from 'react';

const MAX_FRAME_MS = 100;

export function useGame(storage: GameStorage) {
  const [engine] = useState(() => createGameEngine({ storage }));
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => engine.getSnapshot());

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const loop = (now: number): void => {
      const delta = Math.min(now - last, MAX_FRAME_MS);
      last = now;
      if (engine.getSnapshot().phase === 'playing') {
        engine.tick(delta);
        setSnapshot(engine.getSnapshot());
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [engine]);

  const start = (): void => {
    engine.start();
    setSnapshot(engine.getSnapshot());
  };

  const move = (direction: Direction): void => {
    engine.move(direction);
  };

  return { snapshot, start, move };
}
