import React, { useState } from 'react';
import { 
  Zap, Shield, HardDrive, Cpu, CheckCircle2, 
  ArrowRight, Sparkles, FileText, Image as ImageIcon, 
  RefreshCw, Layers, Check, Download, ExternalLink, Play
} from 'lucide-react';
import { SmartDownloadButton } from '../components/SmartDownloadButton';

interface LandingPageProps {
  onOpenGuide: () => void;
  onGoToVerify: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenGuide, onGoToVerify }) => {
  const [selectedFormat, setSelectedFormat] = useState('JPG');
  const [demoFileSize, setDemoFileSize] = useState('1.1 MB');
  const [convertedResult, setConvertedResult] = useState<string | null>(null);

  const handleSimulateConvert = (fmt: string) => {
    setSelectedFormat(fmt);
    setConvertedResult(`Page 001.${fmt.toLowerCase()}`);
    setTimeout(() => {
      // keep displayed
    }, 2000);
  };

  return (
    <div className="pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 text-center">
        {/* Ambient Top Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles size={13} className="text-blue-400 animate-pulse" />
            <span>Aplikasi Utilitas Desktop Lintas Platform &bull; Windows & macOS</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight font-sans mb-6">
            Konversi File Instan{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Tepat di Kursor Desktop
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tinggalkan proses buka browser dan antre upload. Cukup <strong>seret & lepas</strong> file Anda ke <strong>Radial Menu melingkar</strong>. Pemrosesan 100% lokal di perangkat Anda dalam waktu &lt; 1 detik.
          </p>

          {/* Smart Download CTA */}
          <div className="mb-12">
            <SmartDownloadButton onOpenGuide={onOpenGuide} />
          </div>

          {/* Value Props Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <Zap size={14} className="text-amber-400" />
              <span>Konversi &lt; 1 Detik</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <HardDrive size={14} className="text-emerald-400" />
              <span>100% Offline-First (Privasi Aman)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <Cpu size={14} className="text-cyan-400" />
              <span>Rp 0 Biaya Server</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Radial Menu Live Simulator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Uji Coba Interaktif di Browser
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
              Rasakan Cara Kerja OrbitDrop Sebelum Mengunduh
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
              Klik salah satu format di bawah ini untuk melihat hasil konversi instan di samping file asli Anda:
            </p>
          </div>

          {/* Mock Desktop Workspace */}
          <div className="relative max-w-md mx-auto aspect-square rounded-full border border-slate-700/60 bg-slate-950/80 p-8 flex items-center justify-center shadow-inner">
            {/* Ambient Radial glow */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-xl pointer-events-none" />

            {/* Orbiting format buttons */}
            <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
              {/* DOCX */}
              <button
                type="button"
                onClick={() => handleSimulateConvert('DOCX')}
                className="absolute top-4 pointer-events-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-110 flex items-center gap-1.5"
              >
                <FileText size={13} />
                <span>DOCX</span>
              </button>

              {/* JPG */}
              <button
                type="button"
                onClick={() => handleSimulateConvert('JPG')}
                className="absolute right-4 pointer-events-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-110 flex items-center gap-1.5"
              >
                <ImageIcon size={13} />
                <span>JPG</span>
              </button>

              {/* PNG */}
              <button
                type="button"
                onClick={() => handleSimulateConvert('PNG')}
                className="absolute bottom-4 pointer-events-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-110 flex items-center gap-1.5"
              >
                <ImageIcon size={13} />
                <span>PNG</span>
              </button>

              {/* TXT */}
              <button
                type="button"
                onClick={() => handleSimulateConvert('TXT')}
                className="absolute left-4 pointer-events-auto px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-lg transition-transform hover:scale-110 flex items-center gap-1.5"
              >
                <FileText size={13} />
                <span>TXT</span>
              </button>
            </div>

            {/* Center Disc */}
            <div className="w-36 h-36 rounded-full bg-slate-900 border-2 border-blue-500/60 shadow-2xl flex flex-col items-center justify-center p-3 text-center z-10">
              <FileText className="w-6 h-6 text-red-400 mb-1" />
              <div className="text-xl font-black text-white">{demoFileSize}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Page 001.pdf</div>
            </div>
          </div>

          {/* Result Notification simulation */}
          {convertedResult && (
            <div className="mt-8 max-w-md mx-auto p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-xl animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>
                  Konversi Berhasil: <strong>{convertedResult}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                0.2 detik (Lokal)
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Comparison Grid: Old Way vs OrbitDrop */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mengapa OrbitDrop Jauh Lebih Cepat?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Bandingkan alur konversi web tradisional dengan mesin lokal OrbitDrop:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Web */}
          <div className="rounded-3xl bg-slate-900/40 border border-slate-800 p-6 opacity-75">
            <div className="text-rose-400 font-bold text-xs tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>✕ Konverter Web Tradisional</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">1.</span>
                <span>Buka browser & cari website konverter file</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">2.</span>
                <span>Upload file Anda ke server pihak ketiga (risiko privasi bocor)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">3.</span>
                <span>Menunggu antrean kompresi/konversi di cloud</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">4.</span>
                <span>Download file kembali ke folder Downloads yang berantakan</span>
              </li>
            </ul>
          </div>

          {/* OrbitDrop Way */}
          <div className="rounded-3xl bg-gradient-to-b from-blue-950/40 to-slate-900/90 border border-blue-500/40 p-6 shadow-xl relative">
            <div className="text-emerald-400 font-bold text-xs tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>✓ OrbitDrop (Desktop Local Utility)</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Seret file langsung di desktop atau Explorer Anda</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Radial Menu muncul seketika di posisi kursor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Lepas file ke format tujuan (JPG, PNG, DOCX, dll.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">4.</span>
                <span>File baru langsung tersimpan di sebelah file asli dalam &lt; 1 detik!</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Supported Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <h3 className="text-lg font-bold text-white mb-6">Mendukung Berbagai Kategori Format</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-red-400 text-xs font-bold block mb-1">Dokumen PDF</span>
            <span className="text-[11px] text-slate-400">DOCX, JPG, PNG, TXT</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-emerald-400 text-xs font-bold block mb-1">Foto & Gambar</span>
            <span className="text-[11px] text-slate-400">PNG, WEBP, JPG, AVIF, TIFF</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-blue-400 text-xs font-bold block mb-1">Office & Teks</span>
            <span className="text-[11px] text-slate-400">DOCX, TXT, MD, HTML</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-purple-400 text-xs font-bold block mb-1">Video</span>
            <span className="text-[11px] text-slate-400">MP4, GIF, MP3, WEBM</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-cyan-400 text-xs font-bold block mb-1">Audio</span>
            <span className="text-[11px] text-slate-400">MP3, WAV, AAC, FLAC</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-amber-400 text-xs font-bold block mb-1">Web3 Utility</span>
            <span className="text-[11px] text-slate-400">IPFS Drop, STAMP, Encrypt</span>
          </div>
        </div>
      </section>
    </div>
  );
};
