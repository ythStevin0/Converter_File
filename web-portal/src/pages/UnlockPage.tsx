import React, { useState } from 'react';
import { Lock, Unlock, UploadCloud, KeyRound, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export const UnlockPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);
  const [decryptedFileName, setDecryptedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDecrypt = () => {
    if (!file) {
      setError('Silakan pilih file .locked terlebih dahulu.');
      return;
    }

    setIsDecrypting(true);
    setError(null);

    setTimeout(() => {
      setIsDecrypting(false);
      const originalName = file.name.replace(/\.locked$/i, '');
      setDecryptedFileName(originalName.includes('.') ? originalName : `${originalName}.pdf`);
      
      // Create download blob
      const blob = new Blob(['Simulated decrypted file content'], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setDecryptedFileUrl(url);
    }, 1200);
  };

  return (
    <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold mb-3">
          <Lock size={14} />
          <span>Lit Protocol / AES-256-GCM Decryption</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Portal Dekripsi File Terkunci (.locked)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Buka kunci dan pulihkan file yang dienkripsi menggunakan OrbitDrop langsung dari browser penerima.
        </p>
      </div>

      {/* Drag & drop upload box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="w-full p-8 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900/80 hover:border-purple-500/50 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-xl shadow-2xl relative mb-6"
        onClick={() => document.getElementById('unlock-file-input')?.click()}
      >
        <input
          id="unlock-file-input"
          type="file"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
          <UploadCloud size={26} />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">
          {file ? file.name : 'Seret & Lepas File .locked ke Sini'}
        </h3>
        <span className="text-[11px] text-slate-400">
          Contoh: <code>Contract_Signed.pdf.locked</code>
        </span>
      </div>

      {/* Password or Wallet Input */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl mb-6">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Masukkan Kunci Dekripsi / Password Pengirim:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password atau hubungkan dompet Web3..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleDecrypt}
            disabled={isDecrypting}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30"
          >
            <Unlock size={14} />
            <span>{isDecrypting ? 'Mendekripsi...' : 'Buka Kunci'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Success Card */}
      {decryptedFileUrl && (
        <div className="rounded-3xl bg-emerald-500/15 border border-emerald-500/30 p-6 flex items-center justify-between shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">File Berhasil Didekripsi!</h4>
              <p className="text-xs text-emerald-200/80">{decryptedFileName}</p>
            </div>
          </div>

          <a
            href={decryptedFileUrl}
            download={decryptedFileName || 'file_decrypted'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105"
          >
            <Download size={14} />
            <span>Unduh File Asli</span>
          </a>
        </div>
      )}
    </div>
  );
};
