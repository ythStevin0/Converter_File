import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2, Check, ArrowRight } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';
import { triggerBrowserDownload } from '../../utils/fileHelpers';

interface CompressModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

export const CompressModal: React.FC<CompressModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const [quality, setQuality] = useState<number>(75);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Enter' && !isProcessing) {
        handleApply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, quality, onClose]);

  // Estimation based on quality percentage
  const originalBytes = fileInfo.size;
  const estimatedSavingsPercent = Math.round(100 - quality * 0.95);
  const estimatedNewBytes = Math.round(originalBytes * (1 - estimatedSavingsPercent / 100));

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleApply = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (window.electronAPI && typeof window.electronAPI.compressImage === 'function') {
        const res = await window.electronAPI.compressImage({
          sourceFilePath: fileInfo.path,
          quality,
        });

        if (res.success) {
          onSuccess(res);
          onClose();
        } else {
          alert('Gagal mengompres: ' + res.error);
        }
      } else {
        // Browser fallback using Canvas compression
        if (fileInfo.file && fileInfo.file.type.startsWith('image/')) {
          const img = new Image();
          const objectUrl = URL.createObjectURL(fileInfo.file);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = objectUrl;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');
          ctx.drawImage(img, 0, 0);

          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', quality / 100)
          );
          URL.revokeObjectURL(objectUrl);

          if (!blob) throw new Error('Blob compression failed');

          const baseName = fileInfo.name.replace(/\.[^.]+$/, '');
          const outputName = `${baseName} Compressed.jpg`;
          const downloadUrl = URL.createObjectURL(blob);
          triggerBrowserDownload(downloadUrl, outputName);

          onSuccess({
            success: true,
            outputName,
            downloadUrl,
          });
          onClose();
        } else {
          alert('Simulasi kompresi selesai untuk mode browser');
          onClose();
        }
      }
    } catch (err: any) {
      alert('Terjadi kesalahan kompresi: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md select-none"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compress-modal-title"
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="relative w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden flex flex-col p-5"
        style={{
          background: 'radial-gradient(135deg, #1e293b 0%, #0a0f1d 100%)',
          border: '2px solid #94a3b8',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(34, 197, 94, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Top Header (Close button on Left, Centered Title with Silver Rivet) */}
        <div className="relative flex items-center justify-center mb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kompresi"
            className="absolute left-0 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 flex items-center justify-center transition-colors font-bold cursor-pointer"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40" />
            <h2 id="compress-modal-title" className="text-base font-black text-white tracking-tight">Kompresi File</h2>
          </div>
        </div>

        {/* Comparison Visualizer */}
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-700/70">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Ukuran Asal</span>
              <p className="text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                {formatSize(originalBytes)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#4ade80]">
              <span className="text-[10px] font-mono font-bold tabular-nums">-{estimatedSavingsPercent}%</span>
              <ArrowRight size={11} strokeWidth={2.5} />
            </div>

            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Estimasi</span>
              <p className="text-sm font-mono font-bold text-[#86efac] tabular-nums mt-0.5">
                ~{formatSize(estimatedNewBytes)}
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Ringan', val: 50, sub: 'Kecil' },
              { label: 'Seimbang', val: 75, sub: 'Optimal' },
              { label: 'Presisi', val: 88, sub: 'Tajam' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setQuality(p.val)}
                className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                  quality === p.val
                    ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow-md font-black'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-semibold border border-slate-700/50'
                }`}
              >
                <div className={`text-[11px] leading-tight ${quality === p.val ? '!text-black font-black' : ''}`}>{p.label}</div>
                <div className={`text-[9px] font-mono ${quality === p.val ? '!text-black/80 font-bold' : 'opacity-70'}`}>{p.sub}</div>
              </button>
            ))}
          </div>

          {/* Quality Slider */}
          <div className="bg-slate-900/80 border border-slate-700/70 p-3 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 text-xs font-semibold">Tingkat Kualitas Output</span>
              <span className="text-black font-mono text-xs font-black px-2 py-0.5 rounded-md bg-[#4ade80] tabular-nums">
                {quality}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-[#22c55e] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black text-xs font-black transition-all shadow-lg shadow-[#22c55e]/25 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? 'Memproses...' : 'Terapkan Kompresi'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
