import React from 'react';
import { DecryptTutorialShowcase } from '../components/DecryptTutorialShowcase';
import { Lock, Unlock, Download, ShieldCheck, Cpu, Key, FileCheck } from 'lucide-react';

export const UnlockPage: React.FC = () => {
  return (
    <div className="py-4 space-y-10 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-signal-dim border border-[#00e575]/30 rounded-full text-xs font-semibold text-[#00e575]">
          <ShieldCheck size={14} />
          <span>TUTORIAL &amp; SIMULASI FITUR ORBITDROP DESKTOP</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Dekripsi Berkas Terkunci (.locked)
        </h1>
        <p className="text-sm text-[#8ca396] leading-relaxed">
          Simulasi visual bagaimana aplikasi desktop OrbitDrop memulihkan dokumen terenkripsi AES-256-GCM dengan 600.000 iterasi PBKDF2 OWASP secara instan di CPU lokal Anda tanpa server perantara.
        </p>
      </div>

      {/* Main Kinetic Video Simulation */}
      <DecryptTutorialShowcase />

      {/* Educational & Architectural Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00e575]">
            <Lock size={18} />
          </div>
          <h2 className="text-sm font-bold text-white">Standar Militer AES-256-GCM</h2>
          <p className="text-xs text-[#8ca396] leading-relaxed">
            Format <code>.locked</code> menggunakan algoritma Galois/Counter Mode (GCM) dengan 128-bit Authentication Tag yang mendeteksi jika berkas dirusak atau dicoba dibobol.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00e575]">
            <Key size={18} />
          </div>
          <h2 className="text-sm font-bold text-white">600.000 Iterasi OWASP</h2>
          <p className="text-xs text-[#8ca396] leading-relaxed">
            Kunci diturunkan menggunakan PBKDF2-HMAC-SHA256 dengan 600.000 putaran kalkulasi kriptografis, memberikan pertahanan maksimal dari serangan brute-force hardware GPU.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00e575]">
            <Cpu size={18} />
          </div>
          <h2 className="text-sm font-bold text-white">Pemulihan 100% di RAM Lokal</h2>
          <p className="text-xs text-[#8ca396] leading-relaxed">
            Kata sandi dan data asli tidak pernah dikirimkan atau disimpan ke disk sebelum proses verifikasi otentikasi tag lolos 100% di memori komputer Anda.
          </p>
        </div>
      </div>

      {/* CTA Download Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-obsidian-900 to-obsidian-950 border border-[#00e575]/50 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-[0_0_35px_rgba(0,229,117,0.12)]">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-base font-bold text-white">
            Kunci &amp; Buka File Terproteksi di Komputer Anda
          </div>
          <p className="text-xs text-[#8ca396]">
            Gunakan OrbitDrop Desktop untuk mengunci dokumen sensitif sebelum dikirim lewat email atau chat, dan buka kunci berkas <code>.locked</code> secara instan.
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