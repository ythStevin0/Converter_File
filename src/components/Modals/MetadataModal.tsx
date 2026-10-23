import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Info, ShieldCheck, Trash2, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse, MetadataInfo } from '../../types';

interface MetadataModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const [metadata, setMetadata] = useState<MetadataInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStripping, setIsStripping] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setIsLoading(true);
      if (window.electronAPI && typeof window.electronAPI.getMetadata === 'function') {
        const res = await window.electronAPI.getMetadata(fileInfo.path);
        if (active && res.success && res.data) {
          setMetadata(res.data);
        }
      } else {
        // Fallback info for web preview
        if (active) {
          setMetadata({
            format: fileInfo.extension.replace('.', '').toUpperCase(),
            formattedSize: fileInfo.formattedSize,
            fileSizeBytes: fileInfo.size,
            channels: 3,
            space: 'srgb',
            hasAlpha: false,
          });
        }
      }
      if (active) setIsLoading(false);
    }

    loadMeta();
    return () => {
      active = false;
    };
  }, [fileInfo]);

  const handleStripMetadata = async () => {
    if (isStripping) return;
    setIsStripping(true);

    try {
      if (window.electronAPI && typeof window.electronAPI.stripMetadata === 'function') {
        const res = await window.electronAPI.stripMetadata(fileInfo.path);
        if (res.success) {
          onSuccess(res);
          onClose();
        } else {
          alert('Failed to strip metadata: ' + res.error);
        }
      } else {
        alert('EXIF stripping simulation complete for web preview');
        const baseName = fileInfo.name.replace(/\.[^.]+$/, '');
        const outputName = `${baseName} Clean${fileInfo.extension}`;
        onSuccess({
          success: true,
          outputName,
        });
        onClose();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsStripping(false);
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
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Info size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">File & EXIF Metadata</h2>
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

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Memindai metadata file...</span>
            </div>
          ) : (
            <>
              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Format</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {metadata?.format || fileInfo.extension.replace('.', '').toUpperCase()}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Ukuran File</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {metadata?.formattedSize || fileInfo.formattedSize}
                  </span>
                </div>

                {metadata?.width && metadata?.height && (
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60 col-span-2">
                    <span className="text-[10px] text-slate-500 block">Resolusi Piksel</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {metadata.width} &times; {metadata.height} px
                    </span>
                  </div>
                )}

                {metadata?.space && (
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block">Color Space</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{metadata.space}</span>
                  </div>
                )}

                {metadata?.channels && (
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block">Channels</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{metadata.channels}</span>
                  </div>
                )}
              </div>

              {/* Privacy Warning */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  File asli mungkin menyimpan riwayat lokasi GPS, merk kamera, dan tanggal pembuatan. Anda dapat menghapusnya untuk menjaga privasi.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleStripMetadata}
            disabled={isStripping}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <ShieldCheck size={14} />
            <span>{isStripping ? 'Menghapus...' : 'Hapus EXIF & Bersihkan'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
