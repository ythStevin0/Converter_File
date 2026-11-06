import React from 'react';
import { VerifyTutorialShowcase } from '../components/VerifyTutorialShowcase';
import { ShieldCheck, Download, Cpu, Lock, CheckCircle2, FileCheck } from 'lucide-react';

export const VerifyPage: React.FC = () => {
  return (
    <div className="py-4 space-y-10 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-signal-dim border border-[#00e575]/30 rounded-full text-xs font-semibold text-[#00e575]">
          <ShieldCheck size={14} />
          <span>TUTORIAL &amp; SIMULASI FITUR ORBITDROP DESKTOP</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Verifikasi Integritas SHA-256
        </h1>
        <p className="text-sm text-[#8ca396] leading-relaxed">
          Simulasi visual bagaimana aplikasi desktop OrbitDrop memeriksa keaslian berkas bit-per-bit, mendeteksi modifikasi atau kerusakan dokumen secara instan tanpa mengunggah berkas ke cloud.
        </p>
      </div>

      {/* Main Kinetic Video Simulation */}
      <VerifyTutorialShowcase />

      {/* Educational & Architectural Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00e575]">
            <Lock size={18} />
          </div>
          <h2 className="text-sm font-bold text-white">Zero Cloud Upload</h2>
          <p className="text-xs text-[#8ca396] leading-relaxed">
            Berkas sensitif (laporan keuangan, paten, data medis) tidak pernah diunggah ke server pihak ketiga mana pun. Semuanya diverifikasi 100% di memori RAM komputer Anda.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00e575]">
            <Cpu size={18} />
          </div>
          <h2 className="text-sm font-bold text-white">Kecepatan Native CPU</h2>
          <p className="text-xs text-[#8ca396] leading-relaxed">
            Menghitung ringkasan SHA-256 64-karakter langsung menggunakan instruksi prosesor hardware (Intel/AMD SHA Extensions atau Apple Silicon Crypto Engine) dalam hitungan milidetik.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00e575]">
            <FileCheck size={18} />
          </div>
          <h2 className="text-sm font-bold text-white">Standar Pembuktian Hukum</h2>
          <p className="text-xs text-[#8ca396] leading-relaxed">
            Nilai hash SHA-256 adalah standar kriptografi global untuk membuktikan bahwa sebuah dokumen elektronik belum pernah diubah bahkan 1 bit pun sejak diterbitkan oleh pengirim.
          </p>
        </div>
      </div>

      {/* CTA Download Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-obsidian-900 to-obsidian-950 border border-[#00e575]/50 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-[0_0_35px_rgba(0,229,117,0.12)]">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-base font-bold text-white">
            Gunakan Verifikasi SHA-256 di Komputer Anda
          </div>
          <p className="text-xs text-[#8ca396]">
            Download OrbitDrop Desktop gratis dan verifikasi integritas file apa pun cukup dengan seret berkas sambil tekan CTRL atau shortcut Alt+Space.
          </p>
        </div>
        <a
          href="/#panduan-instalasi"
          className="px-5 py-2.5 rounded-xl bg-[#00e575] hover:bg-[#00c966] text-black font-bold text-xs flex items-center gap-2 transition shrink-0 cursor-pointer shadow-md"
        >
          <Download size={14} className="text-black" />
          <span>Unduh OrbitDrop Desktop</span>
        </a>
      </div>
    </div>
  );
};