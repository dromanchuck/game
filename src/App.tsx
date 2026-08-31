import { useEffect, useRef, useState } from 'react';

import { createGameApp } from './game/create-game-app';
import type { GamePhase } from './logic/types';
import {
  getTutorialStep,
  type TutorialStepId,
} from './systems/tutorial-system';

import './App.css';

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Awaited<ReturnType<typeof createGameApp>> | null>(null);
  const [phase, setPhase] = useState<GamePhase>('title');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lastRunScore, setLastRunScore] = useState(0);
  const [tutorialStepId, setTutorialStepId] = useState<TutorialStepId | null>(null);

  const tutorialStep = tutorialStepId ? getTutorialStep(tutorialStepId) : null;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let isDisposed = false;

    void createGameApp(mount, {
      onPhaseChange: setPhase,
      onScoreChange: setScore,
      onBestScoreChange: setBestScore,
      onGameOver: ({ score: runScore }) => {
        setLastRunScore(runScore);
      },
      onTutorialStepChange: setTutorialStepId,
    }).then((game) => {
      if (isDisposed) {
        game.destroy();
        return;
      }
      gameRef.current = game;
    });

    return () => {
      isDisposed = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, []);

  const handleStart = (): void => {
    gameRef.current?.startFromTitle();
  };

  const handleRestart = (): void => {
    gameRef.current?.restartFromGameOver();
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Grid Bomb Dodge</h1>
        {phase === 'playing' && (
          <p className="app__hud">
            Escaped: <strong>{score}</strong>
          </p>
        )}
      </header>

      <main className="app__stage">
        <div ref={mountRef} className="app__canvas" />

        {phase === 'title' && (
          <section className="overlay overlay--title">
            <h2>Stay off the blast lanes</h2>
            <p>Bombs telegraph before they blow. One hit ends the run.</p>
            <button type="button" onClick={handleStart}>
              Start (Enter)
            </button>
            <p className="overlay__hint">Arrows to move. Best: {bestScore}</p>
          </section>
        )}

        {phase === 'playing' && tutorialStep && (
          <section className="overlay overlay--tutorial">
            <p className="overlay__tag">Tutorial</p>
            <h2>{tutorialStep.title}</h2>
            <p>{tutorialStep.body}</p>
          </section>
        )}

        {phase === 'gameOver' && (
          <section className="overlay overlay--game-over">
            <h2>Blasted</h2>
            <p>
              Escaped this run: <strong>{lastRunScore}</strong>
            </p>
            <p>
              Best: <strong>{bestScore}</strong>
            </p>
            <button type="button" onClick={handleRestart}>
              Restart (Enter)
            </button>
          </section>
        )}
      </main>

      <footer className="app__footer">
        <span>Lane gaps are safe. Swarms cover ~92% of the grid.</span>
      </footer>
    </div>
  );
}

export default App;
