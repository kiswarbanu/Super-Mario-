import React from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react';
import { GameStats } from '../game/types';
import { formatMarioCoins, formatMarioScore, formatMarioTime } from '../game/rules';

interface HUDProps {
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onTogglePause,
  onRestart,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none select-none p-3 sm:p-5">
      <div className="max-w-5xl mx-auto flex items-start justify-between">
        {/* Retro Status Cluster */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono font-bold text-white text-xs sm:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
          {/* MARIO & SCORE */}
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-amber-300 tracking-wider">MARIO</span>
            <span className="tabular-nums tracking-widest text-sm sm:text-lg">
              {formatMarioScore(stats.score)}
            </span>
          </div>

          {/* COINS */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs text-amber-300 tracking-wider">COINS</span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-3.5 bg-amber-400 rounded-sm border border-amber-600 shadow-inner" />
              <span className="tabular-nums text-sm sm:text-lg">
                x{formatMarioCoins(stats.coins)}
              </span>
            </div>
          </div>

          {/* WORLD */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs text-amber-300 tracking-wider">WORLD</span>
            <span className="tracking-widest text-sm sm:text-lg">{stats.world}</span>
          </div>

          {/* TIME */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs text-amber-300 tracking-wider">TIME</span>
            <span
              className={`tabular-nums tracking-widest text-sm sm:text-lg ${
                stats.time < 60 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}
            >
              {formatMarioTime(stats.time)}
            </span>
          </div>

          {/* LIVES */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs text-amber-300 tracking-wider">LIVES</span>
            <div className="flex items-center gap-1 text-sm sm:text-lg">
              <span className="text-red-500">❤️</span>
              <span className="tabular-nums">x{stats.lives}</span>
            </div>
          </div>

          {/* POWERUP BADGE */}
          {stats.marioSize !== 'small' && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/50 border border-white/20 text-xs text-yellow-300">
              <span>{stats.marioSize === 'fire' ? '🔥 FIRE' : '⭐ SUPER'}</span>
            </div>
          )}
        </div>

        {/* Top-Right Control Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mute [M] */}
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            tabIndex={-1}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 border border-white/20 text-white transition-colors cursor-pointer active:scale-95 shadow-lg"
            title="Toggle Audio (M)"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Pause [P / Esc] */}
          {stats.status === 'playing' && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              tabIndex={-1}
              aria-label="Pause game"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 border border-white/20 text-white transition-colors cursor-pointer active:scale-95 shadow-lg"
              title="Pause (P / Esc)"
            >
              <Pause className="w-5 h-5 text-amber-300" />
            </button>
          )}

          {/* Prominent Reset Game [R] Button */}
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            tabIndex={-1}
            aria-label="Reset game"
            className="h-9 sm:h-10 px-3 sm:px-4 flex items-center gap-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-mono font-bold text-xs sm:text-sm border-2 border-white/40 transition-all cursor-pointer active:scale-95 shadow-lg"
            title="Reset Game (R)"
          >
            <RotateCcw className="w-4 h-4 text-white" />
            <span className="tracking-wide">RESET</span>
            <span className="hidden sm:inline text-[10px] bg-red-800/80 px-1 py-0.5 rounded text-red-200">R</span>
          </button>
        </div>
      </div>
    </div>
  );
};
