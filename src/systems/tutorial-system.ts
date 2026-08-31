import { GRID_SIZE, TUTORIAL_FUSE_SECONDS } from '../constants';
import type { Bomb, PlayerState } from '../logic/types';
import type { SpawnPlan } from './spawn-system';

export type TutorialStepId =
  | 'move'
  | 'telegraph'
  | 'escape'
  | 'scored'
  | 'swarmHint'
  | 'complete';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  body: string;
}

export const TUTORIAL_STEPS: Record<Exclude<TutorialStepId, 'complete'>, TutorialStep> = {
  move: {
    id: 'move',
    title: 'Step 1 — Move',
    body: 'Press an arrow key to step one tile on the grid.',
  },
  telegraph: {
    id: 'telegraph',
    title: 'Step 2 — Read the red',
    body: 'Red tiles show where a bomb will explode. The number is seconds left.',
  },
  escape: {
    id: 'escape',
    title: 'Step 3 — Escape',
    body: 'Move off every red tile before the fuse hits zero.',
  },
  scored: {
    id: 'scored',
    title: 'Step 4 — Score',
    body: 'Each explosion you survive adds +1 to Escaped.',
  },
  swarmHint: {
    id: 'swarmHint',
    title: 'Step 5 — Swarms',
    body: 'Swarms cover almost the whole grid. If you see one, move immediately.',
  },
};

let tutorialBombId = -1;

export function createTutorialBomb(plan: SpawnPlan): Bomb {
  tutorialBombId -= 1;
  return {
    id: tutorialBombId,
    x: plan.x,
    y: plan.y,
    type: plan.type,
    fuseRemaining: plan.fuseTotal,
    fuseTotal: plan.fuseTotal,
  };
}

export function createTutorialTelegraphBomb(player: PlayerState): Bomb {
  const laneY = (player.y + 2) % GRID_SIZE;
  return createTutorialBomb({
    type: 'row',
    x: 0,
    y: laneY,
    fuseTotal: TUTORIAL_FUSE_SECONDS,
  });
}

export function createTutorialEscapeBomb(player: PlayerState): Bomb {
  return createTutorialBomb({
    type: 'row',
    x: 0,
    y: player.y,
    fuseTotal: TUTORIAL_FUSE_SECONDS,
  });
}

export function getTutorialStep(stepId: TutorialStepId): TutorialStep | null {
  if (stepId === 'complete') return null;
  return TUTORIAL_STEPS[stepId];
}
