import React, { useState } from 'react';

export const VerifyPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [expectedHash, setExpectedHash] = useState<string>('');
  const [elapsed, setElapsed] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateSHA256 = async (inputFile: File) => {
    setIsCalculating(true);
    setFile(inputFile);
    setCalculatedHash(null);

    const t0 = performance.now();
    try {
      const arrayBuffer = await inputFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      const timeTaken = (performance.now() - t0).toFixed(1);

      setCalculatedHash(hashHex);
      setElapsed(timeTaken);
    } catch {
      setCalculatedHash(null);
    } finally {
      setIsCalculating(false);
    }
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
    if (!calculatedHash) return;
    navigator.clipboard.writeText(calculatedHash);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Checksum comparison logic (case-insensitive, trims, strips leading 0x)
  const cleanCalculated = calculatedHash ? calculatedHash.toLowerCase().trim() : null;
  const cleanExpected = expectedHash.replace(/^0x/i, '').toLowerCase().trim();
  const hasExpectedInput = cleanExpected.length > 0;
  const isMatch = cleanCalculated && hasExpectedInput && cleanCalculated === cleanExpected;
  const isMismatch = cleanCalculated && hasExpectedInput && cleanCalculated !== cleanExpected;

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-8">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Header */}
        <div className="space-y-2 border-b border-obsidian-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-signal-dim border border-[#00e575]/30 rounded-full text-xs font-medium text-[#00e575]">
            <span>SHA-256 Checksum Verifier (WebCrypto)</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Verifikasi Integritas Berkas
          </h1>
          <p className="text-sm text-[#8ca396] leading-relaxed">
            Hitung nilai hash SHA-256 autentik berkas Anda dan bandingkan dengan hash pembanding untuk membuktikan keaslian dan mendeteksi apakah berkas telah dimodifikasi atau rusak.
          </p>
        </div>

        {/* Dropzone */}
        <label
          htmlFor="verifyFileInput"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="block w-full p-8 bg-obsidian-950 border-2 border-dashed border-obsidian-border hover:border-[#00e575] rounded-xl transition cursor-pointer text-center space-y-3 group"
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
              {isCalculating
                ? 'Sedang menghitung hash kriptografi...'
                : file
                ? `Berkas: ${file.name}`
                : 'Seret & Lepas Berkas ke Sini'}
            </p>
            <p className="text-xs text-[#6e8578]">
              {file ? `Ukuran: ${(file.size / 1024).toFixed(1)} KB` : 'Atau klik untuk memilih berkas dari komputer Anda'}
            </p>
          </div>
        </label>

        {/* Optional Expected Hash Input */}
        <div className="space-y-2 bg-obsidian-950 border border-obsidian-border p-4 rounded-xl">
          <label htmlFor="expectedHashInput" className="block text-xs font-bold text-white uppercase tracking-wider">
            Hash yang Diharapkan (Opsional untuk Komparasi Otomatis):
          </label>
          <input
            id="expectedHashInput"
            type="text"
            value={expectedHash}
            onChange={(e) => setExpectedHash(e.target.value)}
            placeholder="Tempel hash SHA-256 pembanding (contoh: a3f8... atau 0xa3f8...)"
            className="w-full px-3.5 py-2.5 bg-obsidian-900 border border-obsidian-border focus:border-[#00e575] rounded-lg text-xs font-mono text-white placeholder-[#6e8578] focus:outline-none transition"
          />
        </div>

        {/* Comparison Result Banners */}
        {calculatedHash && hasExpectedInput && (
          <div>
            {isMatch ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500 text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <span>✓</span>
                  <span>CHECKSUM COCOK (100% IDENTIK)</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Berkas terverifikasi identik dengan nilai hash yang diberikan. Berkas tidak mengalami perubahan, korupsi, atau manipulasi byte.
                </p>
              </div>
            ) : isMismatch ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border-2 border-rose-500 text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                  <span>✕</span>
                  <span>CHECKSUM TIDAK COCOK (BERBEDA)</span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Nilai hash berkas ini berbeda dari nilai yang diharapkan. Berkas kemungkinan telah dimodifikasi, rusak saat proses unduh, atau bukan versi yang dimaksud.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Calculated Hash Output Card */}
        {calculatedHash && file && (
          <div className="bg-obsidian-950 border border-obsidian-border rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-border pb-3">
              <div>
                <span className="text-xs font-bold text-white block">{file.name}</span>
                <span className="text-[11px] text-[#6e8578]">
                  Ukuran: {(file.size / 1024).toFixed(1)} KB • Waktu hitung: {elapsed} ms
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-obsidian-900 text-[#00e575] font-mono font-bold rounded border border-[#00e575]/30">
                SHA-256
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-[#6e8578] uppercase font-semibold">
                Nilai Checksum SHA-256 Dihitung:
              </span>
              <div className="flex items-center justify-between gap-3 bg-obsidian-900 border border-obsidian-border p-3 rounded-lg">
                <code className="font-mono text-xs text-[#00e575] break-all select-all">
                  {calculatedHash}
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
          🔒 0 Byte dikirim ke internet — Eksekusi murni di mesin browser lokal Anda (SHA-256 WebCrypto).
        </div>
      </div>
    </div>
  );
};
