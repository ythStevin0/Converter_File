import React, { useState, useEffect } from 'react';
import { Download, ChevronDown, Check, Monitor, Apple, HelpCircle } from 'lucide-react';

interface SmartDownloadButtonProps {
  onOpenGuide: () => void;
}

export const SmartDownloadButton: React.FC<SmartDownloadButtonProps> = ({ onOpenGuide }) => {
  const [detectedOS, setDetectedOS] = useState<'windows' | 'mac' | 'other'>('windows');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      setDetectedOS('mac');
    } else {
      setDetectedOS('windows');
    }
  }, []);

  const isLocalOrDirect = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const releaseBase = 'https://github.com/ythStevin0/Converter_File/releases/latest';

  const downloadOptions = [
    {
      os: 'windows',
      name: 'Windows Installer (.exe)',
      desc: 'Windows 10/11 64-bit (Direkomendasikan)',
      url: isLocalOrDirect ? '/OrbitDrop-Setup.exe' : `${releaseBase}/download/OrbitDrop-Setup.exe`,
      filename: 'OrbitDrop-Setup.exe',
      icon: Monitor,
    },
    {
      os: 'windows',
      name: 'Windows Portable (.exe)',
      desc: 'Langsung jalan tanpa instalasi',
      url: isLocalOrDirect ? '/OrbitDrop-Portable.exe' : `${releaseBase}/download/OrbitDrop-Portable.exe`,
      filename: 'OrbitDrop-Portable.exe',
      icon: Monitor,
    },
    {
      os: 'mac',
      name: 'macOS Apple Silicon & Intel (.dmg)',
      desc: 'macOS Monterey / Ventura / Sonoma / Sequoia',
      url: `${releaseBase}/download/OrbitDrop.dmg`,
      filename: 'OrbitDrop.dmg',
      icon: Apple,
    },
  ];

  const primaryOption = detectedOS === 'mac' ? downloadOptions[2] : downloadOptions[0];

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="flex items-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-[1px] shadow-2xl shadow-blue-500/25">
        {/* Main CTA Download Button */}
        <a
          href={primaryOption.url}
          download={primaryOption.filename}
          className="flex items-center gap-3 px-6 py-4 rounded-l-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-base transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="leading-tight">Unduh OrbitDrop</span>
            <span className="text-[11px] font-normal text-blue-200">
              {primaryOption.name}
            </span>
          </div>
        </a>

        {/* Dropdown Chevron Button */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-3 py-4 rounded-r-2xl bg-blue-700 hover:bg-blue-600 text-white border-l border-blue-500/30 transition-colors"
          title="Pilih Opsi Download Lainnya"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Dropdown menu */}
      {showDropdown && (
        <div 
          className="absolute top-full mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2"
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Pilihan Installer Lintas OS
          </div>
          {downloadOptions.map((opt, idx) => (
            <a
              key={idx}
              href={opt.url}
              download={opt.filename}
              onClick={() => setShowDropdown(false)}
              className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-left transition-colors group"
            >
              <opt.icon size={16} className="text-slate-400 group-hover:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  {opt.name}
                </div>
                <div className="text-[10px] text-slate-400">{opt.desc}</div>
              </div>
            </a>
          ))}
          <div className="border-t border-slate-800 mt-1 pt-1">
            <a
              href="https://github.com/ythStevin0/Converter_File/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[11px] font-medium text-blue-400 hover:underline py-1"
            >
              Lihat Semua Rilis di GitHub &rarr;
            </a>
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
        <span>Bebas Virus &bull; 100% Offline-First</span>
        <span>&bull;</span>
        <button
          type="button"
          onClick={onOpenGuide}
          className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1 font-medium"
        >
          <HelpCircle size={12} />
          <span>Layar Unverified? Klik di sini</span>
        </button>
      </div>
    </div>
  );
};
