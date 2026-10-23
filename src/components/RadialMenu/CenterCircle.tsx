import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Image as ImageIcon, Sparkles, ArrowRight, Loader2, 
  CheckCircle2, AlertCircle, File 
} from 'lucide-react';
import { DroppedFileInfo, RadialSliceItem } from '../../types';

interface CenterCircleProps {
  fileInfo: DroppedFileInfo | null;
  hoveredSlice: RadialSliceItem | null;
  isConverting: boolean;
  conversionSuccess: boolean;
  conversionError: string | null;
  radius?: number;
  center?: number;
}

export const CenterCircle: React.FC<CenterCircleProps> = ({
  fileInfo,
  hoveredSlice,
  isConverting,
  conversionSuccess,
  conversionError,
  radius = 80,
  center = 250,
}) => {
  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none"
      style={{
        left: `${center - radius}px`,
        top: `${center - radius}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
    >
      {/* Outer Glow Halo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-md"
        style={{
          background: hoveredSlice
            ? hoveredSlice.color
            : 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(139,92,246,0.3) 70%, transparent 100%)',
          opacity: hoveredSlice ? 0.8 : 0.45,
        }}
        animate={{
          scale: hoveredSlice ? [1, 1.08, 1] : [1, 1.04, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: hoveredSlice ? 1.5 : 3,
          ease: 'easeInOut',
        }}
      />

      {/* Main Glass Center Disc */}
      <div 
        className="relative z-10 w-full h-full rounded-full border flex flex-col items-center justify-center p-3 text-center transition-colors duration-300 backdrop-blur-xl shadow-2xl"
        style={{
          backgroundColor: hoveredSlice 
            ? 'rgba(15, 23, 42, 0.92)' 
            : 'rgba(17, 24, 39, 0.88)',
          borderColor: hoveredSlice 
            ? hoveredSlice.color 
            : 'rgba(255, 255, 255, 0.22)',
          boxShadow: hoveredSlice 
            ? `0 0 25px ${hoveredSlice.color}40, inset 0 0 15px ${hoveredSlice.color}30` 
            : '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(255, 255, 255, 0.05)',
        }}
      >
        <AnimatePresence mode="wait">
          {/* 1. Converting State */}
          {isConverting ? (
            <motion.div
              key="converting"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-1" />
              <span className="text-xs font-semibold text-blue-200">Processing...</span>
            </motion.div>
          ) : conversionSuccess ? (
            /* 2. Success State */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center text-emerald-400"
            >
              <CheckCircle2 className="w-9 h-9 mb-1 drop-shadow-md" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300">Done!</span>
            </motion.div>
          ) : conversionError ? (
            /* 3. Error State */
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center text-rose-400 px-1"
            >
              <AlertCircle className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-medium leading-tight text-rose-300">Failed</span>
            </motion.div>
          ) : hoveredSlice ? (
            /* 4. Hover State: Target Format or Action Name */
            <motion.div
              key={`hover-${hoveredSlice.id}`}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center"
            >
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center mb-1 text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: hoveredSlice.color }}
              >
                <ArrowRight size={11} strokeWidth={3} />
              </div>

              {/* Action / Format Name Header */}
              <span
                className="font-extrabold text-base tracking-wide leading-tight drop-shadow font-sans uppercase"
                style={{ color: hoveredSlice.color }}
              >
                {hoveredSlice.label}
              </span>

              {/* Sub-label */}
              <span className="text-[9px] uppercase tracking-wider text-slate-300/80 mt-0.5 font-mono">
                {hoveredSlice.type === 'format' ? 'Convert to' : hoveredSlice.type === 'web3' ? 'Web3 Action' : 'Quick Tool'}
              </span>
            </motion.div>
          ) : (
            /* 5. Idle / Drag State: File Size and File Details */
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-1">
                {fileInfo?.category === 'pdf' ? (
                  <FileText className="w-6 h-6 text-red-400" />
                ) : fileInfo?.category === 'image' ? (
                  <ImageIcon className="w-6 h-6 text-emerald-400" />
                ) : (
                  <File className="w-6 h-6 text-blue-400" />
                )}
                <span className="absolute -bottom-1 -right-2 px-1 py-0.2 text-[8px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700 uppercase">
                  {fileInfo?.extension ? fileInfo.extension.replace('.', '') : 'FILE'}
                </span>
              </div>

              {/* File Size (e.g. 1.1 MB, 1.2 MB) */}
              <span className="font-extrabold text-lg text-white tracking-tight font-sans drop-shadow leading-none mt-1">
                {fileInfo?.formattedSize || '1.1 MB'}
              </span>

              {/* Prompt tag */}
              <span className="text-[9px] text-slate-400 font-medium tracking-wide mt-1 text-center max-w-[110px] truncate">
                {fileInfo?.name || 'Drop to convert'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
