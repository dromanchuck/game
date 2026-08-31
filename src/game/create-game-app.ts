import { Application, Container } from 'pixi.js';

import { createGameTextures } from '../assets/create-game-textures';
import {
  CANVAS_SIZE,
  GRID_SIZE,
  PLAYER_START,
} from '../constants';
import { getBlastCells, getThreatenedCells } from '../logic/blast';
import { incrementScore, updateBestScore } from '../logic/score';
import type { Bomb, GamePhase, PlayerState } from '../logic/types';
import { loadBestScore, saveBestScore } from '../storage/best-score';
import {
  isTutorialComplete,
  markTutorialComplete,
} from '../storage/tutorial-complete';
import {
  applyDirection,
  createInputSystem,
  type InputSystem,
} from '../systems/input-system';
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
import {
  createGrid,
  createPlayerSprite,
  setPlayerPosition,
} from './create-grid';

export interface GameCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onScoreChange: (score: number) => void;
  onBestScoreChange: (bestScore: number) => void;
  onGameOver: (payload: { score: number; bestScore: number }) => void;
  onTutorialStepChange: (stepId: TutorialStepId | null) => void;
}

export interface GameApp {
  canvas: HTMLCanvasElement;
  destroy: () => void;
  startFromTitle: () => void;
  restartFromGameOver: () => void;
}

let nextBombId = 1;

function createBombFromPlan(plan: {
  type: Bomb['type'];
  x: number;
  y: number;
  fuseTotal: number;
}): Bomb {
  return {
    id: nextBombId++,
    x: plan.x,
    y: plan.y,
    type: plan.type,
    fuseRemaining: plan.fuseTotal,
    fuseTotal: plan.fuseTotal,
  };
}

export async function createGameApp(
  mount: HTMLElement,
  callbacks: GameCallbacks,
): Promise<GameApp> {
  const app = new Application();
  await app.init({
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    background: '#14120f',
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  mount.appendChild(app.canvas);

  const textures = createGameTextures();
  const grid = createGrid(textures);
  const playerSprite = createPlayerSprite(textures);
  const world = new Container();
  world.addChild(grid.container, playerSprite);
  app.stage.addChild(world);

  let input: InputSystem = createInputSystem();
  let phase: GamePhase = 'title';
  let player: PlayerState = { ...PLAYER_START };
  let bombs: Bomb[] = [];
  let score = 0;
  let bestScore = loadBestScore();
  let elapsedMs = 0;
  let spawnTimerMs = 0;
  let flashTimerMs = 0;

  let isTutorialRun = !isTutorialComplete();
  let tutorialStep: TutorialStepId = isTutorialRun ? 'move' : 'complete';
  let tutorialStepTimerMs = 0;
  let tutorialAwaitingExplosion = false;

  const emitTutorialStep = (): void => {
    callbacks.onTutorialStepChange(
      tutorialStep === 'complete' ? null : tutorialStep,
    );
  };

  const finishTutorial = (): void => {
    isTutorialRun = false;
    tutorialStep = 'complete';
    tutorialAwaitingExplosion = false;
    bombs = [];
    markTutorialComplete();
    emitTutorialStep();
  };

  const resetRun = (): void => {
    player = { ...PLAYER_START };
    bombs = [];
    score = 0;
    elapsedMs = 0;
    spawnTimerMs = 0;
    flashTimerMs = 0;
    tutorialStepTimerMs = 0;
    tutorialAwaitingExplosion = false;
    isTutorialRun = !isTutorialComplete();
    tutorialStep = isTutorialRun ? 'move' : 'complete';
    setPlayerPosition(playerSprite, player.x, player.y);
    grid.setBombs([]);
    grid.setTelegraphCells(new Set());
    grid.flashExplosion(new Set());
    callbacks.onScoreChange(score);
    emitTutorialStep();
  };

  const setPhase = (nextPhase: GamePhase): void => {
    phase = nextPhase;
    callbacks.onPhaseChange(nextPhase);
  };

  const startRun = (): void => {
    resetRun();
    setPhase('playing');
  };

  const endRun = (): void => {
    bestScore = updateBestScore(bestScore, score);
    saveBestScore(bestScore);
    callbacks.onBestScoreChange(bestScore);
    callbacks.onGameOver({ score, bestScore });
    setPhase('gameOver');
  };

  const plantBombs = (): void => {
    if (isTutorialRun) return;

    const cap = getLiveBombCap(score);
    const availableSlots = cap - bombs.length;
    if (availableSlots <= 0) return;

    const plans = createSpawnPlan(score, elapsedMs, player.x, player.y).slice(
      0,
      availableSlots,
    );
    for (const plan of plans) {
      bombs.push(createBombFromPlan(plan));
    }
  };

  const resolveExplosions = (): boolean => {
    const exploding = bombs.filter((bomb) => bomb.fuseRemaining <= 0);
    if (exploding.length === 0) return false;

    const blastKeys = new Set<string>();
    for (const bomb of exploding) {
      for (const cell of getBlastCells(bomb.type, bomb.x, bomb.y, GRID_SIZE)) {
        blastKeys.add(`${cell.x},${cell.y}`);
      }
    }

    flashTimerMs = 180;
    grid.flashExplosion(blastKeys);

    const playerKey = `${player.x},${player.y}`;
    if (blastKeys.has(playerKey)) {
      endRun();
      bombs = bombs.filter((bomb) => bomb.fuseRemaining > 0);
      grid.setBombs(bombs);
      return true;
    }

    score = exploding.reduce((total) => incrementScore(total), score);
    callbacks.onScoreChange(score);

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
      bombs = [createTutorialTelegraphBomb(player)];
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

  app.ticker.add((ticker) => {
    const deltaMs = ticker.deltaMS;

    if (phase === 'title') {
      if (input.consumeStart()) {
        startRun();
      }
      return;
    }

    if (phase === 'gameOver') {
      if (input.consumeRestart()) {
        startRun();
      }
      return;
    }

    const direction = input.consumeDirection();
    const didMove = direction !== null;
    if (direction) {
      player = applyDirection(player.x, player.y, direction, GRID_SIZE);
      setPlayerPosition(playerSprite, player.x, player.y);
    }

    updateTutorial(deltaMs, didMove);

    if (!isTutorialRun) {
      elapsedMs += deltaMs;
      spawnTimerMs += deltaMs;
    }

    if (flashTimerMs > 0) {
      flashTimerMs -= deltaMs;
      if (flashTimerMs <= 0) {
        grid.flashExplosion(new Set());
      }
    }

    for (const bomb of bombs) {
      bomb.fuseRemaining = Math.max(0, bomb.fuseRemaining - deltaMs / 1000);
    }

    const died = resolveExplosions();
    if (died || phase !== 'playing') return;

    if (!isTutorialRun) {
      const spawnInterval = getSpawnIntervalMs(score);
      while (spawnTimerMs >= spawnInterval) {
        spawnTimerMs -= spawnInterval;
        plantBombs();
      }
    }

    const threatened = getThreatenedCells(bombs, GRID_SIZE);
    grid.setTelegraphCells(threatened);
    grid.setBombs(bombs);
  });

  setPlayerPosition(playerSprite, player.x, player.y);
  callbacks.onBestScoreChange(bestScore);
  callbacks.onPhaseChange(phase);
  emitTutorialStep();

  return {
    canvas: app.canvas,
    startFromTitle: startRun,
    restartFromGameOver: startRun,
    destroy(): void {
      input.destroy();
      app.destroy(true, { children: true });
    },
  };
}
