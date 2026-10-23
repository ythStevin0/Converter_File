import React from 'react';
import { MenuRingMode } from '../../types';
import { RefreshCw, Wand2, FileCode } from 'lucide-react';

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
    <div className="flex items-center justify-center gap-2 mt-4 z-20">
      <div 
        onClick={onToggle}
        className="flex items-center bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-blue-500/50 p-1 rounded-full cursor-pointer transition-all duration-200 shadow-xl backdrop-blur-md group"
      >
        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            mode === 'format'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode size={13} />
          <span>Formats ({formatCount})</span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            mode === 'quick-action'
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 size={13} />
          <span>Quick Actions & Web3 ({toolCount})</span>
        </button>

        <div className="px-2 py-0.5 text-[10px] font-mono text-slate-400 border-l border-slate-700 ml-1 flex items-center gap-1">
          <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[9px] border border-slate-700">Tab</kbd>
          <span>to switch</span>
        </div>
      </div>
    </div>
  );
};
