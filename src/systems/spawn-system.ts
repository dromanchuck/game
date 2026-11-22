import {
  FUSE_BASE_SECONDS,
  FUSE_MIN_SECONDS,
  FUSE_SCORE_REDUCTION,
  GRID_SIZE_MAX,
  LIVE_BOMB_CAP_MAX,
  LIVE_BOMB_CAP_MIN,
  LIVE_BOMB_CAP_SCORE_STEP,
  SPAWN_INTERVAL_BASE_MS,
  SPAWN_INTERVAL_MIN_MS,
  SPAWN_INTERVAL_SCORE_STEP_MS,
  SWARM_BOMB_COUNT_MAX,
  SWARM_BOMB_COUNT_MIN,
  SWARM_CHANCE_BASE,
  SWARM_CHANCE_MAX,
  SWARM_CHANCE_SCORE_FACTOR,
  SWARM_CHANCE_TIME_FACTOR,
  SWARM_COVERAGE_TARGET,
  SWARM_MIN_GRID_SIZE,
} from '../constants';
import type { BombType } from '../logic/types';
import { createTargetedSwarmPlan } from './swarm-system';

export interface SpawnPlan {
  type: BombType;
  x: number;
  y: number;
  fuseTotal: number;
}

export function getFuseDuration(score: number): number {
  return Math.max(FUSE_MIN_SECONDS, FUSE_BASE_SECONDS - score * FUSE_SCORE_REDUCTION);
}

export function getLiveBombCap(
  score: number,
  gridSize: number = GRID_SIZE_MAX,
): number {
  const scoreCap = Math.min(
    LIVE_BOMB_CAP_MAX,
    LIVE_BOMB_CAP_MIN + Math.floor(score / LIVE_BOMB_CAP_SCORE_STEP),
  );
  // Small grids leave less room to dodge, so fewer simultaneous bombs.
  return Math.min(scoreCap, gridSize - 2);
}

export function getSpawnIntervalMs(score: number): number {
  return Math.max(
    SPAWN_INTERVAL_MIN_MS,
    SPAWN_INTERVAL_BASE_MS - score * SPAWN_INTERVAL_SCORE_STEP_MS,
  );
}

export function shouldSpawnSwarm(
  score: number,
  elapsedMs: number,
  gridSize: number = GRID_SIZE_MAX,
): boolean {
  if (gridSize < SWARM_MIN_GRID_SIZE) return false;
  const chance = Math.min(
    SWARM_CHANCE_MAX,
    SWARM_CHANCE_BASE + score * SWARM_CHANCE_SCORE_FACTOR + elapsedMs * SWARM_CHANCE_TIME_FACTOR,
  );
  return Math.random() < chance;
}

function pickLaneType(): BombType {
  return Math.random() < 0.5 ? 'row' : 'column';
}

function randomGridCoord(gridSize: number): number {
  return Math.floor(Math.random() * gridSize);
}

export function getSwarmBombCount(gridSize: number = GRID_SIZE_MAX): number {
  const count =
    SWARM_BOMB_COUNT_MIN +
    Math.floor(Math.random() * (SWARM_BOMB_COUNT_MAX - SWARM_BOMB_COUNT_MIN + 1));
  // Below the full grid, always leave at least one row unswept.
  return gridSize < GRID_SIZE_MAX ? Math.min(count, gridSize - 1) : count;
}

function createLaneSpawnPlan(score: number, gridSize: number): SpawnPlan {
  const fuseTotal = getFuseDuration(score);
  const type = pickLaneType();
  return {
    type,
    x: randomGridCoord(gridSize),
    y: randomGridCoord(gridSize),
    fuseTotal,
  };
}

export function createSpawnPlan(
  score: number,
  elapsedMs: number,
  playerX: number,
  playerY: number,
  gridSize: number = GRID_SIZE_MAX,
): SpawnPlan[] {
  const isSwarm = shouldSpawnSwarm(score, elapsedMs, gridSize);
  if (!isSwarm) {
    return [createLaneSpawnPlan(score, gridSize)];
  }

  return createTargetedSwarmPlan(
    playerX,
    playerY,
    score,
    getSwarmBombCount(gridSize),
    SWARM_COVERAGE_TARGET,
    gridSize,
  );
}
