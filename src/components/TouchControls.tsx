import React from 'react';
import { ArrowLeft, ArrowRight, Zap, ArrowUp } from 'lucide-react';
import { InputState } from '../game/types';

interface TouchControlsProps {
  onInputUpdate: (updater: (prev: InputState) => InputState) => void;
  onReset: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputUpdate, onReset }) => {
  const handleTouch = (key: keyof InputState, value: boolean, isPress: boolean = false) => {
    onInputUpdate((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'jump' && value) next.jumpPressed = true;
      if (key === 'action' && value) next.actionPressed = true;
      return next;
    });
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 pointer-events-none select-none px-4 flex justify-between items-end sm:hidden">
      {/* Directional Pad (Left / Right) */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Move Left"
          onTouchStart={() => handleTouch('left', true)}
          onTouchEnd={() => handleTouch('left', false)}
          onMouseDown={() => handleTouch('left', true)}
          onMouseUp={() => handleTouch('left', false)}
          className="w-14 h-14 rounded-2xl bg-black/60 active:bg-black/80 border-2 border-white/30 text-white flex items-center justify-center shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          type="button"
          aria-label="Move Right"
          onTouchStart={() => handleTouch('right', true)}
          onTouchEnd={() => handleTouch('right', false)}
          onMouseDown={() => handleTouch('right', true)}
          onMouseUp={() => handleTouch('right', false)}
          className="w-14 h-14 rounded-2xl bg-black/60 active:bg-black/80 border-2 border-white/30 text-white flex items-center justify-center shadow-lg active:scale-95"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Middle Reset Button for Mobile */}
      <div className="pointer-events-auto mb-1">
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 rounded-xl bg-red-600/90 active:bg-red-500 border border-white/40 text-white font-mono font-bold text-xs shadow-lg active:scale-95 flex items-center gap-1"
        >
          <span>RESET</span>
        </button>
      </div>

      {/* Action Buttons: [B] Run/Fire, [A] Jump */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* B: Run / Fireball */}
        <button
          type="button"
          aria-label="Run or Shoot Fireball (B)"
          onTouchStart={() => handleTouch('action', true, true)}
          onTouchEnd={() => handleTouch('action', false)}
          onMouseDown={() => handleTouch('action', true, true)}
          onMouseUp={() => handleTouch('action', false)}
          className="w-14 h-14 rounded-full bg-red-600/80 active:bg-red-600 border-2 border-white/40 text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span className="text-[10px] font-mono font-bold">B</span>
        </button>

        {/* A: Jump */}
        <button
          type="button"
          aria-label="Jump (A)"
          onTouchStart={() => handleTouch('jump', true, true)}
          onTouchEnd={() => handleTouch('jump', false)}
          onMouseDown={() => handleTouch('jump', true, true)}
          onMouseUp={() => handleTouch('jump', false)}
          className="w-16 h-16 rounded-full bg-emerald-600/80 active:bg-emerald-600 border-3 border-white/50 text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
        >
          <ArrowUp className="w-7 h-7" />
          <span className="text-[11px] font-mono font-bold">A</span>
        </button>
      </div>
    </div>
  );
};
