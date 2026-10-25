import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Unlock, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';
import { decryptFileBuffer, uint8ArrayToBase64 } from '../../utils/cryptoHelpers';
import { triggerBrowserDownload } from '../../utils/fileHelpers';

interface UnlockModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Enter' && !isProcessing) {
        handleUnlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [password, isProcessing]);

  const handleUnlock = async () => {
    if (!password) {
      setErrorMessage('Masukkan kata sandi dekripsi terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      let arrayBuffer: ArrayBuffer;

      if (fileInfo.file) {
        arrayBuffer = await fileInfo.file.arrayBuffer();
      } else if (window.electronAPI && typeof window.electronAPI.readFileBase64 === 'function') {
        const res = await window.electronAPI.readFileBase64(fileInfo.path);
        if (!res.success || !res.dataUrl) throw new Error('Gagal membaca file dari disk');
        const base64 = res.dataUrl.replace(/^data:.*?;base64,/, '');
        const binaryStr = atob(base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        throw new Error('File tidak dapat diakses.');
      }

      // Decrypt container with AES-256-GCM & AAD
      const { fileName, decryptedBytes } = await decryptFileBuffer(arrayBuffer, password);
      const base64Data = uint8ArrayToBase64(decryptedBytes);
      const extMatch = fileName.match(/\.([^.]+)$/);
      const ext = extMatch ? extMatch[1] : 'decrypted';

      // 1. Electron Desktop Save
      if (window.electronAPI && typeof window.electronAPI.saveBase64Image === 'function') {
        const res = await window.electronAPI.saveBase64Image({
          sourceFilePath: fileInfo.path,
          base64Data,
          suffix: 'Decrypted',
          ext,
        });
        if (res.success && res.outputPath) {
          onSuccess({
            success: true,
            outputPath: res.outputPath,
            outputName: fileName,
          });
          onClose();
          return;
        }
      }

      // 2. Web Browser Fallback Download
      const blob = new Blob([decryptedBytes as any], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(downloadUrl, fileName);

      onSuccess({
        success: true,
        outputName: fileName,
        downloadUrl,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kata sandi salah atau berkas rusak / telah dimodifikasi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-modal-title"
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#94a3b8]/40 shadow-[0_0_50px_rgba(34,197,94,0.2)] text-white"
        style={{
          background: 'radial-gradient(135deg, #1e293b 0%, #0a0f1d 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#94a3b8]/30 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <Unlock className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <h2 id="unlock-modal-title" className="text-base font-black tracking-wide text-white uppercase font-display">
                Dekripsi Berkas (.locked)
              </h2>
              <p className="text-xs text-slate-400">Buka kunci AES-256-GCM secara offline</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal dekripsi"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#94a3b8]/30 text-slate-400 hover:text-white hover:border-[#22c55e] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* File Info Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-[#94a3b8]/20 text-xs">
            <div className="truncate mr-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Berkas Terkunci:</span>
              <span className="font-bold text-white truncate block">{fileInfo.name}</span>
            </div>
            <span className="shrink-0 px-2 py-1 rounded bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#4ade80] font-mono font-bold">
              {fileInfo.formattedSize}
            </span>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="unlockPasswordInput" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Kata Sandi Pembuka Kunci:
            </label>
            <div className="relative">
              <input
                id="unlockPasswordInput"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi pengunci..."
                className="w-full bg-slate-950/90 border border-[#94a3b8]/40 focus:border-[#22c55e] focus:shadow-[0_0_15px_rgba(34,197,94,0.25)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-[#22c55e]/25 text-[11px] text-slate-300">
            <CheckCircle2 size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Dekripsi dilakukan secara lokal di CPU komputer Anda. Nama berkas dan isi payload asli akan dipulihkan secara otomatis jika kata sandi cocok.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#94a3b8]/30 bg-slate-900/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Batal (Esc)
          </button>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <KeyRound size={14} className="text-black" />
            <span>{isProcessing ? 'Mendekripsi...' : 'Buka Kunci Berkas'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
