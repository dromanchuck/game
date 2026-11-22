# Grid Bomb Dodge

A keyboard arcade prototype built with React, TypeScript, and Pixi.js.

Move on a 9x9 grid, read telegraphed bomb lanes, and survive as long as you can. One hit ends the run. Your score is the number of bombs you outlast.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Controls

- **Enter** — start / restart
- **Arrow keys** — move one tile per press

On your **first run**, a short in-game tutorial walks through movement, reading telegraphs, escaping, and scoring.

## Difficulty

- The grid **grows with your score**: 3×3 → 5×5 (8 pts) → 7×7 (20) → 9×9 (35). Growth happens once the board is clear, with a short pause. Thresholds live in `GRID_STAGES` (`src/constants.ts`).
- Live bomb cap scales with grid size; swarms appear from 5×5.

- **Swarms** target your position and sweep rows until ~**92%** of the grid is red (7–9 bombs). With a full 9-bomb swarm the board can go **100%** — move early.
- We use **92% as the default target** instead of always 100%: still brutal, but an occasional 1-tile gap keeps deaths feeling like near-misses rather than pure RNG.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm test` — unit tests for blast and spawn logic
- `npm run preview` — preview production build

## Architecture

- **React** — title screen, HUD, game-over overlay
- **Pixi.js** — grid rendering, ticker-driven game loop, sprites
- **Pure logic modules** — blast coverage, score, spawn tuning (Vitest)

Art is procedural pixel canvas textures (no external sprite pack required for the prototype).
