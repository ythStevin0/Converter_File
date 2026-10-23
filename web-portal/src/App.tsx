import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { LandingPage } from './pages/LandingPage';
import { VerifyPage } from './pages/VerifyPage';
import { UnlockPage } from './pages/UnlockPage';
import { Orbit, Heart } from 'lucide-react';

const GithubIcon = ({ size = 13, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'landing' | 'verify' | 'unlock'>('landing');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Pages */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onOpenGuide={() => setIsGuideOpen(true)}
            onGoToVerify={() => setActiveTab('verify')}
          />
        )}
        {activeTab === 'verify' && <VerifyPage />}
        {activeTab === 'unlock' && <UnlockPage />}
      </main>

      {/* Security Guide Modal */}
      <SecurityGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-300">OrbitDrop</span>
            <span>&bull; 100% Local Conversion &amp; Web3 Utility</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Panduan Instalasi
            </button>
            <a
              href="https://github.com/ythStevin0/Converter_File/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub Releases
            </a>
            <a
              href="https://github.com/ythStevin0/Converter_File"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
            >
              <GithubIcon size={13} />
              <span>Repository</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
