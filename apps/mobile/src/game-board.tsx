import {
  cellKey,
  type GameSnapshot,
} from '@grid-bomb-dodge/game-core';
import {
  Canvas,
  Circle,
  Rect,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import { memo } from 'react';
import { Platform } from 'react-native';

const COLORS = {
  background: '#14120f',
  floor: '#353027',
  floorEdge: '#2a261f',
  telegraph: 'rgba(194, 59, 46, 0.55)',
  explosion: 'rgba(255, 180, 60, 0.9)',
  bomb: '#ffd36a',
  fuse: '#e07a28',
  label: '#14120f',
  player: '#7dffb3',
  playerFoot: '#4fbf82',
  eye: '#14120f',
} as const;

interface GameBoardProps {
  snapshot: GameSnapshot;
  size: number;
}

function GameBoardView({ snapshot, size }: GameBoardProps) {
  const { gridSize, viewCells, player, bombs, threatened, explosion } = snapshot;
  const cell = size / viewCells;
  const origin = (size - gridSize * cell) / 2;
  const inset = Math.max(1, cell * 0.04);
  const font = matchFont({
    fontFamily: Platform.select({ ios: 'Courier New', default: 'monospace' }),
    fontSize: cell * 0.32,
    fontWeight: 'bold',
  });

  const tiles = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = cellKey(x, y);
      const left = origin + x * cell;
      const top = origin + y * cell;
      tiles.push(
        <Rect
          key={`floor-${key}`}
          x={left + inset}
          y={top + inset}
          width={cell - inset * 2}
          height={cell - inset * 2}
          color={COLORS.floor}
        />,
      );
      if (threatened.has(key)) {
        tiles.push(
          <Rect
            key={`threat-${key}`}
            x={left}
            y={top}
            width={cell}
            height={cell}
            color={COLORS.telegraph}
          />,
        );
      }
      if (explosion.has(key)) {
        tiles.push(
          <Rect
            key={`boom-${key}`}
            x={left}
            y={top}
            width={cell}
            height={cell}
            color={COLORS.explosion}
          />,
        );
      }
    }
  }

  const playerLeft = origin + player.x * cell;
  const playerTop = origin + player.y * cell;

  return (
    <Canvas style={{ width: size, height: size, backgroundColor: COLORS.background }}>
      {tiles}
      {bombs.map((bomb) => {
        const cx = origin + (bomb.x + 0.5) * cell;
        const cy = origin + (bomb.y + 0.5) * cell;
        return (
          <Circle key={`bomb-${bomb.id}`} cx={cx} cy={cy + cell * 0.04} r={cell * 0.3} color={COLORS.bomb} />
        );
      })}
      {font &&
        bombs.map((bomb) => (
          <SkiaText
            key={`fuse-${bomb.id}`}
            x={origin + (bomb.x + 0.5) * cell - cell * 0.09}
            y={origin + (bomb.y + 0.5) * cell + cell * 0.14}
            text={Math.ceil(bomb.fuseRemaining).toString()}
            font={font}
            color={COLORS.label}
          />
        ))}
      <Rect
        x={playerLeft + cell * 0.3}
        y={playerTop + cell * 0.17}
        width={cell * 0.42}
        height={cell * 0.5}
        color={COLORS.player}
      />
      <Rect
        x={playerLeft + cell * 0.33}
        y={playerTop + cell * 0.63}
        width={cell * 0.34}
        height={cell * 0.2}
        color={COLORS.playerFoot}
      />
      <Rect x={playerLeft + cell * 0.4} y={playerTop + cell * 0.3} width={cell * 0.06} height={cell * 0.06} color={COLORS.eye} />
      <Rect x={playerLeft + cell * 0.56} y={playerTop + cell * 0.3} width={cell * 0.06} height={cell * 0.06} color={COLORS.eye} />
    </Canvas>
  );
}

export const GameBoard = memo(GameBoardView);
