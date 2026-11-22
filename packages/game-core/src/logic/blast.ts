import type { BombType, Cell } from './types';

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getBlastCells(
  type: BombType,
  x: number,
  y: number,
  gridSize: number,
): Cell[] {
  const cells: Cell[] = [];

  switch (type) {
    case 'row':
      for (let cx = 0; cx < gridSize; cx += 1) {
        cells.push({ x: cx, y });
      }
      break;
    case 'column':
      for (let cy = 0; cy < gridSize; cy += 1) {
        cells.push({ x, y: cy });
      }
      break;
    case 'plus':
      cells.push({ x, y });
      if (x > 0) cells.push({ x: x - 1, y });
      if (x < gridSize - 1) cells.push({ x: x + 1, y });
      if (y > 0) cells.push({ x, y: y - 1 });
      if (y < gridSize - 1) cells.push({ x, y: y + 1 });
      break;
  }

  return cells;
}

export function getThreatenedCells(
  bombs: ReadonlyArray<{ type: BombType; x: number; y: number }>,
  gridSize: number,
): Set<string> {
  const threatened = new Set<string>();

  for (const bomb of bombs) {
    for (const cell of getBlastCells(bomb.type, bomb.x, bomb.y, gridSize)) {
      threatened.add(cellKey(cell.x, cell.y));
    }
  }

  return threatened;
}

export function isCellSafe(
  x: number,
  y: number,
  threatened: ReadonlySet<string>,
): boolean {
  return !threatened.has(cellKey(x, y));
}
