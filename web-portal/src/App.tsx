import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { LandingPage } from './pages/LandingPage';
import { VerifyPage } from './pages/VerifyPage';
import { UnlockPage } from './pages/UnlockPage';

export const App: React.FC = () => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between antialiased selection:bg-[#00e575] selection:text-[#040605]">
      {/* Top Architectural Bar */}
      <Navbar onOpenGuide={() => setIsGuideOpen(true)} />

      {/* Main Workspace with Real SPA URL Routes */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                onOpenGuide={() => setIsGuideOpen(true)}
                onGoToVerify={() => navigate('/verify')}
                onGoToDecrypt={() => navigate('/decrypt')}
              />
            }
          />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/decrypt" element={<UnlockPage />} />
          <Route path="/unlock" element={<UnlockPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Security Guide Modal */}
      <SecurityGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Architectural Footer */}
      <footer className="w-full border-t border-obsidian-border bg-obsidian-950 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#6e8578]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00e575]"></span>
            <span className="font-bold text-white">OrbitDrop v1.0</span>
            <span>// 100% Local Conversion &amp; Web3 Utility</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  const el = document.getElementById('panduan-instalasi');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-[#00e575] transition cursor-pointer"
            >
              Panduan Instalasi
            </button>
            <a
              href="https://github.com/ythStevin0/Converter_File/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00e575] transition"
            >
              GitHub Releases
            </a>
            <a
              href="https://github.com/ythStevin0/Converter_File"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00e575] transition"
            >
              Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
