import type { Direction } from '@grid-bomb-dodge/game-core';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, type PanResponderInstance } from 'react-native';

const SWIPE_THRESHOLD_PX = 18;

/** Fires one move per touch as soon as the finger travels past the threshold. */
export function useSwipe(onSwipe: (direction: Direction) => void): PanResponderInstance {
  const onSwipeRef = useRef(onSwipe);
  const firedRef = useRef(false);

  useEffect(() => {
    onSwipeRef.current = onSwipe;
  });

  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        firedRef.current = false;
      },
      onPanResponderMove: (_event, { dx, dy }) => {
        if (firedRef.current) return;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return;
        firedRef.current = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          onSwipeRef.current(dx > 0 ? 'right' : 'left');
        } else {
          onSwipeRef.current(dy > 0 ? 'down' : 'up');
        }
      },
    }),
  );

  return responder;
}
