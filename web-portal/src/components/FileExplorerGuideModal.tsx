import React from 'react';
import { X, FolderOpen, ArrowRight, ShieldCheck, CheckCircle2, Monitor } from 'lucide-react';

interface FileExplorerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  targetFormat?: string;
  onOpenSecurityGuide?: () => void;
}

export const FileExplorerGuideModal: React.FC<FileExplorerGuideModalProps> = ({
  isOpen,
  onClose,
  fileName = 'OrbitDrop-Setup.exe',
  targetFormat,
  onOpenSecurityGuide,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-obsidian-900 border border-[#00e575]/50 rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,229,117,0.2)] text-[#e4efe9] overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#00e575]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-[#8ca396] hover:text-white transition-colors cursor-pointer border border-obsidian-border"
          title="Tutup Dialog"
        >
          <X size={16} />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-signal-dim border border-[#00e575]/60 flex items-center justify-center text-[#00e575] shrink-0 shadow-lg shadow-[#00e575]/10">
            <FolderOpen size={24} className="text-[#00e575]" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#00e575] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00e575] animate-pulse" />
              <span>FILE EXPLORER // DOWNLOAD BERHASIL</span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
              File Installer Masuk ke File Explorer
            </h3>
            <p className="text-xs text-[#8ca396] mt-0.5">
              Browser telah menyimpan installer ke folder <strong>Downloads</strong> di komputer Anda.
            </p>
          </div>
        </div>

        {/* Target File Info Card */}
        <div className="p-3.5 bg-obsidian-950 border border-obsidian-border rounded-xl flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Monitor size={18} />
            </div>
            <div className="truncate">
              <div className="text-xs font-mono font-bold text-white truncate">{fileName}</div>
              <div className="text-[11px] text-[#6e8578] truncate">
                Tersimpan di: <span className="text-[#9cb3a6] font-mono">Downloads (File Explorer)</span>
              </div>
            </div>
          </div>
          {targetFormat && (
            <span className="text-[11px] font-mono font-bold text-black bg-[#00e575] px-2.5 py-1 rounded-md shrink-0 shadow-sm">
              Untuk {targetFormat}
            </span>
          )}
        </div>

        {/* 3 Simple Action Steps */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 bg-obsidian-950/80 border border-obsidian-border rounded-xl flex items-start gap-3.5">
            <span className="font-mono text-xs font-bold text-[#00e575] bg-signal-dim px-2 py-0.5 rounded border border-[#00e575]/30 shrink-0 mt-0.5">
              01
            </span>
            <div className="text-xs">
              <strong className="text-white block mb-0.5 font-medium">Buka File Explorer Windows</strong>
              <span>
                Tekan tombol keyboard <kbd className="px-1.5 py-0.5 rounded bg-obsidian-800 border border-obsidian-border text-white font-mono text-[11px]">Win + E</kbd> di komputer Anda.
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-obsidian-950/80 border border-obsidian-border rounded-xl flex items-start gap-3.5">
            <span className="font-mono text-xs font-bold text-[#00e575] bg-signal-dim px-2 py-0.5 rounded border border-[#00e575]/30 shrink-0 mt-0.5">
              02
            </span>
            <div className="text-xs">
              <strong className="text-white block mb-0.5 font-medium">Jalankan File Installer</strong>
              <span>
                Buka folder <strong>Downloads</strong>, lalu klik dua kali pada file <code className="text-[#00e575] font-mono">{fileName}</code>.
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-signal-dim/30 border border-[#00e575]/40 rounded-xl flex items-start gap-3.5">
            <span className="font-mono text-xs font-bold text-[#00e575] bg-signal-dim px-2 py-0.5 rounded border border-[#00e575]/40 shrink-0 mt-0.5">
              03
            </span>
            <div className="text-xs">
              <strong className="text-[#00e575] block mb-0.5 font-bold">Terhubung Otomatis ke File Explorer</strong>
              <span className="text-white">
                Setelah selesai diinstall, OrbitDrop otomatis aktif di latar belakang (System Tray) dan terintegrasi ke <strong>File Explorer</strong>: Anda cukup seret file dari Explorer atau tekan <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-white font-mono text-[11px]">Alt + Space</kbd>.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-obsidian-border text-xs">
          {onOpenSecurityGuide ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSecurityGuide();
              }}
              className="text-[#8ca396] hover:text-[#00e575] flex items-center gap-1.5 transition cursor-pointer font-medium"
            >
              <ShieldCheck size={14} className="text-[#00e575]" />
              <span>Muncul layar biru SmartScreen? Lihat panduan &rarr;</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#00e575] hover:bg-[#19ff8c] !text-black font-display font-bold text-xs transition shadow-lg shadow-[#00e575]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Buka File Explorer &amp; Install</span>
            <ArrowRight size={14} className="text-black" />
          </button>
        </div>

      </div>
    </div>
  );
};

