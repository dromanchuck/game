import {
  GRID_SIZE_MAX,
  SWARM_COVERAGE_TARGET,
} from '../constants';
import { cellKey, getBlastCells, getThreatenedCells } from '../logic/blast';
import type { BombType } from '../logic/types';
import type { SpawnPlan } from './spawn-system';
import { getFuseDuration } from './spawn-system';

export function getCoverageRatio(
  threatened: ReadonlySet<string>,
  gridSize: number = GRID_SIZE_MAX,
): number {
  return threatened.size / (gridSize * gridSize);
}

function isSameBomb(a: SpawnPlan, b: SpawnPlan): boolean {
  return a.type === b.type && a.x === b.x && a.y === b.y;
}

function buildSwarmCandidates(fuseTotal: number, gridSize: number): SpawnPlan[] {
  const candidates: SpawnPlan[] = [];

  for (let y = 0; y < gridSize; y += 1) {
    candidates.push({ type: 'row', x: 0, y, fuseTotal });
  }
  for (let x = 0; x < gridSize; x += 1) {
    candidates.push({ type: 'column', x, y: 0, fuseTotal });
  }
  for (let y = 1; y < gridSize - 1; y += 1) {
    for (let x = 1; x < gridSize - 1; x += 1) {
      candidates.push({ type: 'plus', x, y, fuseTotal });
    }
  }

  return candidates;
}

function pickBestCandidate(
  plans: SpawnPlan[],
  candidates: SpawnPlan[],
  gridSize: number,
): SpawnPlan | null {
  const threatened = getThreatenedCells(plans, gridSize);
  let bestCandidate: SpawnPlan | null = null;
  let bestGain = 0;

  for (const candidate of candidates) {
    if (plans.some((plan) => isSameBomb(plan, candidate))) continue;

    const trialThreatened = getThreatenedCells([...plans, candidate], gridSize);
    const gain = trialThreatened.size - threatened.size;
    if (gain > bestGain) {
      bestGain = gain;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function sortRowsForPlayer(playerY: number, gridSize: number): number[] {
  return Array.from({ length: gridSize }, (_, y) => y).sort((a, b) => {
    if (a === playerY) return -1;
    if (b === playerY) return 1;
    return a - b;
  });
}

/**
 * Swarms sweep rows first (player row immediately), then columns/plus bombs
 * until the coverage target is met or the bomb cap is reached.
 */
export function createTargetedSwarmPlan(
  playerX: number,
  playerY: number,
  score: number,
  maxBombs: number,
  coverageTarget: number = SWARM_COVERAGE_TARGET,
  gridSize: number = GRID_SIZE_MAX,
): SpawnPlan[] {
  const fuseTotal = getFuseDuration(score);
  const plans: SpawnPlan[] = [];

  for (const y of sortRowsForPlayer(playerY, gridSize)) {
    if (plans.length >= maxBombs) break;
    plans.push({ type: 'row', x: 0, y, fuseTotal });
  }

  if (plans.length < maxBombs) {
    plans.push({ type: 'column', x: playerX, y: 0, fuseTotal });
  }

  const candidates = buildSwarmCandidates(fuseTotal, gridSize);
  let threatened = getThreatenedCells(plans, gridSize);

  while (
    plans.length < maxBombs &&
    getCoverageRatio(threatened, gridSize) < coverageTarget
  ) {
    const next = pickBestCandidate(plans, candidates, gridSize);
    if (!next) break;
    plans.push(next);
    threatened = getThreatenedCells(plans, gridSize);
  }

  return plans.slice(0, maxBombs);
}

export function countSafeCells(
  plans: ReadonlyArray<{ type: BombType; x: number; y: number }>,
  gridSize: number = GRID_SIZE_MAX,
): number {
  const threatened = getThreatenedCells(plans, gridSize);
  let safe = 0;
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!threatened.has(cellKey(x, y))) safe += 1;
    }
  }
  return safe;
}

export function getBlastCellsForPlan(plan: SpawnPlan, gridSize: number = GRID_SIZE_MAX) {
  return getBlastCells(plan.type, plan.x, plan.y, gridSize);
}
