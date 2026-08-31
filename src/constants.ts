export const GRID_SIZE = 9;
export const CELL_SIZE = 48;
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

export const FUSE_BASE_SECONDS = 2.0;
export const FUSE_MIN_SECONDS = 1.4;
export const FUSE_SCORE_REDUCTION = 0.05;

export const LIVE_BOMB_CAP_MIN = 2;
export const LIVE_BOMB_CAP_MAX = 6;
export const LIVE_BOMB_CAP_SCORE_STEP = 3;

export const SPAWN_INTERVAL_BASE_MS = 2200;
export const SPAWN_INTERVAL_MIN_MS = 900;
export const SPAWN_INTERVAL_SCORE_STEP_MS = 120;

export const SWARM_CHANCE_BASE = 0.14;
export const SWARM_CHANCE_MAX = 0.45;
export const SWARM_CHANCE_SCORE_FACTOR = 0.025;
export const SWARM_CHANCE_TIME_FACTOR = 1 / 90_000;
export const SWARM_BOMB_COUNT_MIN = 8;
export const SWARM_BOMB_COUNT_MAX = 9;

/** Target ~92% board coverage — brutal but leaves rare escape gaps for skill/restart loop. */
export const SWARM_COVERAGE_TARGET = 0.92;

export const TUTORIAL_FUSE_SECONDS = 4;
export const TUTORIAL_COMPLETE_KEY = 'grid-bomb-dodge-tutorial-complete';

export const PLAYER_START = {
  x: Math.floor(GRID_SIZE / 2),
  y: Math.floor(GRID_SIZE / 2),
} as const;

export const BEST_SCORE_KEY = 'grid-bomb-dodge-best';
