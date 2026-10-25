import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';
import { encryptFileBuffer, uint8ArrayToBase64 } from '../../utils/cryptoHelpers';
import { triggerBrowserDownload } from '../../utils/fileHelpers';

interface EncryptModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

export const EncryptModal: React.FC<EncryptModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard shortcut listener (Escape to close, Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Enter' && !isProcessing) {
        handleEncrypt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [password, confirmPassword, isProcessing]);

  // Real-time password strength meter
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Kosong', color: 'bg-slate-700', text: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: 'Lemah', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score <= 3) return { score: 2, label: 'Sedang', color: 'bg-amber-500', text: 'text-amber-400' };
    return { score: 3, label: 'Kuat', color: 'bg-[#22c55e]', text: 'text-[#4ade80]' };
  };

  const strength = getPasswordStrength(password);

  const handleEncrypt = async () => {
    if (!password) {
      setErrorMessage('Kata sandi tidak boleh kosong.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Kata sandi minimal 8 karakter demi keamanan terhadap serangan brute-force.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
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

      // Perform AES-256-GCM encryption with PBKDF2 (600,000 iterations)
      const encryptedBytes = await encryptFileBuffer(arrayBuffer, fileInfo.name, password);
      const base64Data = uint8ArrayToBase64(encryptedBytes);
      const outputName = `${fileInfo.name}.locked`;

      // 1. Electron Desktop Save
      if (window.electronAPI && typeof window.electronAPI.saveBase64Image === 'function') {
        const res = await window.electronAPI.saveBase64Image({
          sourceFilePath: fileInfo.path,
          base64Data,
          suffix: '',
          ext: 'locked',
        });
        if (res.success && res.outputPath) {
          onSuccess({
            success: true,
            outputPath: res.outputPath,
            outputName: res.outputName || outputName,
          });
          onClose();
          return;
        }
      }

      // 2. Web Browser Fallback Download
      const blob = new Blob([encryptedBytes as any], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(downloadUrl, outputName);

      onSuccess({
        success: true,
        outputName,
        downloadUrl,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengenkripsi file.');
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
        aria-labelledby="encrypt-modal-title"
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
              <Lock className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <h2 id="encrypt-modal-title" className="text-base font-black tracking-wide text-white uppercase font-display">
                Enkripsi Berkas AES-256-GCM
              </h2>
              <p className="text-xs text-slate-400">Amankan berkas ke format .locked</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
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
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Berkas Sumber:</span>
              <span className="font-bold text-white truncate block">{fileInfo.name}</span>
            </div>
            <span className="shrink-0 px-2 py-1 rounded bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#4ade80] font-mono font-bold">
              {fileInfo.formattedSize}
            </span>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="encryptPasswordInput" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Kata Sandi Kunci:
              </label>
              {password && (
                <span className={`text-[11px] font-mono font-bold ${strength.text}`}>
                  Kekuatan: {strength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="encryptPasswordInput"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter acak & unik..."
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

            {/* Strength Bar */}
            {password && (
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex gap-1 mt-1">
                <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="encryptConfirmPasswordInput" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Konfirmasi Kata Sandi:
            </label>
            <input
              id="encryptConfirmPasswordInput"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi di atas..."
              className="w-full bg-slate-950/90 border border-[#94a3b8]/40 focus:border-[#22c55e] focus:shadow-[0_0_15px_rgba(34,197,94,0.25)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Zero-Knowledge Data Loss Warning */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>PERINGATAN ZERO-KNOWLEDGE:</strong> Kata sandi ini adalah satu-satunya kunci. Jika kata sandi hilang, berkas <strong>hilang permanen dan tidak dapat dipulihkan</strong> oleh siapa pun.
            </p>
          </div>

          {/* Honest Technical Crypto Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-[#22c55e]/25 text-[11px] text-slate-300">
            <ShieldCheck size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Berkas diamankan dengan <strong className="text-[#4ade80]">AES-256-GCM</strong> (kunci diturunkan via PBKDF2-HMAC-SHA256, 600.000 iterasi OWASP). Dekripsi dapat dilakukan offline di desktop atau melalui web-portal OrbitDrop.
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
            onClick={handleEncrypt}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <KeyRound size={14} className="text-black" />
            <span>{isProcessing ? 'Mengenkripsi...' : 'Enkripsi & Kunci Berkas'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
