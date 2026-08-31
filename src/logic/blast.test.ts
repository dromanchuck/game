import { describe, expect, it } from 'vitest';

import { cellKey, getBlastCells, getThreatenedCells, isCellSafe } from './blast';
import { incrementScore, updateBestScore } from './score';

describe('blast logic', () => {
  it('paints a full row for row bombs', () => {
    const cells = getBlastCells('row', 2, 4, 9);
    expect(cells).toHaveLength(9);
    expect(cells.every((cell) => cell.y === 4)).toBe(true);
  });

  it('paints a full column for column bombs', () => {
    const cells = getBlastCells('column', 3, 1, 9);
    expect(cells).toHaveLength(9);
    expect(cells.every((cell) => cell.x === 3)).toBe(true);
  });

  it('paints center plus neighbors for plus bombs', () => {
    const cells = getBlastCells('plus', 4, 4, 9);
    expect(cells.map((cell) => cellKey(cell.x, cell.y)).sort()).toEqual(
      ['3,4', '4,3', '4,4', '4,5', '5,4'].sort(),
    );
  });

  it('merges threatened cells from multiple bombs', () => {
    const threatened = getThreatenedCells(
      [
        { type: 'row', x: 0, y: 2 },
        { type: 'column', x: 4, y: 0 },
      ],
      9,
    );
    expect(threatened.has('0,2')).toBe(true);
    expect(threatened.has('4,2')).toBe(true);
    expect(threatened.has('4,0')).toBe(true);
    expect(isCellSafe(1, 1, threatened)).toBe(true);
  });
});

describe('score logic', () => {
  it('increments escaped bomb count', () => {
    expect(incrementScore(3)).toBe(4);
  });

  it('updates best score only when run beats it', () => {
    expect(updateBestScore(7, 12)).toBe(12);
    expect(updateBestScore(12, 9)).toBe(12);
  });
});
