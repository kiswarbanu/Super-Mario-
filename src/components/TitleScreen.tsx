import React from 'react';
import { Play, Trophy, RotateCcw } from 'lucide-react';
import { formatMarioScore } from '../game/rules';
import marioHeroUrl from '../assets/mario_hero.jpg';
import marioBgUrl from '../assets/mario_bg.jpg';

interface TitleScreenProps {
  highScore: number;
  onStart: () => void;
  onResetScore?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ highScore, onStart, onResetScore }) => {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-between p-6 select-none bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.45)), url(${marioBgUrl})`,
      }}
    >
      {/* Upper Spacing & High Score */}
      <div className="w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/40 px-3 py-1.5 rounded-lg border border-white/20">
          <Trophy className="w-4 h-4 text-amber-300" />
          <span className="text-amber-300">TOP-</span>
          <span className="tabular-nums tracking-widest">{formatMarioScore(highScore)}</span>
          {onResetScore && (
            <button
              type="button"
              onClick={onResetScore}
              title="Reset Best Score"
              className="ml-2 p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="font-mono text-xs sm:text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/40 px-3 py-1.5 rounded-lg border border-white/20">
          WORLD <span className="text-amber-300">1-1</span>
        </div>
      </div>

      {/* Hero Title Lockup */}
      <div className="flex flex-col items-center my-auto">
        {/* High-Resolution Mario Character Artwork */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-3 rounded-full overflow-hidden border-4 border-amber-400 shadow-[0_10px_25px_rgba(0,0,0,0.6)] animate-pulse">
          <img
            src={marioHeroUrl}
            alt="Super Mario"
            className="w-full h-full object-cover scale-105"
          />
        </div>

        {/* Bespoke 3D Retro SVG Title Lockup */}
        <div className="w-full max-w-lg px-2">
          <svg viewBox="0 0 540 140" className="w-full h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id="marioRedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff5533" />
                <stop offset="50%" stopColor="#d82800" />
                <stop offset="100%" stopColor="#880000" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffe466" />
                <stop offset="50%" stopColor="#fcb040" />
                <stop offset="100%" stopColor="#b86000" />
              </linearGradient>
            </defs>

            {/* SUPER */}
            <text
              x="270"
              y="50"
              textAnchor="middle"
              fontFamily="Impact, Arial Black, sans-serif"
              fontSize="48"
              fontWeight="900"
              letterSpacing="6"
              fill="#000000"
              stroke="#000000"
              strokeWidth="6"
              strokeLinejoin="round"
            >
              SUPER
            </text>
            <text
              x="270"
              y="48"
              textAnchor="middle"
              fontFamily="Impact, Arial Black, sans-serif"
              fontSize="48"
              fontWeight="900"
              letterSpacing="6"
              fill="url(#goldGrad)"
              stroke="#ffffff"
              strokeWidth="2"
            >
              SUPER
            </text>

            {/* MARIO */}
            <text
              x="270"
              y="118"
              textAnchor="middle"
              fontFamily="Impact, Arial Black, sans-serif"
              fontSize="76"
              fontWeight="900"
              letterSpacing="8"
              fill="#000000"
              stroke="#000000"
              strokeWidth="8"
              strokeLinejoin="round"
            >
              MARIO
            </text>
            <text
              x="270"
              y="115"
              textAnchor="middle"
              fontFamily="Impact, Arial Black, sans-serif"
              fontSize="76"
              fontWeight="900"
              letterSpacing="8"
              fill="url(#marioRedGrad)"
              stroke="#ffffff"
              strokeWidth="3"
            >
              MARIO
            </text>
          </svg>
        </div>

        {/* Start Game CTA Button */}
        <button
          type="button"
          data-start="true"
          onClick={onStart}
          className="mt-6 sm:mt-8 group relative inline-flex items-center gap-3 px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg sm:text-xl tracking-wider uppercase border-4 border-white shadow-[0_8px_0_#92400e,0_15px_20px_rgba(0,0,0,0.4)] active:translate-y-2 active:shadow-[0_0_0_#92400e] transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current text-slate-950" />
          <span>START GAME</span>
          <span className="text-xs font-mono font-bold bg-amber-500/60 px-2 py-0.5 rounded text-amber-950 ml-1">
            SPACE / ENTER
          </span>
        </button>
      </div>

      {/* Flat Control Hints (single line, safe margin) */}
      <div className="w-full text-center pb-2">
        <p className="font-mono text-xs sm:text-sm text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          <span className="text-amber-300 font-bold">WASD / Arrows</span> Move ·{' '}
          <span className="text-amber-300 font-bold">Space / Z</span> Jump ·{' '}
          <span className="text-amber-300 font-bold">Shift / X</span> Run & Fire ·{' '}
          <span className="text-amber-300 font-bold">P / Esc</span> Pause ·{' '}
          <span className="text-amber-300 font-bold">M</span> Mute
        </p>
      </div>
    </div>
  );
};
