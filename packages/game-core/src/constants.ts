export const GRID_SIZE_MAX = 9;

/** Grid grows by one tile on each side once the score reaches `minScore`. */
export const GRID_STAGES = [
  { minScore: 0, size: 3 },
  { minScore: 8, size: 5 },
  { minScore: 20, size: 7 },
  { minScore: 35, size: GRID_SIZE_MAX },
] as const;

export const GRID_GROW_PAUSE_MS = 700;
export const GRID_GROW_ANIMATION_MS = 450;
export const SWARM_MIN_GRID_SIZE = 5;

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


export const BEST_SCORE_KEY = 'grid-bomb-dodge-best';
