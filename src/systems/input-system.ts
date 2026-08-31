export type Direction = 'up' | 'down' | 'left' | 'right';

export interface InputSystem {
  consumeDirection: () => Direction | null;
  consumeStart: () => boolean;
  consumeRestart: () => boolean;
  destroy: () => void;
}

const DIRECTION_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function createInputSystem(): InputSystem {
  let pendingDirection: Direction | null = null;
  let pendingStart = false;
  let pendingRestart = false;

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;

    const direction = DIRECTION_KEYS[event.key];
    if (direction) {
      pendingDirection = direction;
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter') {
      pendingStart = true;
      pendingRestart = true;
      event.preventDefault();
    }
  };

  window.addEventListener('keydown', onKeyDown);

  return {
    consumeDirection(): Direction | null {
      const direction = pendingDirection;
      pendingDirection = null;
      return direction;
    },
    consumeStart(): boolean {
      const start = pendingStart;
      pendingStart = false;
      return start;
    },
    consumeRestart(): boolean {
      const restart = pendingRestart;
      pendingRestart = false;
      return restart;
    },
    destroy(): void {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}

export function applyDirection(
  x: number,
  y: number,
  direction: Direction,
  gridSize: number,
): { x: number; y: number } {
  switch (direction) {
    case 'up':
      return { x, y: Math.max(0, y - 1) };
    case 'down':
      return { x, y: Math.min(gridSize - 1, y + 1) };
    case 'left':
      return { x: Math.max(0, x - 1), y };
    case 'right':
      return { x: Math.min(gridSize - 1, x + 1), y };
  }
}
