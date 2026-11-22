import {
  GRID_GROW_ANIMATION_MS,
  GRID_GROW_PAUSE_MS,
} from '../constants';
import { cellKey, getBlastCells, getThreatenedCells } from '../logic/blast';
import { getGridCenter, getGridSizeForScore } from '../logic/grid-size';
import { incrementScore, updateBestScore } from '../logic/score';
import type {
  Bomb,
  Direction,
  GamePhase,
  PlayerState,
} from '../logic/types';
import {
  createSpawnPlan,
  getLiveBombCap,
  getSpawnIntervalMs,
} from '../systems/spawn-system';
import {
  createTutorialEscapeBomb,
  createTutorialTelegraphBomb,
  type TutorialStepId,
} from '../systems/tutorial-system';

const EXPLOSION_FLASH_MS = 180;

/** Persistence is injected so each platform can back it with its own storage. */
export interface GameStorage {
  loadBestScore: () => number;
  saveBestScore: (score: number) => void;
  isTutorialComplete: () => boolean;
  markTutorialComplete: () => void;
}

export interface GameCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onScoreChange: (score: number) => void;
  onBestScoreChange: (bestScore: number) => void;
  onGameOver: (payload: { score: number; bestScore: number }) => void;
  onTutorialStepChange: (stepId: TutorialStepId | null) => void;
}

export interface GameSnapshot {
  phase: GamePhase;
  gridSize: number;
  /** Animated zoom, in tiles across the viewport (equals gridSize when idle). */
  viewCells: number;
  player: Readonly<PlayerState>;
  bombs: ReadonlyArray<Readonly<Bomb>>;
  threatened: ReadonlySet<string>;
  explosion: ReadonlySet<string>;
  score: number;
  bestScore: number;
  tutorialStep: TutorialStepId | null;
}

export interface GameEngine {
  /** Advance the simulation. Does nothing outside the playing phase. */
  tick: (deltaMs: number) => void;
  move: (direction: Direction) => void;
  /** Starts a run from the title or game-over screen; ignored while playing. */
  start: () => void;
  getSnapshot: () => GameSnapshot;
}

export interface GameEngineOptions {
  storage: GameStorage;
  callbacks?: Partial<GameCallbacks>;
}

export function applyDirection(
  x: number,
  y: number,
  direction: Direction,
  gridSize: number,
): { x: number; y: number } {
  switch (direction) {
    case 'up':
      return { x, y: Math.max(0, y - 1) };
    case 'down':
      return { x, y: Math.min(gridSize - 1, y + 1) };
    case 'left':
      return { x: Math.max(0, x - 1), y };
    case 'right':
      return { x: Math.min(gridSize - 1, x + 1), y };
  }
}

export function createGameEngine(options: GameEngineOptions): GameEngine {
  const { storage } = options;
  const callbacks = options.callbacks ?? {};

  let nextBombId = 1;
  let phase: GamePhase = 'title';
  let gridSize = getGridSizeForScore(0);
  let viewCells = gridSize;
  let growFromCells = gridSize;
  let growTimerMs = 0;
  let growPauseMs = 0;
  let player: PlayerState = getGridCenter(gridSize);
  let bombs: Bomb[] = [];
  let score = 0;
  let bestScore = storage.loadBestScore();
  let elapsedMs = 0;
  let spawnTimerMs = 0;
  let flashTimerMs = 0;
  let explosion: ReadonlySet<string> = new Set();
  let didMoveThisTick = false;

  let isTutorialRun = !storage.isTutorialComplete();
  let tutorialStep: TutorialStepId = isTutorialRun ? 'move' : 'complete';
  let tutorialStepTimerMs = 0;
  let tutorialAwaitingExplosion = false;

  const emitTutorialStep = (): void => {
    callbacks.onTutorialStepChange?.(
      tutorialStep === 'complete' ? null : tutorialStep,
    );
  };

  const setPhase = (nextPhase: GamePhase): void => {
    phase = nextPhase;
    callbacks.onPhaseChange?.(nextPhase);
  };

  const finishTutorial = (): void => {
    isTutorialRun = false;
    tutorialStep = 'complete';
    tutorialAwaitingExplosion = false;
    bombs = [];
    storage.markTutorialComplete();
    emitTutorialStep();
  };

  const resetRun = (): void => {
    gridSize = getGridSizeForScore(0);
    viewCells = gridSize;
    growFromCells = gridSize;
    growTimerMs = 0;
    growPauseMs = 0;
    player = getGridCenter(gridSize);
    bombs = [];
    score = 0;
    elapsedMs = 0;
    spawnTimerMs = 0;
    flashTimerMs = 0;
    explosion = new Set();
    didMoveThisTick = false;
    tutorialStepTimerMs = 0;
    tutorialAwaitingExplosion = false;
    isTutorialRun = !storage.isTutorialComplete();
    tutorialStep = isTutorialRun ? 'move' : 'complete';
    callbacks.onScoreChange?.(score);
    emitTutorialStep();
  };

  const growGrid = (): void => {
    const nextSize = getGridSizeForScore(score);
    growFromCells = gridSize;
    // Tiles are added on every side, so existing coordinates shift by the added ring.
    const shift = (nextSize - gridSize) / 2;
    player = { x: player.x + shift, y: player.y + shift };
    gridSize = nextSize;
    growTimerMs = GRID_GROW_ANIMATION_MS;
    growPauseMs = GRID_GROW_PAUSE_MS;
    spawnTimerMs = 0;
  };

  const updateGridGrowth = (deltaMs: number): void => {
    if (growTimerMs > 0) {
      growTimerMs = Math.max(0, growTimerMs - deltaMs);
      const t = 1 - growTimerMs / GRID_GROW_ANIMATION_MS;
      const eased = 1 - (1 - t) * (1 - t);
      viewCells = growFromCells + (gridSize - growFromCells) * eased;
    }
    if (growPauseMs > 0) growPauseMs = Math.max(0, growPauseMs - deltaMs);
  };

  const plantBombs = (): void => {
    if (isTutorialRun) return;

    const availableSlots = getLiveBombCap(score, gridSize) - bombs.length;
    if (availableSlots <= 0) return;

    const plans = createSpawnPlan(
      score,
      elapsedMs,
      player.x,
      player.y,
      gridSize,
    ).slice(0, availableSlots);

    for (const plan of plans) {
      bombs.push({
        id: nextBombId++,
        x: plan.x,
        y: plan.y,
        type: plan.type,
        fuseRemaining: plan.fuseTotal,
        fuseTotal: plan.fuseTotal,
      });
    }
  };

  const endRun = (): void => {
    bestScore = updateBestScore(bestScore, score);
    storage.saveBestScore(bestScore);
    callbacks.onBestScoreChange?.(bestScore);
    callbacks.onGameOver?.({ score, bestScore });
    setPhase('gameOver');
  };

  /** Returns true when the player was caught in a blast. */
  const resolveExplosions = (): boolean => {
    const exploding = bombs.filter((bomb) => bomb.fuseRemaining <= 0);
    if (exploding.length === 0) return false;

    const blastKeys = new Set<string>();
    for (const bomb of exploding) {
      for (const cell of getBlastCells(bomb.type, bomb.x, bomb.y, gridSize)) {
        blastKeys.add(cellKey(cell.x, cell.y));
      }
    }

    flashTimerMs = EXPLOSION_FLASH_MS;
    explosion = blastKeys;

    if (blastKeys.has(cellKey(player.x, player.y))) {
      bombs = bombs.filter((bomb) => bomb.fuseRemaining > 0);
      endRun();
      return true;
    }

    score = exploding.reduce((total) => incrementScore(total), score);
    callbacks.onScoreChange?.(score);

    const explodedIds = new Set(exploding.map((bomb) => bomb.id));
    bombs = bombs.filter((bomb) => !explodedIds.has(bomb.id));

    if (isTutorialRun && tutorialAwaitingExplosion) {
      tutorialAwaitingExplosion = false;
      tutorialStep = 'scored';
      tutorialStepTimerMs = 0;
      emitTutorialStep();
    }

    return false;
  };

  const advanceTutorialAfterMove = (): void => {
    if (tutorialStep === 'move') {
      tutorialStep = 'telegraph';
      bombs = [createTutorialTelegraphBomb(player, gridSize)];
      tutorialStepTimerMs = 0;
      emitTutorialStep();
      return;
    }

    if (tutorialStep === 'telegraph') {
      tutorialStep = 'escape';
      bombs = [createTutorialEscapeBomb(player)];
      tutorialAwaitingExplosion = true;
      tutorialStepTimerMs = 0;
      emitTutorialStep();
    }
  };

  const updateTutorial = (deltaMs: number, didMove: boolean): void => {
    if (!isTutorialRun || tutorialStep === 'complete') return;

    tutorialStepTimerMs += deltaMs;

    if (tutorialStep === 'move' && didMove) {
      advanceTutorialAfterMove();
      return;
    }

    if (tutorialStep === 'telegraph') {
      if (didMove || tutorialStepTimerMs >= 2500) {
        advanceTutorialAfterMove();
      }
      return;
    }

    if (tutorialStep === 'scored' && tutorialStepTimerMs >= 2200) {
      tutorialStep = 'swarmHint';
      tutorialStepTimerMs = 0;
      emitTutorialStep();
      return;
    }

    if (tutorialStep === 'swarmHint' && (didMove || tutorialStepTimerMs >= 2800)) {
      finishTutorial();
    }
  };

  const tick = (deltaMs: number): void => {
    if (phase !== 'playing') return;

    const didMove = didMoveThisTick;
    didMoveThisTick = false;

    updateTutorial(deltaMs, didMove);
    updateGridGrowth(deltaMs);

    if (!isTutorialRun) {
      elapsedMs += deltaMs;
      if (growPauseMs <= 0) spawnTimerMs += deltaMs;
    }

    if (flashTimerMs > 0) {
      flashTimerMs -= deltaMs;
      if (flashTimerMs <= 0) explosion = new Set();
    }

    for (const bomb of bombs) {
      bomb.fuseRemaining = Math.max(0, bomb.fuseRemaining - deltaMs / 1000);
    }

    if (resolveExplosions()) return;

    // Grow only once the board is clear, so no bomb is ever teleported or dropped.
    const needsGrowth = getGridSizeForScore(score) > gridSize;
    if (needsGrowth && bombs.length === 0 && growPauseMs <= 0) {
      growGrid();
    }

    if (!isTutorialRun && !needsGrowth && growPauseMs <= 0) {
      const spawnInterval = getSpawnIntervalMs(score);
      while (spawnTimerMs >= spawnInterval) {
        spawnTimerMs -= spawnInterval;
        plantBombs();
      }
    }
  };

  callbacks.onBestScoreChange?.(bestScore);
  callbacks.onPhaseChange?.(phase);
  emitTutorialStep();

  return {
    tick,
    move(direction: Direction): void {
      if (phase !== 'playing') return;
      player = applyDirection(player.x, player.y, direction, gridSize);
      didMoveThisTick = true;
    },
    start(): void {
      if (phase === 'playing') return;
      resetRun();
      setPhase('playing');
    },
    getSnapshot(): GameSnapshot {
      return {
        phase,
        gridSize,
        viewCells,
        player,
        bombs,
        threatened: getThreatenedCells(bombs, gridSize),
        explosion,
        score,
        bestScore,
        tutorialStep: tutorialStep === 'complete' ? null : tutorialStep,
      };
    },
  };
}
