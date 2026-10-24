import React from 'react';
import { Play, RotateCcw, Home, Award, Skull, Pause } from 'lucide-react';
import { GameStats } from '../game/types';
import { formatMarioScore, formatMarioTime } from '../game/rules';

interface StatusModalProps {
  stats: GameStats;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  stats,
  onResume,
  onRestart,
  onTitle,
}) => {
  if (stats.status === 'playing' || stats.status === 'title') {
    return null;
  }

  const isPaused = stats.status === 'paused';
  const isVictory = stats.status === 'victory';
  const isGameOver = stats.status === 'gameover';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none select-none">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border-4 border-amber-400 p-6 sm:p-8 text-center shadow-[0_15px_30px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-150">
        {/* Status Header */}
        <div className="flex flex-col items-center mb-6">
          {isPaused && (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-400/20 flex items-center justify-center mb-2">
                <Pause className="w-6 h-6 text-amber-300" />
              </div>
              <h2 className="font-mono text-3xl font-black text-amber-300 tracking-wider">PAUSED</h2>
              <p className="text-xs font-mono text-slate-400 mt-1">Press ESC or P to resume</p>
            </>
          )}

          {isVictory && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 animate-bounce">
                <Award className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="font-mono text-3xl font-black text-emerald-400 tracking-wider">
                STAGE CLEAR!
              </h2>
              <p className="text-sm font-mono text-emerald-200/90 mt-1">
                You reached the Castle! 🏰
              </p>
            </>
          )}

          {isGameOver && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                <Skull className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="font-mono text-3xl font-black text-red-500 tracking-wider">
                GAME OVER
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Keep practicing your jumps!
              </p>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono bg-slate-950/70 p-4 rounded-xl border border-white/10">
          <div className="flex flex-col text-left">
            <span className="text-[11px] text-slate-400">FINAL SCORE</span>
            <span className="text-xl font-bold text-white tabular-nums">
              {formatMarioScore(stats.score)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[11px] text-slate-400">BEST SCORE</span>
            <span className="text-xl font-bold text-amber-300 tabular-nums">
              {formatMarioScore(stats.highScore)}
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] text-slate-400">COINS EARNED</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">
              🪙 x{stats.coins}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[11px] text-slate-400">TIME REMAINING</span>
            <span className="text-lg font-bold text-white tabular-nums">
              ⏱️ {formatMarioTime(stats.time)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {isPaused && (
            <button
              type="button"
              data-start="true"
              onClick={onResume}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base tracking-wider uppercase border-2 border-white cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>RESUME GAME</span>
            </button>
          )}

          {(isVictory || isGameOver) && (
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base tracking-wider uppercase border-2 border-white cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{isVictory ? 'PLAY AGAIN' : 'TRY AGAIN'}</span>
            </button>
          )}

          <div className="flex gap-2">
            {isPaused && (
              <button
                type="button"
                onClick={onRestart}
                className="flex-1 py-2.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold text-sm border border-red-400 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Game</span>
              </button>
            )}

            <button
              type="button"
              onClick={onTitle}
              className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Title Screen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
