import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BEST_SCORE_KEY,
  TUTORIAL_COMPLETE_KEY,
  type GameStorage,
} from '@grid-bomb-dodge/game-core';

/**
 * The engine reads storage synchronously, so values are preloaded once and
 * writes go to memory immediately and to AsyncStorage in the background.
 */
export async function createAsyncGameStorage(): Promise<GameStorage> {
  let bestScore = 0;
  let tutorialComplete = false;

  try {
    const [best, tutorial] = await Promise.all([
      AsyncStorage.getItem(BEST_SCORE_KEY),
      AsyncStorage.getItem(TUTORIAL_COMPLETE_KEY),
    ]);
    const parsed = best === null ? 0 : Number.parseInt(best, 10);
    bestScore = Number.isFinite(parsed) ? parsed : 0;
    tutorialComplete = tutorial === '1';
  } catch {
    // Fall back to defaults if storage is unavailable.
  }

  return {
    loadBestScore: () => bestScore,
    saveBestScore(score: number): void {
      bestScore = score;
      void AsyncStorage.setItem(BEST_SCORE_KEY, String(score)).catch(() => {});
    },
    isTutorialComplete: () => tutorialComplete,
    markTutorialComplete(): void {
      tutorialComplete = true;
      void AsyncStorage.setItem(TUTORIAL_COMPLETE_KEY, '1').catch(() => {});
    },
  };
}
