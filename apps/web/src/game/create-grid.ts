import { Container, Sprite, Text } from 'pixi.js';

import type { GameTextures } from '../assets/create-game-textures';
import { GRID_SIZE_MAX, type Bomb } from '@grid-bomb-dodge/game-core';

import { CELL_SIZE } from '../render-constants';

export interface GridView {
  container: Container;
  setGridSize: (size: number) => void;
  setTelegraphCells: (keys: ReadonlySet<string>) => void;
  setBombs: (bombs: ReadonlyArray<Bomb>) => void;
  flashExplosion: (keys: ReadonlySet<string>) => void;
}

export function createGrid(textures: GameTextures): GridView {
  const container = new Container();
  const floorLayer = new Container();
  const telegraphLayer = new Container();
  const bombLayer = new Container();
  const flashLayer = new Container();

  container.addChild(floorLayer, telegraphLayer, bombLayer, flashLayer);

  const telegraphPool: Sprite[] = [];
  const bombSprites = new Map<number, { sprite: Sprite; label: Text }>();
  const flashPool: Sprite[] = [];
  const floorTiles: Sprite[] = [];

  for (let y = 0; y < GRID_SIZE_MAX; y += 1) {
    for (let x = 0; x < GRID_SIZE_MAX; x += 1) {
      const tile = new Sprite(textures.floor);
      tile.x = x * CELL_SIZE;
      tile.y = y * CELL_SIZE;
      floorLayer.addChild(tile);
      floorTiles.push(tile);
    }
  }

  const acquireTelegraph = (): Sprite => {
    const sprite = telegraphPool.pop() ?? new Sprite(textures.telegraph);
    sprite.visible = true;
    telegraphLayer.addChild(sprite);
    return sprite;
  };

  const releaseTelegraphs = (): void => {
    while (telegraphLayer.children.length > 0) {
      const sprite = telegraphLayer.removeChildAt(0) as Sprite;
      sprite.visible = false;
      telegraphPool.push(sprite);
    }
  };

  const releaseFlashes = (): void => {
    while (flashLayer.children.length > 0) {
      const sprite = flashLayer.removeChildAt(0) as Sprite;
      sprite.visible = false;
      flashPool.push(sprite);
    }
  };

  return {
    container,
    setGridSize(size: number): void {
      for (let y = 0; y < GRID_SIZE_MAX; y += 1) {
        for (let x = 0; x < GRID_SIZE_MAX; x += 1) {
          floorTiles[y * GRID_SIZE_MAX + x].visible = x < size && y < size;
        }
      }
    },
    setTelegraphCells(keys: ReadonlySet<string>): void {
      releaseTelegraphs();
      for (const key of keys) {
        const [xRaw, yRaw] = key.split(',');
        const x = Number.parseInt(xRaw, 10);
        const y = Number.parseInt(yRaw, 10);
        const sprite = acquireTelegraph();
        sprite.x = x * CELL_SIZE;
        sprite.y = y * CELL_SIZE;
      }
    },
    setBombs(bombs: ReadonlyArray<Bomb>): void {
      const liveIds = new Set(bombs.map((bomb) => bomb.id));

      for (const [id, entry] of bombSprites) {
        if (!liveIds.has(id)) {
          bombLayer.removeChild(entry.sprite);
          bombLayer.removeChild(entry.label);
          entry.sprite.destroy();
          entry.label.destroy();
          bombSprites.delete(id);
        }
      }

      for (const bomb of bombs) {
        let entry = bombSprites.get(bomb.id);
        if (!entry) {
          const sprite = new Sprite(textures.bomb);
          const label = new Text({
            text: '',
            style: {
              fill: '#14120f',
              fontFamily: 'Courier New, monospace',
              fontSize: 14,
              fontWeight: '700',
            },
          });
          label.anchor.set(0.5);
          bombLayer.addChild(sprite, label);
          entry = { sprite, label };
          bombSprites.set(bomb.id, entry);
        }

        entry.sprite.x = bomb.x * CELL_SIZE;
        entry.sprite.y = bomb.y * CELL_SIZE;
        entry.label.x = bomb.x * CELL_SIZE + CELL_SIZE / 2;
        entry.label.y = bomb.y * CELL_SIZE + CELL_SIZE / 2;
        entry.label.text = Math.ceil(bomb.fuseRemaining).toString();
      }
    },
    flashExplosion(keys: ReadonlySet<string>): void {
      releaseFlashes();
      for (const key of keys) {
        const [xRaw, yRaw] = key.split(',');
        const x = Number.parseInt(xRaw, 10);
        const y = Number.parseInt(yRaw, 10);
        const sprite = flashPool.pop() ?? new Sprite(textures.explosion);
        sprite.visible = true;
        sprite.x = x * CELL_SIZE;
        sprite.y = y * CELL_SIZE;
        flashLayer.addChild(sprite);
      }
    },
  };
}

export function createPlayerSprite(textures: GameTextures): Sprite {
  const sprite = new Sprite(textures.player);
  sprite.label = 'PlayerSprite';
  return sprite;
}

export function setPlayerPosition(sprite: Sprite, x: number, y: number): void {
  sprite.x = x * CELL_SIZE;
  sprite.y = y * CELL_SIZE;
}
