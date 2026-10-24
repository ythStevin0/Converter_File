import React from 'react';
import { MenuRingMode } from '../../types';
import { Layers, Zap } from 'lucide-react';

interface RingToggleProps {
  mode: MenuRingMode;
  onToggle: () => void;
  formatCount: number;
  toolCount: number;
}

export const RingToggle: React.FC<RingToggleProps> = ({
  mode,
  onToggle,
  formatCount,
  toolCount,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-3 z-20 select-none">
      <div 
        onClick={onToggle}
        className="flex items-center p-1 rounded-full cursor-pointer transition-all duration-200 shadow-xl backdrop-blur-2xl group border border-[#94a3b8]/60"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75), 0 0 16px rgba(34, 197, 94, 0.25)',
        }}
      >
        <button
          type="button"
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
            mode === 'format'
              ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow-md font-black'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Layers size={12} strokeWidth={2.4} />
          <span className={mode === 'format' ? '!text-black' : ''}>Formats ({formatCount})</span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
            mode === 'quick-action'
              ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow-md font-black'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Zap size={12} strokeWidth={2.4} />
          <span className={mode === 'quick-action' ? '!text-black' : ''}>Quick Actions ({toolCount})</span>
        </button>

        <div className="px-2.5 py-0.5 text-[10px] font-mono text-slate-400 border-l border-slate-600/60 ml-1 flex items-center gap-1.5">
          <kbd className="bg-slate-900 text-[#4ade80] px-1.5 py-0.5 rounded text-[9px] border border-slate-600 font-mono font-bold shadow-xs">Tab</kbd>
          <span className="text-[10px] font-medium text-slate-300">ganti</span>
        </div>
      </div>
    </div>
  );
};
