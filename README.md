# Grid Bomb Dodge

A keyboard arcade prototype built with React, TypeScript, and Pixi.js.

Move on a 9x9 grid, read telegraphed bomb lanes, and survive as long as you can. One hit ends the run. Your score is the number of bombs you outlast.

## Run locally

```bash
npm install
npm run dev      # web, usually http://localhost:5173
npm run mobile   # Expo dev server (scan the QR code with Expo Go)
```

## Controls

- **Enter** — start / restart
- **Arrow keys** (web) / **swipe** (mobile) — move one tile per press

On your **first run**, a short in-game tutorial walks through movement, reading telegraphs, escaping, and scoring.

## Difficulty

- The grid **grows with your score**: 3×3 → 5×5 (8 pts) → 7×7 (20) → 9×9 (35). Growth happens once the board is clear, with a short pause. Thresholds live in `GRID_STAGES` (`src/constants.ts`).
- Live bomb cap scales with grid size; swarms appear from 5×5.

- **Swarms** target your position and sweep rows until ~**92%** of the grid is red (7–9 bombs). With a full 9-bomb swarm the board can go **100%** — move early.
- We use **92% as the default target** instead of always 100%: still brutal, but an occasional 1-tile gap keeps deaths feeling like near-misses rather than pure RNG.

## Scripts

- `npm run dev` — web dev server
- `npm run build` — production web build
- `npm run mobile` — Expo dev server for the mobile app
- `npm test` — unit tests for game-core
- `npm run typecheck` — typecheck all workspaces
- `npm run lint` — oxlint

## Architecture

npm workspaces monorepo:

- `packages/game-core` — platform-agnostic TypeScript: constants, blast/score/grid logic, spawn/swarm/tutorial systems and `createGameEngine` (a headless simulation driven by `tick`, `move`, `start`, with injected `GameStorage`). Vitest tests live here.
- `apps/web` — React UI + Pixi.js renderer, keyboard input, `localStorage`.
- `apps/mobile` — Expo / React Native app with a Skia renderer, swipe input and AsyncStorage.

Both apps only render `engine.getSnapshot()` and forward input, so gameplay changes go in `game-core` once.

Web art is procedural pixel canvas textures; mobile draws the same look with Skia primitives.
