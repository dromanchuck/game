import { TUTORIAL_COMPLETE_KEY } from '../constants';

export function isTutorialComplete(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_COMPLETE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTutorialComplete(): void {
  try {
    localStorage.setItem(TUTORIAL_COMPLETE_KEY, '1');
  } catch {
    // Ignore storage failures in prototype mode.
  }
}
