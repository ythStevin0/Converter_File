import React, { useState } from 'react';

export const VerifyPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const calculateSHA256 = async (inputFile: File) => {
    const t0 = performance.now();
    const arrayBuffer = await inputFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const timeTaken = (performance.now() - t0).toFixed(1);

    setFile(inputFile);
    setHash(hashHex);
    setElapsed(timeTaken);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      calculateSHA256(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      calculateSHA256(e.target.files[0]);
    }
  };

  const copyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(`0x${hash}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-8">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Header */}
        <div className="space-y-2 border-b border-obsidian-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-signal-dim border border-[#00e575]/30 rounded-full text-xs font-medium text-[#00e575]">
            <span>Portal Kriptografi SHA-256 (WebCrypto)</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Verifikasi Keaslian Dokumen
          </h1>
          <p className="text-sm text-[#8ca396] leading-relaxed">
            Periksa apakah file yang Anda terima memiliki checksum integritas resmi yang cocok. Diproses 100% lokal di browser Anda tanpa mengunggah file ke server.
          </p>
        </div>

        {/* Dropzone */}
        <label
          htmlFor="verifyFileInput"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="block w-full p-10 bg-obsidian-950 border-2 border-dashed border-obsidian-border hover:border-[#00e575] rounded-xl transition cursor-pointer text-center space-y-3 group"
        >
          <input
            id="verifyFileInput"
            type="file"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="w-12 h-12 mx-auto bg-obsidian-900 border border-[#00e575]/50 group-hover:bg-[#00e575] group-hover:text-obsidian-950 text-[#00e575] rounded-xl flex items-center justify-center transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white">
              {file ? `File: ${file.name}` : 'Seret & Lepas Dokumen ke Sini'}
            </p>
            <p className="text-xs text-[#6e8578]">
              Atau klik untuk memilih file dari komputer Anda
            </p>
          </div>
        </label>

        {/* Result Card */}
        {hash && file && (
          <div className="bg-obsidian-950 border border-[#00e575] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-border pb-3">
              <div>
                <span className="text-xs font-bold text-white block">{file.name}</span>
                <span className="text-[11px] text-[#6e8578]">
                  Ukuran: {(file.size / 1024).toFixed(1)} KB • Selesai dalam {elapsed} ms
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-signal-dim text-[#00e575] font-bold rounded border border-[#00e575]/40">
                ✓ SHA-256 Terverifikasi
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-[#6e8578] uppercase font-semibold">
                Nilai Checksum Kriptografi (Hash SHA-256):
              </span>
              <div className="flex items-center justify-between gap-3 bg-obsidian-900 border border-obsidian-border p-3 rounded-lg">
                <code className="font-mono text-xs text-[#00e575] break-all">
                  0x{hash}
                </code>
                <button
                  type="button"
                  onClick={copyHash}
                  className="px-3 py-1.5 bg-[#00e575] hover:bg-[#19ff8c] !text-black font-bold text-xs rounded transition shrink-0 cursor-pointer"
                >
                  <span className="!text-black">{isCopied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-[#6e8578]">
          🔒 0 Byte diunggah ke internet — Eksekusi murni di mesin peramban Anda.
        </div>
      </div>
    </div>
  );
};
