import { describe, expect, it } from 'vitest';

import { GRID_SIZE, SWARM_COVERAGE_TARGET } from '../constants';
import { getThreatenedCells } from '../logic/blast';
import {
  countSafeCells,
  createTargetedSwarmPlan,
  getCoverageRatio,
} from '../systems/swarm-system';

describe('targeted swarms', () => {
  it('starts with the player row', () => {
    const plans = createTargetedSwarmPlan(4, 4, 0, 9);
    expect(plans[0]).toMatchObject({ type: 'row', y: 4 });
  });

  it('covers at least the configured target with nine bombs', () => {
    const plans = createTargetedSwarmPlan(4, 4, 0, 9, SWARM_COVERAGE_TARGET);
    const ratio = getCoverageRatio(getThreatenedCells(plans, GRID_SIZE), GRID_SIZE);

    expect(ratio).toBeGreaterThanOrEqual(SWARM_COVERAGE_TARGET);
    expect(countSafeCells(plans, GRID_SIZE)).toBeLessThanOrEqual(7);
  });

  it('can fully blanket the grid with nine row sweeps', () => {
    const plans = createTargetedSwarmPlan(4, 4, 0, 9, 1);
    expect(countSafeCells(plans, GRID_SIZE)).toBe(0);
  });
});
