import {
  getTutorialStep,
  type GameStorage,
  type TutorialStepId,
} from '@grid-bomb-dodge/game-core';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { createAsyncGameStorage } from './src/async-storage';
import { GameBoard } from './src/game-board';
import { useGame } from './src/use-game';
import { useSwipe } from './src/use-swipe';

const MAX_BOARD_SIZE = 480;
const BOARD_MARGIN = 16;

const MOBILE_TUTORIAL_BODY: Partial<Record<TutorialStepId, string>> = {
  move: 'Swipe anywhere to step one tile on the grid.',
};

function Game({ storage }: { storage: GameStorage }) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - BOARD_MARGIN * 2, MAX_BOARD_SIZE);
  const { snapshot, start, move } = useGame(storage);
  const swipe = useSwipe(move);

  if (!snapshot) return null;

  const tutorial = snapshot.tutorialStep ? getTutorialStep(snapshot.tutorialStep) : null;
  const tutorialBody = tutorial
    ? (MOBILE_TUTORIAL_BODY[tutorial.id] ?? tutorial.body)
    : null;

  return (
    <View style={styles.screen} {...swipe.panHandlers}>
      <Text style={styles.title}>Grid Bomb Dodge</Text>
      <Text style={styles.hud}>
        {snapshot.phase === 'playing' ? `Escaped: ${snapshot.score}` : ' '}
      </Text>

      <View style={{ width: boardSize, height: boardSize }}>
        <GameBoard snapshot={snapshot} size={boardSize} />

        {snapshot.phase === 'title' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Stay off the blast lanes</Text>
            <Text style={styles.overlayText}>
              Bombs telegraph before they blow. One hit ends the run.
            </Text>
            <Pressable style={styles.button} onPress={start}>
              <Text style={styles.buttonText}>Start</Text>
            </Pressable>
            <Text style={styles.overlayHint}>Swipe to move. Best: {snapshot.bestScore}</Text>
          </View>
        )}

        {snapshot.phase === 'gameOver' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Blasted</Text>
            <Text style={styles.overlayText}>Escaped this run: {snapshot.score}</Text>
            <Text style={styles.overlayText}>Best: {snapshot.bestScore}</Text>
            <Pressable style={styles.button} onPress={start}>
              <Text style={styles.buttonText}>Restart</Text>
            </Pressable>
          </View>
        )}
      </View>

      {snapshot.phase === 'playing' && tutorial && (
        <View style={[styles.tutorial, { width: boardSize }]}>
          <Text style={styles.tutorialTag}>Tutorial</Text>
          <Text style={styles.overlayTitle}>{tutorial.title}</Text>
          <Text style={styles.overlayText}>{tutorialBody}</Text>
        </View>
      )}

      <Text style={styles.footer}>Lane gaps are safe. Swarms cover ~92% of the grid.</Text>
    </View>
  );
}

export default function App() {
  const [storage, setStorage] = useState<GameStorage | null>(null);

  useEffect(() => {
    void createAsyncGameStorage().then(setStorage);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      {storage ? <Game storage={storage} /> : <View style={styles.screen} />}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14120f',
    gap: 12,
  },
  title: { color: '#efe6d4', fontSize: 24, fontWeight: '700' },
  hud: { color: '#ffd36a', fontSize: 18, fontWeight: '600' },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
    backgroundColor: 'rgba(20, 18, 15, 0.82)',
  },
  overlayTitle: { color: '#efe6d4', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  overlayText: { color: '#d8cdb8', fontSize: 15, textAlign: 'center' },
  overlayHint: { color: '#9a8f78', fontSize: 13 },
  button: {
    backgroundColor: '#7dffb3',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#14120f', fontSize: 17, fontWeight: '700' },
  tutorial: {
    padding: 12,
    gap: 4,
    borderRadius: 8,
    backgroundColor: '#2a261f',
  },
  tutorialTag: { color: '#ffd36a', fontSize: 12, textTransform: 'uppercase' },
  footer: { color: '#9a8f78', fontSize: 12 },
});
