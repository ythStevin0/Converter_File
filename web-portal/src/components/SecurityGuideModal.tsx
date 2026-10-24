import React, { useState } from 'react';
import { X, ShieldAlert, Monitor, Apple, Check } from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'mac'>('windows');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-obsidian-900 border border-obsidian-border p-6 shadow-2xl text-[#e4efe9] corner-cross">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 bg-obsidian-800 hover:bg-obsidian-700 text-[#8ca396] hover:text-white transition-colors cursor-pointer border border-obsidian-border"
        >
          <X size={16} />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-10 h-10 bg-signal-dim border border-[#00e575]/50 flex items-center justify-center text-[#00e575] shrink-0 font-mono text-base font-bold">
            !
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#00e575] uppercase tracking-wider">DOC.SEC // SMARTGUARD</div>
            <h3 className="font-display text-lg font-bold text-white tracking-tight">
              Panduan Layar "Unverified Developer"
            </h3>
            <p className="text-xs text-[#8ca396]">
              Karena OrbitDrop adalah aplikasi open-source gratis tanpa lisensi tahunan Microsoft/Apple:
            </p>
          </div>
        </div>

        {/* OS Tabs */}
        <div className="flex gap-2 p-1 bg-obsidian-950 border border-obsidian-border mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 font-mono text-xs transition-all cursor-pointer ${
              activeTab === 'windows'
                ? 'font-bold bg-[#00e575] !text-black shadow-sm'
                : 'text-[#8ca396] hover:text-white'
            }`}
          >
            <Monitor size={14} className={activeTab === 'windows' ? 'text-black' : ''} />
            <span className={activeTab === 'windows' ? 'text-black font-bold' : ''}>Windows (SmartScreen)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mac')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 font-mono text-xs transition-all cursor-pointer ${
              activeTab === 'mac'
                ? 'font-bold bg-[#00e575] !text-black shadow-sm'
                : 'text-[#8ca396] hover:text-white'
            }`}
          >
            <Apple size={14} className={activeTab === 'mac' ? 'text-black' : ''} />
            <span className={activeTab === 'mac' ? 'text-black font-bold' : ''}>macOS (Gatekeeper)</span>
          </button>
        </div>

        {/* Guide Content */}
        {activeTab === 'windows' ? (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-obsidian-950 border border-obsidian-border flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-[#00e575] shrink-0 mt-0.5">[01]</span>
              <div>
                <strong className="text-white block mb-0.5">Layar Biru "Windows protected your PC"</strong>
                Saat membuka file installer <code>OrbitDrop-Setup.exe</code>, Windows Defender akan memunculkan dialog keamanan default.
              </div>
            </div>

            <div className="p-3.5 bg-obsidian-950 border border-obsidian-border flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-[#00e575] shrink-0 mt-0.5">[02]</span>
              <div>
                <strong className="text-white block mb-0.5">Klik link "More info" ("Info selengkapnya")</strong>
                Tautan kecil ini berada tepat di bawah teks peringatan Windows Defender.
              </div>
            </div>

            <div className="p-3.5 bg-signal-dim/40 border border-[#00e575] flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-[#00e575] shrink-0 mt-0.5">[✓]</span>
              <div>
                <strong className="text-[#00e575] block mb-0.5">Klik tombol "Run anyway" ("Tetap jalankan")</strong>
                OrbitDrop akan langsung terpasang dan berjalan secara 100% lokal di desktop Anda tanpa risiko malware.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-obsidian-950 border border-obsidian-border flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-[#00e575] shrink-0 mt-0.5">[01]</span>
              <div>
                <strong className="text-white block mb-0.5">Salin OrbitDrop ke folder Applications</strong>
                Buka file <code>OrbitDrop.dmg</code> dan seret icon OrbitDrop ke dalam folder Applications Anda.
              </div>
            </div>

            <div className="p-3.5 bg-obsidian-950 border border-obsidian-border flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-[#00e575] shrink-0 mt-0.5">[02]</span>
              <div>
                <strong className="text-white block mb-0.5">Klik Kanan (atau Control-Klik) pada OrbitDrop</strong>
                Jangan klik ganda biasa untuk pertama kali. Klik kanan ikon OrbitDrop di folder Applications, lalu pilih <strong>"Open"</strong>.
              </div>
            </div>

            <div className="p-3.5 bg-signal-dim/40 border border-[#00e575] flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-[#00e575] shrink-0 mt-0.5">[✓]</span>
              <div>
                <strong className="text-[#00e575] block mb-0.5">Konfirmasi dengan klik "Open"</strong>
                macOS Gatekeeper akan mengingat izin ini dan Anda bisa membukanya secara normal untuk seterusnya.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#00e575] hover:bg-[#19ff8c] !text-black font-display font-bold text-xs transition cursor-pointer"
          >
            <span className="!text-black font-bold">Mengerti &amp; Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
