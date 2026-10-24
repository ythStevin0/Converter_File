import React from 'react';

interface NavbarProps {
  activeTab: 'app' | 'verify' | 'decrypt';
  setActiveTab: (tab: 'app' | 'verify' | 'decrypt') => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenGuide,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#040605]/90 backdrop-blur-md border-b border-obsidian-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <button
          type="button"
          onClick={() => setActiveTab('app')}
          className="flex items-center gap-3 group shrink-0 text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-obsidian-800 border border-[#00e575]/50 flex items-center justify-center group-hover:bg-[#00e575] group-hover:text-obsidian-950 text-[#00e575] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
              <path strokeLinecap="round" d="M12 3a9 9 0 0 1 9 9m-9 9a9 9 0 0 1-9-9" />
              <rect x="17.5" y="3.5" width="3" height="3" fill="currentColor" rx="0.5" />
              <rect x="3.5" y="17.5" width="3" height="3" fill="currentColor" rx="0.5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-white">OrbitDrop</span>
              <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 bg-signal-dim text-[#00e575] border border-[#00e575]/30 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#6e8578]">Konverter File Desktop Lokal</p>
          </div>
        </button>

        {/* Center Mode Switcher */}
        <nav className="flex items-center bg-obsidian-900 border border-obsidian-border rounded-lg p-1">
          <button
            id="nav-tab-app"
            type="button"
            onClick={() => setActiveTab('app')}
            className={`px-3.5 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
              activeTab === 'app'
                ? 'bg-[#00e575] !text-black font-bold shadow-sm'
                : 'text-[#8ca396] hover:text-white font-medium'
            }`}
          >
            Aplikasi &amp; Unduh
          </button>

          <button
            id="nav-tab-verify"
            type="button"
            onClick={() => setActiveTab('verify')}
            className={`px-3.5 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
              activeTab === 'verify'
                ? 'bg-[#00e575] !text-black font-bold shadow-sm'
                : 'text-[#8ca396] hover:text-white font-medium'
            }`}
          >
            Verifikasi Dokumen
          </button>

          <button
            id="nav-tab-decrypt"
            type="button"
            onClick={() => setActiveTab('decrypt')}
            className={`px-3.5 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
              activeTab === 'decrypt'
                ? 'bg-[#00e575] !text-black font-bold shadow-sm'
                : 'text-[#8ca396] hover:text-white font-medium'
            }`}
          >
            Dekripsi .locked
          </button>
        </nav>

        {/* Right Utility Links */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('app');
              setTimeout(() => {
                const el = document.getElementById('panduan-instalasi');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="text-xs text-[#9cb3a6] hover:text-white px-3 py-1.5 transition cursor-pointer"
          >
            Panduan Instalasi
          </button>

          <a
            href="https://github.com/ythStevin0/Converter_File"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-obsidian-900 border border-obsidian-border hover:border-[#00e575] rounded-md text-xs text-white transition"
          >
            <svg className="w-4 h-4 text-[#00e575]" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>GitHub</span>
          </a>
        </div>

      </div>
    </header>
  );
};
