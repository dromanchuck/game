import { Texture } from 'pixi.js';

import { CELL_SIZE } from '../constants';

export interface GameTextures {
  floor: Texture;
  player: Texture;
  bomb: Texture;
  telegraph: Texture;
  explosion: Texture;
}

function createCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = CELL_SIZE;
  canvas.height = CELL_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context for textures');
  }
  ctx.imageSmoothingEnabled = false;
  draw(ctx, CELL_SIZE);
  return Texture.from(canvas);
}

export function createGameTextures(): GameTextures {
  const floor = createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#2a261f';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#3d372c';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, 0, 2, size);
    ctx.fillStyle = '#1e1b16';
    ctx.fillRect(size - 2, 0, 2, size);
    ctx.fillRect(0, size - 2, size, 2);
    ctx.fillStyle = '#353027';
    ctx.fillRect(4, 4, size - 8, size - 8);
  });

  const player = createCanvasTexture((ctx) => {
    ctx.fillStyle = '#7dffb3';
    ctx.fillRect(14, 8, 20, 24);
    ctx.fillStyle = '#4fbf82';
    ctx.fillRect(16, 30, 16, 10);
    ctx.fillStyle = '#efe6d4';
    ctx.fillRect(18, 14, 4, 4);
    ctx.fillRect(26, 14, 4, 4);
    ctx.fillStyle = '#14120f';
    ctx.fillRect(19, 15, 2, 2);
    ctx.fillRect(27, 15, 2, 2);
  });

  const bomb = createCanvasTexture((ctx, size) => {
    ctx.fillStyle = '#ffd36a';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 + 2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e07a28';
    ctx.fillRect(size / 2 - 2, 8, 4, 8);
    ctx.fillStyle = '#c23b2e';
    ctx.fillRect(size / 2 - 1, 4, 2, 6);
  });

  const telegraph = createCanvasTexture((ctx, size) => {
    ctx.fillStyle = 'rgba(194, 59, 46, 0.45)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255, 120, 90, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);
  });

  const explosion = createCanvasTexture((ctx, size) => {
    ctx.fillStyle = 'rgba(255, 180, 60, 0.85)';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#fff2a8';
    ctx.fillRect(10, 10, size - 20, size - 20);
  });

  return { floor, player, bomb, telegraph, explosion };
}
