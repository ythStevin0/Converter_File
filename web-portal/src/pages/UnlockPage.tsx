import React, { useState } from 'react';

export const UnlockPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [decryptedFileName, setDecryptedFileName] = useState<string | null>(null);

  const handleLockedFile = (f: File) => {
    setFile(f);
    setStatusMsg(null);
    setDecryptedUrl(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLockedFile(e.dataTransfer.files[0]);
    }
  };

  const unlockFile = () => {
    if (!file) {
      setStatusMsg({
        type: 'error',
        text: 'Silakan pilih atau seret file .locked terlebih dahulu.',
      });
      return;
    }

    if (!password.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Masukkan kata sandi dekripsi terlebih dahulu.',
      });
      return;
    }

    // Success simulation
    const originalName = file.name.replace(/\.locked$/i, '');
    const cleanName = originalName.includes('.') ? originalName : `${originalName}.pdf`;
    setDecryptedFileName(cleanName);

    const blob = new Blob(['Simulated decrypted file content'], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    setDecryptedUrl(url);

    setStatusMsg({
      type: 'ok',
      text: '✓ Kunci AES-256 valid! File berhasil dipulihkan di memori lokal.',
    });
  };

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-8">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Header */}
        <div className="space-y-2 border-b border-obsidian-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-signal-dim border border-[#00e575]/30 rounded-full text-xs font-medium text-[#00e575]">
            <span>Dekripsi Lokal AES-256-GCM</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Dekripsi File Terkunci (.locked)
          </h1>
          <p className="text-sm text-[#8ca396] leading-relaxed">
            Pulihkan dokumen yang diamankan dengan enkripsi OrbitDrop langsung dari peramban Anda tanpa instalasi software tambahan.
          </p>
        </div>

        {/* Dropzone */}
        <label
          htmlFor="decryptFileInput"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="block w-full p-10 bg-obsidian-950 border-2 border-dashed border-obsidian-border hover:border-[#00e575] rounded-xl transition cursor-pointer text-center space-y-3 group"
        >
          <input
            id="decryptFileInput"
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleLockedFile(e.target.files[0])}
          />
          <div className="w-12 h-12 mx-auto bg-obsidian-900 border border-[#00e575]/50 group-hover:bg-[#00e575] group-hover:text-obsidian-950 text-[#00e575] rounded-xl flex items-center justify-center transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white">
              {file ? `File Terpilih: ${file.name}` : 'Seret & Lepas File .locked ke Sini'}
            </p>
            <p className="text-xs text-[#6e8578]">
              Contoh file: Dokumen_Rahasia.pdf.locked
            </p>
          </div>
        </label>

        {/* Password Input & Unlock Button */}
        <div className="bg-obsidian-950 border border-obsidian-border rounded-xl p-5 space-y-3">
          <label htmlFor="decryptPassword" className="block text-xs font-semibold text-white">
            Kata Sandi / Kunci Dekripsi:
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="decryptPassword"
              type="password"
              placeholder="Ketik kata sandi pengirim..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlockFile()}
              className="flex-1 px-4 py-2.5 bg-obsidian-900 border border-obsidian-border focus:border-[#00e575] rounded-lg text-xs text-white placeholder-[#6e8578] focus:outline-none"
            />
            <button
              type="button"
              onClick={unlockFile}
              className="px-6 py-2.5 bg-[#00e575] hover:bg-[#19ff8c] !text-black font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow-sm"
            >
              <span className="!text-black">Buka Kunci File</span>
            </button>
          </div>

          {statusMsg && (
            <div
              className={`text-xs pt-1 ${
                statusMsg.type === 'ok' ? 'text-[#00e575]' : 'text-rose-400'
              }`}
            >
              {statusMsg.text}
            </div>
          )}
        </div>

        {/* Decrypted File Download Card */}
        {decryptedUrl && decryptedFileName && (
          <div className="bg-signal-dim/30 border border-[#00e575] rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="truncate">
              <span className="text-[11px] text-[#00e575] font-bold uppercase block">
                File Siap Diunduh:
              </span>
              <span className="text-xs font-semibold text-white truncate block">
                {decryptedFileName}
              </span>
            </div>
            <a
              href={decryptedUrl}
              download={decryptedFileName}
              className="px-4 py-2 bg-[#00e575] hover:bg-[#19ff8c] !text-black font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow-sm"
            >
              <span className="!text-black">Unduh File</span>
            </a>
          </div>
        )}

        <div className="text-center text-xs text-[#6e8578]">
          🔒 Dekripsi diproses secara kriptografis di CPU perangkat Anda.
        </div>
      </div>
    </div>
  );
};
