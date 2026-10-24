/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { GameStats, InputState } from './game/types';
import { soundChip } from './game/audio';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { StatusModal } from './components/StatusModal';
import { TouchControls } from './components/TouchControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    lives: 3,
    time: 400,
    world: '1-1',
    highScore: 10000,
    status: 'title',
    marioSize: 'small',
    invincible: false,
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const inputStateRef = useRef<InputState>({
    left: false,
    right: false,
    down: false,
    jump: false,
    jumpPressed: false,
    action: false,
    actionPressed: false,
  });

  // Keep track of keys held to avoid repeats triggering edge presses
  const keysHeld = useRef<Set<string>>(new Set());

  // Mount canvas and engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution: 512 x 240 (classic retro widescreen 16:7.5)
    canvas.width = 512;
    canvas.height = 240;

    const engine = new GameEngine(canvas, (newStats) => {
      setStats(newStats);
    });
    engineRef.current = engine;
    engine.runLoop();

    // Check ?autostart=1 query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.start();
    } else {
      document.body.dataset.state = 'title';
    }

    return () => {
      engine.destroy();
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling page with game controls
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Title screen quick-start
      if (stats.status === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          handleStartGame();
          return;
        }
      }

      // Toggle Mute [M]
      if (e.code === 'KeyM') {
        toggleMute();
        return;
      }

      // Toggle Pause [P or Escape]
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (stats.status === 'playing') {
          engineRef.current?.pause();
        } else if (stats.status === 'paused') {
          engineRef.current?.resume();
        }
        return;
      }

      // Restart [R]
      if (e.code === 'KeyR') {
        handleRestart();
        return;
      }

      const isFirstPress = !keysHeld.current.has(e.code);
      keysHeld.current.add(e.code);

      const input = inputStateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        input.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        input.right = true;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        input.down = true;
      }
      if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        input.jump = true;
        if (isFirstPress) {
          input.jumpPressed = true;
        }
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX' || e.code === 'KeyJ') {
        input.action = true;
        if (isFirstPress) {
          input.actionPressed = true;
        }
      }

      engineRef.current?.setInput({ ...input });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);

      const input = inputStateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        input.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        input.right = false;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        input.down = false;
      }
      if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        input.jump = false;
        input.jumpPressed = false;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX' || e.code === 'KeyJ') {
        input.action = false;
        input.actionPressed = false;
      }

      engineRef.current?.setInput({ ...input });
    };

    const handleWindowBlur = () => {
      // Clear all pressed keys on focus loss so keys never stick
      keysHeld.current.clear();
      inputStateRef.current = {
        left: false,
        right: false,
        down: false,
        jump: false,
        jumpPressed: false,
        action: false,
        actionPressed: false,
      };
      engineRef.current?.setInput({ ...inputStateRef.current });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [stats.status]);

  const handleStartGame = () => {
    // Blur any focused DOM button
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    engineRef.current?.start();
  };

  const handleTogglePause = () => {
    if (stats.status === 'playing') {
      engineRef.current?.pause();
    } else if (stats.status === 'paused') {
      engineRef.current?.resume();
    }
  };

  const [resetToast, setResetToast] = useState(false);

  const handleRestart = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    engineRef.current?.start();
    setResetToast(true);
    setTimeout(() => setResetToast(false), 1200);
  };

  const handleResetScore = () => {
    localStorage.removeItem('super_mario_high_score');
    setStats((prev) => ({ ...prev, highScore: 0 }));
    setResetToast(true);
    setTimeout(() => setResetToast(false), 1200);
  };

  const handleTitle = () => {
    setStats((prev) => ({ ...prev, status: 'title' }));
    document.body.dataset.state = 'title';
    soundChip.stopMusic();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundChip.setMuted(next);
  };

  const handleTouchInput = (updater: (prev: InputState) => InputState) => {
    inputStateRef.current = updater(inputStateRef.current);
    engineRef.current?.setInput({ ...inputStateRef.current });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#5c94fc] flex items-center justify-center select-none font-sans">
      {/* 1. Isolated Canvas Mount (Never torn down) */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          data-testid="mario-canvas"
          className="w-full h-full object-cover pixelated cursor-crosshair"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Reset Confirmation Toast */}
      {resetToast && (
        <div className="fixed top-20 z-50 pointer-events-none px-4 py-2 rounded-xl bg-red-600 border-2 border-white text-white font-mono font-black text-sm shadow-[0_8px_16px_rgba(0,0,0,0.5)] animate-bounce tracking-wider">
          🔄 GAME RESET!
        </div>
      )}

      {/* 2. In-Game HUD (Visible during gameplay & paused) */}
      {stats.status !== 'title' && (
        <HUD
          stats={stats}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onTogglePause={handleTogglePause}
          onRestart={handleRestart}
        />
      )}

      {/* 3. Title Screen Overlay */}
      {stats.status === 'title' && (
        <TitleScreen
          highScore={stats.highScore}
          onStart={handleStartGame}
          onResetScore={handleResetScore}
        />
      )}

      {/* 4. Outcome-Matched Status Modal (Paused / Victory / Game Over) */}
      <StatusModal
        stats={stats}
        onResume={() => engineRef.current?.resume()}
        onRestart={handleRestart}
        onTitle={handleTitle}
      />

      {/* 5. Mobile / Tablet Virtual Controls */}
      {stats.status === 'playing' && (
        <TouchControls onInputUpdate={handleTouchInput} onReset={handleRestart} />
      )}
    </div>
  );
}
