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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="metadata-modal-title"
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 10 }}
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'radial-gradient(135deg, #1e293b 0%, #0a0f1d 100%)',
          border: '2px solid #94a3b8',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(34, 197, 94, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center text-[#4ade80]">
              <Info size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40" />
                <h2 id="metadata-modal-title" className="text-sm font-black text-white tracking-tight">File & EXIF Metadata</h2>
              </div>
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
              <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
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
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#86efac]">
                <AlertCircle size={16} className="text-[#4ade80] shrink-0 mt-0.5" />
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
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black text-xs font-black shadow-lg shadow-[#22c55e]/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck size={14} className="!text-black" />
            <span className="!text-black">{isStripping ? 'Menghapus...' : 'Hapus EXIF & Bersihkan'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
