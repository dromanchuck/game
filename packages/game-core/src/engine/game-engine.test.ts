import { describe, expect, it } from 'vitest';

import { createGameEngine, type GameStorage } from './game-engine';

function createMemoryStorage(tutorialComplete = true): GameStorage {
  let best = 0;
  let tutorial = tutorialComplete;
  return {
    loadBestScore: () => best,
    saveBestScore: (score) => {
      best = score;
    },
    isTutorialComplete: () => tutorial,
    markTutorialComplete: () => {
      tutorial = true;
    },
  };
}

describe('game engine', () => {
  it('starts on a centered 3x3 grid and ignores ticks before start', () => {
    const engine = createGameEngine({ storage: createMemoryStorage() });
    engine.tick(5000);
    expect(engine.getSnapshot()).toMatchObject({
      phase: 'title',
      gridSize: 3,
      player: { x: 1, y: 1 },
      bombs: [],
    });

    engine.start();
    expect(engine.getSnapshot().phase).toBe('playing');
  });

  it('moves the player and clamps at the grid edge', () => {
    const engine = createGameEngine({ storage: createMemoryStorage() });
    engine.start();
    engine.move('left');
    engine.move('left');
    expect(engine.getSnapshot().player).toEqual({ x: 0, y: 1 });
  });

  it('eventually ends the run for a player who never moves, and saves best score', () => {
    const storage = createMemoryStorage();
    const engine = createGameEngine({ storage });
    engine.start();

    for (let i = 0; i < 20_000 && engine.getSnapshot().phase === 'playing'; i += 1) {
      engine.tick(50);
    }

    const snapshot = engine.getSnapshot();
    expect(snapshot.phase).toBe('gameOver');
    expect(storage.loadBestScore()).toBe(snapshot.score);
  });

  it('walks a new player through the tutorial and marks it complete', () => {
    const storage = createMemoryStorage(false);
    const engine = createGameEngine({ storage });
    engine.start();
    expect(engine.getSnapshot().tutorialStep).toBe('move');

    engine.move('up');
    engine.tick(16);
    expect(engine.getSnapshot().tutorialStep).toBe('telegraph');
    expect(engine.getSnapshot().bombs).toHaveLength(1);

    engine.move('up');
    engine.tick(16);
    expect(engine.getSnapshot().tutorialStep).toBe('escape');

    engine.move('down');
    for (let i = 0; i < 400 && engine.getSnapshot().tutorialStep !== null; i += 1) {
      engine.tick(50);
    }
    expect(engine.getSnapshot().phase).toBe('playing');
    expect(storage.isTutorialComplete()).toBe(true);
  });
});
