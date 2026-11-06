import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { 
  ShieldCheck, 
  FileText, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Minus, 
  Square, 
  X, 
  FolderOpen, 
  Hash, 
  Check 
} from 'lucide-react';

interface VerifyStep {
  id: number;
  title: string;
  desc: string;
}

const VERIFY_STEPS: VerifyStep[] = [
  { id: 1, title: '01. Pemicu Ctrl+Drag', desc: 'Tekan Berkas + Tahan CTRL' },
  { id: 2, title: '02. Sorot CHECKSUM', desc: 'Menu radial aksi cepat' },
  { id: 3, title: '03. Hashing CPU', desc: '0.02 detik kalkulasi' },
  { id: 4, title: '04. Bukti Keaslian', desc: 'Hash disalin & valid' },
];

const AUTHENTIC_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const TAMPERED_HASH = '7a5f28bc9910d44208a1c8996fb92427ae41e4649b934ca495991b7852b855aa';

export const VerifyTutorialShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTamperMode, setIsTamperMode] = useState(false);
  const [isDropped, setIsDropped] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const fileCardRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ctrlBadgeRef = useRef<HTMLDivElement>(null);
  const centralHubRef = useRef<HTMLDivElement>(null);
  const checksumSliceRef = useRef<HTMLDivElement>(null);
  const resultNotificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const fileCard = fileCardRef.current;
    const cursor = cursorRef.current;
    const ctrlBadge = ctrlBadgeRef.current;
    const centralHub = centralHubRef.current;
    const checksumSlice = checksumSliceRef.current;
    const resultNotif = resultNotificationRef.current;

    if (!fileCard || !cursor || !ctrlBadge || !centralHub || !checksumSlice || !resultNotif) return;

    // Reset initial states
    gsap.set(fileCard, { x: -140, y: 110, opacity: 0, scale: 0.85 });
    gsap.set(cursor, { x: -160, y: 130, opacity: 0, scale: 1 });
    gsap.set(ctrlBadge, { opacity: 0, y: -8, scale: 0.9 });
    gsap.set(centralHub, { scale: 1 });
    gsap.set(checksumSlice, { scale: 1 });
    gsap.set(resultNotif, { y: 20, opacity: 0, scale: 0.9 });

    setIsDropped(false);

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 2.4,
      onUpdate: () => {
        const progress = tl.progress();
        if (progress < 0.25) setActiveStep(1);
        else if (progress < 0.52) setActiveStep(2);
        else if (progress < 0.76) setActiveStep(3);
        else setActiveStep(4);
      },
    });

    timelineRef.current = tl;

    // PHASE 1: Step 1 (Tekan Berkas Sambil Tahan CTRL & Arahkan)
    tl.to(cursor, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      .to(fileCard, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }, '-=0.15')
      .to(cursor, { scale: 0.85, duration: 0.15, ease: 'power1.in' })
      .to(ctrlBadge, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'back.out(1.6)' })
      .to([cursor, fileCard], {
        x: 0,
        y: 0,
        duration: 0.95,
        ease: 'power2.inOut',
      })
      // PHASE 2: Step 2 (Drop on Center Dial & HUD Flowers Open)
      .to(fileCard, { opacity: 0, scale: 0.5, duration: 0.22 })
      .to(cursor, { scale: 1, duration: 0.15 })
      .to(ctrlBadge, { opacity: 0, duration: 0.2 }, '-=0.1')
      .call(() => setIsDropped(true))
      .to(centralHub, {
        scale: 1.08,
        duration: 0.22,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      })
      // Cursor moves to highlight the CHECKSUM radial slice (top position: x=0, y=-135)
      .to(cursor, {
        x: 0,
        y: -135,
        duration: 0.75,
        ease: 'power2.inOut',
      })
      .to(checksumSlice, {
        scale: 1.15,
        duration: 0.2,
        ease: 'back.out(1.8)',
      })
      // PHASE 3: Step 3 (Click CHECKSUM & Compute)
      .to(cursor, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 })
      // PHASE 4: Step 4 (Solid clean Electron Checksum Pill appears with zero clash)
      .to(resultNotif, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: 'back.out(1.6)',
      })
      .to({}, { duration: 2.4 });

    return () => {
      tl.kill();
    };
  }, [isTamperMode]);

  const togglePlay = () => {
    if (!timelineRef.current) return;
    if (isPlaying) {
      timelineRef.current.pause();
      setIsPlaying(false);
    } else {
      timelineRef.current.play();
      setIsPlaying(true);
    }
  };

  const restartVideo = () => {
    if (!timelineRef.current) return;
    timelineRef.current.restart();
    setIsPlaying(true);
  };

  const jumpToStep = (stepId: number) => {
    if (!timelineRef.current) return;
    const positions = [0.05, 0.32, 0.62, 0.88];
    timelineRef.current.progress(positions[stepId - 1]);
    setActiveStep(stepId);
  };

  const displayedHash = isTamperMode ? TAMPERED_HASH : AUTHENTIC_HASH;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Header & Scenario Switcher */}
      <div className="w-full max-w-[520px] flex items-center justify-between gap-3 mb-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00e575] animate-pulse" />
          <span className="font-mono text-[11px] font-bold text-[#00e575] uppercase">
            Simulasi Video Electron
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-obsidian-900 border border-obsidian-border p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setIsTamperMode(false);
              restartVideo();
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] transition cursor-pointer font-medium ${
              !isTamperMode
                ? 'bg-[#00e575] !text-black font-bold shadow-sm'
                : 'text-[#8ca396] hover:text-white'
            }`}
          >
            ✓ Berkas Asli
          </button>
          <button
            type="button"
            onClick={() => {
              setIsTamperMode(true);
              restartVideo();
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] transition cursor-pointer font-medium ${
              isTamperMode
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-[#8ca396] hover:text-white'
            }`}
          >
            ⚠️ Berkas Dimodifikasi
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* AUTHENTIC ELECTRON DESKTOP WINDOW CONTAINER (Matching Electron App)    */}
      {/* ======================================================================= */}
      <div className="relative z-10 w-full max-w-[520px] rounded-[28px] bg-[#0b0d14] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        
        {/* Title Bar & Controls (Identical to Electron src/App.tsx line 296) */}
        <header className="h-11 px-4 flex items-center justify-between border-b border-white/5 bg-[#0f111a]/90 select-none">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e575] shadow-[0_0_10px_#00e575] animate-pulse" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-white font-sans">
              ORBITDROP
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-medium">
              Local Engine
            </span>

            {isDropped && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/90 text-white/80 border border-white/10 ml-1">
                Proposal_Final.pdf
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <Minus size={13} className="hover:text-white transition" />
            <Square size={11} className="hover:text-white transition" />
            <X size={13} className="hover:text-rose-400 transition" />
          </div>
        </header>

        {/* Central Workspace: Omnitrix HUD and Slices */}
        <div 
          ref={containerRef}
          className="relative w-full h-[480px] flex items-center justify-center overflow-hidden bg-[#070b14] select-none"
        >
          {/* Ambient Background Glow */}
          <div className="absolute w-[380px] h-[380px] rounded-full bg-[#00e575]/10 blur-3xl pointer-events-none" />

          {/* Omnitrix Mechanical Bezel & Guide Rings (SVG) */}
          <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <circle cx="250" cy="250" r="234" fill="none" stroke="#64748b" strokeWidth="3" opacity="0.35" />
            <circle cx="250" cy="250" r="228" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.75" />
            <line x1="250" y1="12" x2="250" y2="26" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="474" y1="250" x2="488" y2="250" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="250" y1="474" x2="250" y2="488" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="250" x2="26" y2="250" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="250" cy="250" r="165" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="5 7" opacity="0.4" />
            <circle cx="250" cy="250" r="85" fill="none" stroke="#cbd5e1" strokeWidth="3" opacity="0.5" />
            <circle cx="250" cy="250" r="82" fill="none" stroke="#22c55e" strokeWidth="2" />
          </svg>

          {/* Radial Quick Action Slices (Matching Electron RadialMenu) */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
            {/* CHECKSUM Slice (Top: 12 o'clock) */}
            <div
              ref={checksumSliceRef}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-[#38bdf8] bg-slate-900/95 shadow-[0_0_25px_rgba(56,189,248,0.6)] z-20"
              style={{ left: '50%', top: 'calc(50% - 135px)' }}
            >
              <Hash size={14} className="text-[#38bdf8]" />
              <span className="text-[11px] font-black text-white font-mono">CHECKSUM</span>
              <span className="text-[9px] text-[#38bdf8] font-mono">0.02s</span>
            </div>

            {/* Other radial actions muted */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/10 bg-slate-900/80 text-slate-400 opacity-50 text-[10px] font-mono"
              style={{ left: 'calc(50% + 135px)', top: '50%' }}
            >
              <span>ENCRYPT</span>
            </div>

            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/10 bg-slate-900/80 text-slate-400 opacity-50 text-[10px] font-mono"
              style={{ left: '50%', top: 'calc(50% + 135px)' }}
            >
              <span>COMPRESS</span>
            </div>

            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/10 bg-slate-900/80 text-slate-400 opacity-50 text-[10px] font-mono"
              style={{ left: 'calc(50% - 135px)', top: '50%' }}
            >
              <span>METADATA</span>
            </div>
          </div>

          {/* Central Omnitrix Core Dial */}
          <div 
            ref={centralHubRef}
            className="relative z-10 w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center p-3 text-center transition-transform duration-200"
            style={{
              background: 'radial-gradient(circle, #1e293b 0%, #0a0f1d 100%)',
              border: '3px solid #cbd5e1',
              boxShadow: '0 10px 28px rgba(0,0,0,0.85), 0 0 20px rgba(34,197,94,0.35)',
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e575] mb-1.5 shadow-[0_0_8px_#00e575]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 font-sans">
              {isDropped ? 'BERKAS AKTIF' : 'TARUH BERKAS'}
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1 truncate max-w-[110px]">
              {isDropped ? 'Proposal_Final.pdf' : 'PDF, DOCX, dsb'}
            </span>
          </div>

          {/* Dynamic Visual CTRL Trigger Badge */}
          <div
            ref={ctrlBadgeRef}
            className="absolute top-3 right-3 z-40 px-3 py-1 rounded-full bg-slate-900/95 border border-emerald-500/60 shadow-[0_0_20px_rgba(0,229,117,0.4)] backdrop-blur-md flex items-center gap-1.5 opacity-0 select-none pointer-events-none"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-emerald-500/25 text-[#00e575] font-mono text-[10px] font-black border border-emerald-500/40 shadow-xs">
              CTRL
            </kbd>
            <span className="text-[10px] font-mono text-white font-bold tracking-tight">
              Ditahan saat seret berkas
            </span>
          </div>

          {/* Simulated Ingested File Card */}
          <div
            ref={fileCardRef}
            className="absolute z-30 px-3.5 py-2.5 rounded-xl bg-slate-900/95 border border-[#38bdf8]/50 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 pointer-events-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
              <FileText size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white font-mono">
                Proposal_Final.pdf
              </span>
              <span className="text-[10px] font-mono text-slate-400">1.2 MB • Dokumen</span>
            </div>
          </div>

          {/* CLEAN UNIFIED RESULT CARD (No clashing lines, fully solid opaque background) */}
          <div
            ref={resultNotificationRef}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[420px] rounded-2xl bg-[#0c121e] border-2 border-emerald-500/70 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(0,229,117,0.2)] p-3.5 space-y-2 select-none"
          >
            {/* Top row: Exact Electron Notification Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white font-mono truncate max-w-[210px]">
                  SHA-256 disalin! ({displayedHash.slice(0, 8)}...{displayedHash.slice(-6)})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-extrabold">
                SELESAI (0.02s)
              </span>
            </div>

            {/* Bottom row: Verification Status Badge */}
            <div className={`p-2 rounded-xl text-[11px] font-mono font-bold flex items-center gap-2 ${
              isTamperMode 
                ? 'bg-rose-950/70 border border-rose-500 text-rose-300' 
                : 'bg-emerald-950/70 border border-emerald-500/50 text-[#86efac]'
            }`}>
              {isTamperMode ? (
                <>
                  <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                  <span className="truncate">⚠️ Tamper Terdeteksi: Hash tidak cocok!</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={13} className="text-[#00e575] shrink-0" />
                  <span className="truncate">✓ 100% Cocok: Bit-per-bit asli tanpa modifikasi</span>
                </>
              )}
            </div>
          </div>

          {/* Virtual Mouse Pointer */}
          <div
            ref={cursorRef}
            className="absolute z-50 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 3L11.5 21L14.5 13.5L22 10.5L4 3Z"
                fill="#ffffff"
                stroke="#040605"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Window Footer Status (Single Unified Line matching Electron App) */}
        <footer className="h-10 px-4 flex items-center justify-between border-t border-white/5 bg-[#0f111a]/80 select-none text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold shadow-sm">
            <FolderOpen size={11} className="text-[#00e575]" />
            <span>Pilih File</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-2 h-2 rounded-full bg-[#00e575] shadow-[0_0_6px_#00e575]" />
            <span>100% Offline &amp; Privat</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-white/70 shadow-md">
            <span>Pemicu:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#00e575] font-mono text-[10px] border border-emerald-500/30 font-bold shadow-xs">
              Ctrl+Drag
            </kbd>
            <span className="text-white/40">/</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-[10px] border border-white/20 font-semibold shadow-xs">
              Alt+Space
            </kbd>
          </div>
        </footer>
      </div>

      {/* Step Stepper Under Electron Window */}
      <div className="w-full max-w-[520px] grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {VERIFY_STEPS.map((step) => {
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => jumpToStep(step.id)}
              className={`p-2.5 rounded-xl text-left transition cursor-pointer border ${
                isActive
                  ? 'bg-[#00e575]/15 border-[#00e575] text-white shadow-[0_0_15px_rgba(0,229,117,0.15)]'
                  : 'bg-obsidian-900/60 border-obsidian-border text-[#6e8578] hover:text-[#a0b3a8]'
              }`}
            >
              <div className={`text-[11px] font-bold ${isActive ? 'text-[#00e575]' : 'text-slate-300'}`}>
                {step.title}
              </div>
              <div className="text-[10px] text-[#6e8578] truncate mt-0.5">
                {step.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};