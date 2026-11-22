export type BombType = 'row' | 'column' | 'plus';

export interface Cell {
  x: number;
  y: number;
}

export interface Bomb {
  id: number;
  x: number;
  y: number;
  type: BombType;
  fuseRemaining: number;
  fuseTotal: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GamePhase = 'title' | 'playing' | 'gameOver';

export interface PlayerState {
  x: number;
  y: number;
}
