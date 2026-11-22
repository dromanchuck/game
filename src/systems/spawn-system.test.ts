import { describe, expect, it } from 'vitest';

import {
  getFuseDuration,
  getLiveBombCap,
  getSpawnIntervalMs,
  getSwarmBombCount,
  shouldSpawnSwarm,
} from '../systems/spawn-system';

describe('spawn system tuning', () => {
  it('shortens fuse as score rises', () => {
    expect(getFuseDuration(0)).toBe(2);
    expect(getFuseDuration(20)).toBe(1.4);
  });

  it('raises live bomb cap with score', () => {
    expect(getLiveBombCap(0)).toBe(2);
    expect(getLiveBombCap(9)).toBe(5);
    expect(getLiveBombCap(30)).toBe(6);
  });

  it('accelerates spawn interval with score', () => {
    expect(getSpawnIntervalMs(0)).toBe(2200);
    expect(getSpawnIntervalMs(10)).toBe(1000);
  });

  it('limits live bombs and disables swarms on small grids', () => {
    expect(getLiveBombCap(30, 3)).toBe(1);
    expect(getLiveBombCap(30, 5)).toBe(3);
    expect(shouldSpawnSwarm(100, 600_000, 3)).toBe(false);
    expect(getSwarmBombCount(5)).toBeLessThanOrEqual(4);
  });
});
