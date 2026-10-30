import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Image as ImageIcon, Loader2, 
  CheckCircle2, AlertCircle, File
} from 'lucide-react';
import { DroppedFileInfo, RadialSliceItem } from '../../types';

interface CenterCircleProps {
  fileInfo: DroppedFileInfo | null;
  selectedFormat?: string;
  hoveredSlice: RadialSliceItem | null;
  isConverting: boolean;
  conversionSuccess: boolean;
  conversionError: string | null;
  onClearError?: () => void;
  radius?: number;
  center?: number;
}

export const CenterCircle: React.FC<CenterCircleProps> = ({
  fileInfo,
  selectedFormat,
  hoveredSlice,
  isConverting,
  conversionSuccess,
  conversionError,
  onClearError,
  radius = 80,
  center = 250,
}) => {
  const currentFormat = selectedFormat || (fileInfo?.extension ? fileInfo.extension.replace('.', '').toUpperCase() : 'DOCX');
  const activeLabel = hoveredSlice ? hoveredSlice.label : currentFormat;
  const isHovered = Boolean(hoveredSlice);

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none select-none z-20"
      style={{
        left: `${center - radius}px`,
        top: `${center - radius}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
    >
      {/* Omnitrix Radioactive Ambient Halo Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isHovered
            ? 'radial-gradient(circle, rgba(74, 222, 128, 0.55) 0%, rgba(34, 197, 94, 0.25) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.15) 50%, transparent 75%)',
          filter: 'blur(16px)',
        }}
        animate={{
          scale: isHovered ? [1, 1.08, 1] : [1, 1.03, 1],
          opacity: isHovered ? 0.95 : 0.7,
        }}
        transition={{
          repeat: Infinity,
          duration: isHovered ? 1.8 : 3,
          ease: 'easeInOut',
        }}
      />

      {/* Main Omnitrix Raised Bezel & Dial Collar (Light Grey + Dark Dial) */}
      <div 
        className="relative z-10 w-full h-full rounded-full flex flex-col items-center justify-center p-2.5 text-center transition-all duration-200"
        style={{
          background: 'radial-gradient(circle, #1e293b 0%, #0a0f1d 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '3px solid #cbd5e1',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(34, 197, 94, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Raised Inner Slit Ring (Omnitrix Bezel Ring) */}
        <div className="absolute inset-1.5 rounded-full border border-slate-500/50 pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* 1. Converting State */}
          {isConverting ? (
            <motion.div
              key="converting"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-7 h-7 text-[#22c55e] animate-spin mb-1" strokeWidth={2.6} />
              <span className="text-[10px] font-black text-[#86efac] tracking-wide uppercase">
                Mengonversi
              </span>
            </motion.div>
          ) : conversionSuccess ? (
            /* 2. Success State (Omnitrix Dial Activation) */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="flex flex-col items-center text-[#22c55e]"
            >
              <CheckCircle2 className="w-8 h-8 text-[#22c55e] mb-0.5" strokeWidth={2.6} />
              <span className="text-[11px] font-black tracking-wider uppercase text-[#86efac]">
                Selesai
              </span>
            </motion.div>
          ) : conversionError && !hoveredSlice ? (
            /* 3. Error State (Clickable to dismiss) */
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              onClick={onClearError}
              className="flex flex-col items-center text-rose-400 px-2 cursor-pointer pointer-events-auto"
              title="Klik untuk menutup pesan gagal"
            >
              <AlertCircle className="w-6 h-6 text-rose-500 mb-0.5" />
              <span className="text-[10px] font-extrabold text-rose-300 tracking-wide">Gagal</span>
              <span className="text-[8px] text-slate-400 leading-tight truncate max-w-[95px] mt-0.5">
                {conversionError}
              </span>
            </motion.div>
          ) : (
            /* 4. Normal Dial State: Instant & In-Sync Format Pill with Metallic Silver Rivet */
            <motion.div
              key="dial-core"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center"
            >
              {/* Omnitrix Core Pill with Metallic Silver Rivet */}
              <div 
                className={`px-3.5 py-1.5 rounded-full flex items-center justify-center gap-1.5 shadow-lg border border-white transition-all duration-150 ${
                  isHovered ? 'scale-105' : 'scale-100'
                }`}
                style={{
                  background: 'linear-gradient(to right, #4ade80, #22c55e, #16a34a)',
                  boxShadow: isHovered
                    ? '0 0 18px rgba(34, 197, 94, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                    : '0 0 14px rgba(34, 197, 94, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                }}
              >
                {/* Omnitrix Metallic Silver Core Rivet */}
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40 shrink-0" />
                <span className="font-black text-sm tracking-wide uppercase !text-black font-sans leading-none">
                  {activeLabel}
                </span>
              </div>

              {/* File Info Tabular Size underneath */}
              <span className="text-[10px] font-mono font-bold text-[#86efac] tracking-tight mt-1.5 tabular-nums">
                {fileInfo?.formattedSize || '1.1 MB'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
