import React, { useState } from 'react';
import { ShieldCheck, UploadCloud, CheckCircle2, Clock, Hash, Globe, File } from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<{
    status: 'verified' | 'unregistered';
    attestationUid?: string;
    timestamp?: string;
    issuer?: string;
    network?: string;
  } | null>(null);

  const calculateSHA256 = async (inputFile: File): Promise<string> => {
    const arrayBuffer = await inputFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (f: File) => {
    setFile(f);
    setIsVerifying(true);
    setVerifiedInfo(null);

    const calculatedHash = await calculateSHA256(f);
    setHash(calculatedHash);

    // Simulate blockchain verification lookup via EAS (Ethereum Attestation Service)
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedInfo({
        status: 'verified',
        attestationUid: `0x${calculatedHash.slice(0, 32)}...`,
        timestamp: new Date().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        issuer: '0x8f2a...4b19 (EAS Attester)',
        network: 'Base L2 (Ethereum Attestation Service)',
      });
    }, 900);
  };

  return (
    <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
          <ShieldCheck size={14} />
          <span>Ethereum Attestation Service (EAS)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Portal Verifikasi Keaslian Dokumen
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Cek apakah file atau karya yang Anda terima telah dicap resmi (STAMP) dengan integritas kriptografi SHA-256 tanpa perlu menginstal aplikasi desktop.
        </p>
      </div>

      {/* Drag and drop upload box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="w-full p-10 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900/80 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-xl shadow-2xl relative"
        onClick={() => document.getElementById('verify-file-input')?.click()}
      >
        <input
          id="verify-file-input"
          type="file"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
          <UploadCloud size={28} />
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          {file ? file.name : 'Seret & Lepas Dokumen untuk Diverifikasi'}
        </h3>
        <p className="text-xs text-slate-400">
          File diproses 100% lokal di browser Anda. Tidak ada data yang diunggah ke server mana pun.
        </p>
      </div>

      {/* Verification Result Card */}
      {isVerifying ? (
        <div className="mt-8 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center animate-pulse">
          <div className="text-xs text-emerald-400 font-semibold">
            Menghitung kode SHA-256 & mencocokkan attestation on-chain...
          </div>
        </div>
      ) : verifiedInfo && hash ? (
        <div className="mt-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-400">Dokumen Otentik Terverifikasi</h4>
              <p className="text-[11px] text-slate-400">Kode hash cocok dengan catatan stempel on-chain.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <Hash size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">SHA-256 Hash Dokumen</span>
                <span className="font-mono text-slate-200 text-[11px] break-all">{hash}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Waktu Pencatatan</span>
                  <span className="text-slate-200 font-semibold">{verifiedInfo.timestamp}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Globe size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Jaringan Verifikasi</span>
                  <span className="text-slate-200 font-semibold">{verifiedInfo.network}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
