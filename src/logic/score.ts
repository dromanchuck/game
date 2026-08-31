export function incrementScore(currentScore: number): number {
  return currentScore + 1;
}

export function updateBestScore(currentBest: number, runScore: number): number {
  return Math.max(currentBest, runScore);
}
