import React, { useState } from 'react';
import { X, ShieldAlert, Monitor, Apple, CheckCircle2 } from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'mac'>('windows');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Panduan Melewati Layar "Unverified Developer"
            </h3>
            <p className="text-xs text-slate-400">
              Karena OrbitDrop adalah aplikasi open-source gratis tanpa sertifikat berbayar, ikuti langkah berikut:
            </p>
          </div>
        </div>

        {/* OS Tabs */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'windows'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor size={15} />
            <span>Windows (SmartScreen)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mac')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'mac'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple size={15} />
            <span>macOS (Gatekeeper)</span>
          </button>
        </div>

        {/* Guide Content */}
        {activeTab === 'windows' ? (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white block mb-0.5">Layar Biru "Windows protected your PC"</strong>
                Saat membuka file installer <code>OrbitDrop-Setup.exe</code>, Windows Defender akan memunculkan notifikasi keamanan.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white block mb-0.5">Klik link "More info" ("Info selengkapnya")</strong>
                Tautan kecil ini biasanya berada di bawah teks peringatan.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-emerald-400 block mb-0.5">Klik tombol "Run anyway" ("Tetap jalankan")</strong>
                Aplikasi OrbitDrop akan langsung terpasang di komputer Anda dan siap digunakan secara lokal!
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white block mb-0.5">Salin OrbitDrop ke folder Applications</strong>
                Buka file <code>OrbitDrop.dmg</code> dan seret icon OrbitDrop ke dalam folder Applications Anda.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white block mb-0.5">Klik Kanan (atau Control-Klik) pada OrbitDrop</strong>
                Jangan klik ganda secara langsung. Klik kanan ikon OrbitDrop di folder Applications, lalu pilih <strong>"Open"</strong>.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-emerald-400 block mb-0.5">Konfirmasi dengan klik "Open"</strong>
                macOS akan mengingat izin ini dan Anda bisa membukanya secara normal untuk seterusnya.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
