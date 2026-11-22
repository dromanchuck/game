import { describe, expect, it } from 'vitest';

import { getGridCenter, getGridSizeForScore } from './grid-size';

describe('grid size progression', () => {
  it('grows through 3, 5, 7, 9 by score', () => {
    expect(getGridSizeForScore(0)).toBe(3);
    expect(getGridSizeForScore(7)).toBe(3);
    expect(getGridSizeForScore(8)).toBe(5);
    expect(getGridSizeForScore(20)).toBe(7);
    expect(getGridSizeForScore(35)).toBe(9);
    expect(getGridSizeForScore(500)).toBe(9);
  });

  it('centers the player', () => {
    expect(getGridCenter(3)).toEqual({ x: 1, y: 1 });
    expect(getGridCenter(9)).toEqual({ x: 4, y: 4 });
  });
});
