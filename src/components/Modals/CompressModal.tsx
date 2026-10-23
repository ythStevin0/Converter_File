import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2, Check, Zap, Sparkles, ArrowDownRight } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';

interface CompressModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

export const CompressModal: React.FC<CompressModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const [quality, setQuality] = useState<number>(65);
  const [isProcessing, setIsProcessing] = useState(false);

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
          alert('Compression failed: ' + res.error);
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

          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = outputName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          onSuccess({
            success: true,
            outputName,
            downloadUrl,
          });
          onClose();
        } else {
          alert('Compression simulated for web preview');
          onClose();
        }
      }
    } catch (err: any) {
      alert('Error during compression: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl select-none"
    >
      <motion.div
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 10 }}
        className="relative w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Minimize2 size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Smart Compression</h2>
              <p className="text-[10px] text-slate-400">{fileInfo.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Comparison Visualizer */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ukuran Asal</span>
              <p className="text-base font-mono font-bold text-slate-200 mt-0.5">
                {formatSize(originalBytes)}
              </p>
            </div>

            <div className="flex flex-col items-center px-3">
              <ArrowDownRight className="text-blue-400 animate-pulse" size={20} />
              <span className="text-[11px] font-bold text-emerald-400">-{estimatedSavingsPercent}%</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Estimasi Hasil</span>
              <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                ~{formatSize(estimatedNewBytes)}
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            {[
              { label: 'Maksimal', val: 40, sub: 'Hemat kuota' },
              { label: 'Seimbang', val: 65, sub: 'Rekomendasi' },
              { label: 'Kualitas Tinggi', val: 85, sub: 'Detail tajam' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setQuality(p.val)}
                className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                  quality === p.val
                    ? 'bg-blue-500/20 border-blue-400 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold">{p.label}</div>
                <div className="text-[9px] text-slate-500">{p.sub}</div>
              </button>
            ))}
          </div>

          {/* Fine Tuning Slider */}
          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Kualitas Output:</span>
              <span className="text-blue-400 font-mono font-bold">{quality}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="95"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Check size={14} />
            <span>{isProcessing ? 'Mengompres...' : 'Kompres Sekarang'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
