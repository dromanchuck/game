import { GRID_STAGES } from '../constants';

export function getGridSizeForScore(score: number): number {
  let size: number = GRID_STAGES[0].size;
  for (const stage of GRID_STAGES) {
    if (score >= stage.minScore) size = stage.size;
  }
  return size;
}

export function getGridCenter(gridSize: number): { x: number; y: number } {
  const center = Math.floor(gridSize / 2);
  return { x: center, y: center };
}
