import {
  createGameEngine,
  type GameCallbacks,
} from '@grid-bomb-dodge/game-core';
import { Application, Container } from 'pixi.js';

import { createGameTextures } from '../assets/create-game-textures';
import { CANVAS_SIZE, CELL_SIZE } from '../render-constants';
import { localGameStorage } from '../storage/local-storage';
import { createInputSystem, type InputSystem } from '../systems/input-system';
import { createGrid, createPlayerSprite, setPlayerPosition } from './create-grid';

export interface GameApp {
  canvas: HTMLCanvasElement;
  destroy: () => void;
  startFromTitle: () => void;
  restartFromGameOver: () => void;
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

  const engine = createGameEngine({ storage: localGameStorage, callbacks });
  const input: InputSystem = createInputSystem();
  let renderedGridSize = 0;
  let renderedExplosion: ReadonlySet<string> | null = null;

  app.ticker.add((ticker) => {
    const { phase } = engine.getSnapshot();

    if (phase !== 'playing') {
      if (input.consumeStart()) engine.start();
    } else {
      const direction = input.consumeDirection();
      if (direction) engine.move(direction);
      engine.tick(ticker.deltaMS);
    }

    const snapshot = engine.getSnapshot();

    if (snapshot.gridSize !== renderedGridSize) {
      renderedGridSize = snapshot.gridSize;
      grid.setGridSize(snapshot.gridSize);
    }

    // Keep the grid centered and fit `viewCells` tiles into the fixed canvas.
    const scale = CANVAS_SIZE / (snapshot.viewCells * CELL_SIZE);
    world.scale.set(scale);
    world.x = (CANVAS_SIZE - snapshot.gridSize * CELL_SIZE * scale) / 2;
    world.y = world.x;

    setPlayerPosition(playerSprite, snapshot.player.x, snapshot.player.y);
    grid.setTelegraphCells(snapshot.threatened);
    grid.setBombs(snapshot.bombs);
    if (snapshot.explosion !== renderedExplosion) {
      renderedExplosion = snapshot.explosion;
      grid.flashExplosion(snapshot.explosion);
    }
  });

  return {
    canvas: app.canvas,
    startFromTitle: engine.start,
    restartFromGameOver: engine.start,
    destroy(): void {
      input.destroy();
      app.destroy(true, { children: true });
    },
  };
}
