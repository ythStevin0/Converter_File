import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  FileText, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Minus, 
  Square, 
  X, 
  FolderOpen, 
  Eye, 
  EyeOff 
} from 'lucide-react';

interface DecryptStep {
  id: number;
  title: string;
  desc: string;
}

const DECRYPT_STEPS: DecryptStep[] = [
  { id: 1, title: '01. Pemicu Ctrl+Drag', desc: 'Tekan Berkas + Tahan CTRL' },
  { id: 2, title: '02. Dialog Modal', desc: 'Modal dekripsi offline' },
  { id: 3, title: '03. Input Sandi', desc: 'Kunci rahasia dimasukkan' },
  { id: 4, title: '04. Pulih Offline', desc: 'File asli terbuka 100%' },
];

export const DecryptTutorialShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [typedPassword, setTypedPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessToast, setIsSuccessToast] = useState(false);
  const [isErrorAlert, setIsErrorAlert] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const fileCardRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ctrlBadgeRef = useRef<HTMLDivElement>(null);
  const bezelSvgRef = useRef<SVGSVGElement>(null);
  const centerDialRef = useRef<HTMLDivElement>(null);
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);
  const unlockBtnRef = useRef<HTMLButtonElement>(null);
  const resultNotificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const fileCard = fileCardRef.current;
    const cursor = cursorRef.current;
    const ctrlBadge = ctrlBadgeRef.current;
    const bezelSvg = bezelSvgRef.current;
    const centerDial = centerDialRef.current;
    const modalBackdrop = modalBackdropRef.current;
    const modalBox = modalBoxRef.current;
    const unlockBtn = unlockBtnRef.current;
    const resultNotif = resultNotificationRef.current;

    if (!fileCard || !cursor || !ctrlBadge || !bezelSvg || !centerDial || !modalBackdrop || !modalBox || !unlockBtn || !resultNotif) {
      return;
    }

    // Initial reset matching exact Electron state
    gsap.set(fileCard, { x: -140, y: 110, opacity: 0, scale: 0.85 });
    gsap.set(cursor, { x: -160, y: 130, opacity: 0, scale: 1 });
    gsap.set(ctrlBadge, { opacity: 0, y: -8, scale: 0.9 });
    gsap.set([bezelSvg, centerDial], { opacity: 1 });
    gsap.set(modalBackdrop, { opacity: 0, pointerEvents: 'none' });
    gsap.set(modalBox, { scale: 0.92, opacity: 0, y: 15 });
    gsap.set(resultNotif, { y: 20, opacity: 0, scale: 0.9 });

    setTypedPassword('');
    setIsModalOpen(false);
    setIsSuccessToast(false);
    setIsErrorAlert(false);

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
      // PHASE 2: Step 2 (.locked File Triggers UnlockModal -> Circle background dims out completely)
      .to(fileCard, { opacity: 0, scale: 0.5, duration: 0.22 })
      .to(cursor, { scale: 1, duration: 0.15 })
      .to(ctrlBadge, { opacity: 0, duration: 0.2 }, '-=0.1')
      .call(() => setIsModalOpen(true))
      // Fade out background circle completely so it NEVER bleeds through the modal!
      .to([bezelSvg, centerDial], {
        opacity: 0.05,
        duration: 0.3,
        ease: 'power2.out',
      })
      .to(modalBackdrop, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      }, '-=0.3')
      .to(modalBox, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: 'back.out(1.4)',
      }, '-=0.2')
      // PHASE 3: Step 3 (Typing Password into input)
      .to({}, {
        duration: 0.7,
        onStart: () => {
          setTypedPassword(isWrongPassword ? 'sandi-salah-123' : 'orbit-drop-safe-2026');
        },
      })
      // Cursor moves to "Buka Kunci Berkas" Button
      .to(cursor, {
        x: 105,
        y: 110,
        duration: 0.6,
        ease: 'power2.out',
      })
      .to(unlockBtn, {
        scale: 0.94,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
      });

    // PHASE 4: Step 4 (Decryption Result)
    if (isWrongPassword) {
      tl.call(() => setIsErrorAlert(true))
        .to({}, { duration: 2.0 });
    } else {
      // Success: Modal closes, backdrop fades out, and clean result pill appears
      tl.to(modalBox, {
        opacity: 0,
        scale: 0.94,
        y: 10,
        duration: 0.3,
        ease: 'power2.in',
      })
        .to(modalBackdrop, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        }, '-=0.2')
        .to([bezelSvg, centerDial], {
          opacity: 0.85,
          duration: 0.3,
        }, '-=0.2')
        .call(() => {
          setIsModalOpen(false);
          setIsSuccessToast(true);
        })
        .to(resultNotif, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: 'back.out(1.6)',
        })
        .to({}, { duration: 2.2 });
    }

    return () => {
      tl.kill();
    };
  }, [isWrongPassword]);

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
              setIsWrongPassword(false);
              restartVideo();
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] transition cursor-pointer font-medium ${
              !isWrongPassword
                ? 'bg-[#00e575] !text-black font-bold shadow-sm'
                : 'text-[#8ca396] hover:text-white'
            }`}
          >
            ✓ Sandi Benar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsWrongPassword(true);
              restartVideo();
            }}
            className={`px-2.5 py-0.5 rounded text-[11px] transition cursor-pointer font-medium ${
              isWrongPassword
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-[#8ca396] hover:text-white'
            }`}
          >
            ✗ Sandi Salah
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
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <Minus size={13} className="hover:text-white transition" />
            <Square size={11} className="hover:text-white transition" />
            <X size={13} className="hover:text-rose-400 transition" />
          </div>
        </header>

        {/* Central Workspace */}
        <div 
          ref={containerRef}
          className="relative w-full h-[480px] flex items-center justify-center overflow-hidden bg-[#070b14] select-none"
        >
          {/* Ambient Background Glow */}
          <div className="absolute w-[380px] h-[380px] rounded-full bg-[#00e575]/10 blur-3xl pointer-events-none" />

          {/* Omnitrix Mechanical Bezel (Fades out when Modal is Open) */}
          <svg 
            ref={bezelSvgRef}
            viewBox="0 0 500 500" 
            className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-300"
          >
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

          {/* Central Omnitrix Core Dial */}
          <div 
            ref={centerDialRef}
            className="relative z-10 w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center p-3 text-center transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle, #1e293b 0%, #0a0f1d 100%)',
              border: '3px solid #cbd5e1',
              boxShadow: '0 10px 28px rgba(0,0,0,0.85), 0 0 20px rgba(34,197,94,0.35)',
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e575] mb-1.5 shadow-[0_0_8px_#00e575]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 font-sans">
              TARUH BERKAS
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1">
              File .locked
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

          {/* Simulated Draggable Ingested File */}
          <div
            ref={fileCardRef}
            className="absolute z-20 px-3.5 py-2.5 rounded-xl bg-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 pointer-events-none"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Lock size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white font-mono">
                Kontrak_Kerahasiaan.pdf.locked
              </span>
              <span className="text-[10px] font-mono text-amber-300">2.4 MB • AES-256</span>
            </div>
          </div>

          {/* FULL OPAQUE BACKDROP (Identical to Electron UnlockModal.tsx line 110: bg-black/80 backdrop-blur-md) */}
          <div
            ref={modalBackdropRef}
            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-none"
          >
            {/* EXACT ELECTRON MODAL DIALOG: UnlockModal.tsx (100% Solid Opaque Background) */}
            <div
              ref={modalBoxRef}
              className="relative w-full max-w-[420px] rounded-2xl border-2 border-[#94a3b8]/40 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(34,197,94,0.2)] text-white overflow-hidden bg-[#0c121e]"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0c121e 100%)',
              }}
            >
              {/* Header matching UnlockModal.tsx line 125 */}
              <div className="flex items-center justify-between border-b border-[#94a3b8]/30 px-4 py-3 bg-slate-900/90">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#22c55e]/40 bg-[#22c55e]/15 shadow-[0_0_12px_rgba(34,197,94,0.3)]">
                    <Unlock className="h-4 w-4 text-[#22c55e]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black tracking-wide text-white uppercase font-display">
                      Dekripsi Berkas (.locked)
                    </h2>
                    <p className="text-[10px] text-slate-400">Buka kunci AES-256-GCM secara offline</p>
                  </div>
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded border border-[#94a3b8]/30 text-slate-400">
                  <X size={12} />
                </div>
              </div>

              {/* Body matching UnlockModal.tsx line 148 */}
              <div className="p-4 space-y-3 bg-[#0c121e]">
                {/* File Info Pill */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-[#94a3b8]/20 text-xs">
                  <div className="truncate mr-2">
                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Berkas Terkunci:</span>
                    <span className="font-bold text-white text-xs truncate block font-mono">
                      Kontrak_Kerahasiaan.pdf.locked
                    </span>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#4ade80] font-mono text-[10px] font-bold">
                    2.4 MB
                  </span>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block font-sans">
                    Kata Sandi Pembuka Kunci:
                  </label>
                  <div className="relative">
                    <div className="w-full bg-slate-950 border border-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.25)] rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between font-mono">
                      <span>{typedPassword ? '••••••••••••••••' : 'Masukkan kata sandi pengunci...'}</span>
                      <Eye size={13} className="text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Error Alert matching UnlockModal.tsx line 186 */}
                {isErrorAlert && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-950/70 border border-rose-500 text-[11px] text-rose-300">
                    <AlertCircle size={13} className="shrink-0 text-rose-400" />
                    <span>Kata sandi salah atau berkas rusak / telah dimodifikasi.</span>
                  </div>
                )}

                {/* Notice matching UnlockModal.tsx line 194 */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-[#22c55e]/25 text-[10px] text-slate-300">
                  <CheckCircle2 size={13} className="text-[#22c55e] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Dekripsi dilakukan secara lokal di CPU komputer Anda. Nama berkas asli dipulihkan secara otomatis.
                  </p>
                </div>
              </div>

              {/* Footer matching UnlockModal.tsx line 203 */}
              <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[#94a3b8]/30 bg-slate-900/90">
                <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-400">
                  Batal (Esc)
                </span>
                <button
                  ref={unlockBtnRef}
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-[#22c55e] text-black font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                >
                  <KeyRound size={12} className="text-black" />
                  <span>Buka Kunci Berkas</span>
                </button>
              </div>
            </div>
          </div>

          {/* EXACT ELECTRON SUCCESS NOTIFICATION PILL (Matching src/App.tsx line 325) */}
          <div
            ref={resultNotificationRef}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-slate-900/95 border border-emerald-500/60 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 select-none"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-white truncate max-w-[170px] font-mono">
              Kontrak_Kerahasiaan.pdf
            </span>
            <div className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1">
              <FolderOpen size={11} className="text-black" />
              <span>Buka di File Explorer</span>
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
        {DECRYPT_STEPS.map((step) => {
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