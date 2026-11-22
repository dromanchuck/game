import {
  BEST_SCORE_KEY,
  TUTORIAL_COMPLETE_KEY,
  type GameStorage,
} from '@grid-bomb-dodge/game-core';

export const localGameStorage: GameStorage = {
  loadBestScore(): number {
    try {
      const raw = localStorage.getItem(BEST_SCORE_KEY);
      if (raw === null) return 0;
      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  },
  saveBestScore(score: number): void {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    } catch {
      // Ignore storage failures in prototype mode.
    }
  },
  isTutorialComplete(): boolean {
    try {
      return localStorage.getItem(TUTORIAL_COMPLETE_KEY) === '1';
    } catch {
      return false;
    }
  },
  markTutorialComplete(): void {
    try {
      localStorage.setItem(TUTORIAL_COMPLETE_KEY, '1');
    } catch {
      // Ignore storage failures in prototype mode.
    }
  },
};
