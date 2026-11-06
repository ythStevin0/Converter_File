import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  FileText, 
  FileCode,
  Table,
  Film, 
  Music,
  Image as ImageIcon, 
  UploadCloud,
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  FolderOpen,
  MousePointer2,
  Minus,
  Square,
  X
} from 'lucide-react';
import { ThreeOrbitBackground } from './ThreeOrbitBackground';

interface FormatBadgeItem {
  label: string;
  ext: string;
  icon: React.ElementType;
  color: string;
  speed: string;
  desc: string;
}

const SUPPORTED_FORMAT_BADGES: FormatBadgeItem[] = [
  { label: 'PDF', ext: 'pdf', icon: FileText, color: '#38bdf8', speed: '0.10s', desc: 'Pilih Dokumen PDF' },
  { label: 'DOCX', ext: 'docx', icon: FileCode, color: '#60a5fa', speed: '0.12s', desc: 'Pilih Dokumen Word DOCX' },
  { label: 'XLSX', ext: 'xlsx', icon: Table, color: '#34d399', speed: '0.08s', desc: 'Pilih Spreadsheet Excel / CSV' },
  { label: 'MP4', ext: 'mp4', icon: Film, color: '#f472b6', speed: '0.24s', desc: 'Pilih Berkas Video MP4' },
  { label: 'MP3', ext: 'mp3', icon: Music, color: '#fb923c', speed: '0.08s', desc: 'Pilih Berkas Audio MP3' },
  { label: 'JPG', ext: 'jpg', icon: ImageIcon, color: '#fbbf24', speed: '0.06s', desc: 'Pilih Berkas Gambar JPG' },
  { label: 'PNG', ext: 'png', icon: ImageIcon, color: '#a78bfa', speed: '0.09s', desc: 'Pilih Berkas Gambar PNG' },
  { label: 'EPUB', ext: 'epub', icon: FileText, color: '#4ade80', speed: '0.11s', desc: 'Pilih E-Book EPUB' },
];

const PRESET_FILES = [
  { name: 'Page_001.pdf', size: '1.1 MB', targetBadge: 'DOCX', targetOut: 'Page_001.docx', icon: FileText, speed: '0.12 detik' },
  { name: 'Photo_Portrait.heic', size: '2.4 MB', targetBadge: 'JPG', targetOut: 'Photo_Portrait.jpg', icon: ImageIcon, speed: '0.06 detik' },
  { name: 'Screen_Rec.mp4', size: '4.8 MB', targetBadge: 'MP4', targetOut: 'Screen_Rec.gif', icon: Film, speed: '0.24 detik' },
  { name: 'Backup_Data.zip', size: '6.2 MB', targetBadge: 'XLSX', targetOut: 'Backup_Data.xlsx', icon: Table, speed: '0.08 detik' },
];

const TUTORIAL_STEPS = [
  { id: 1, title: '01. Pemicu Ctrl+Drag', desc: 'Tekan Berkas + Tahan CTRL' },
  { id: 2, title: '02. Deteksi HUD', desc: 'Dial Membaca Metadata' },
  { id: 3, title: '03. Pilih Format', desc: 'Sorot Format Tujuan' },
  { id: 4, title: '04. Selesai Offline', desc: 'Hasil di File Explorer' },
];

export const InteractiveTutorialShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activePresetIdx, setActivePresetIdx] = useState<number>(0);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>('DOCX');
  const [isDropped, setIsDropped] = useState<boolean>(false);
  const [isConverted, setIsConverted] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const fileCardRef = useRef<HTMLDivElement | null>(null);
  const ctrlBadgeRef = useRef<HTMLDivElement | null>(null);
  const centralHubRef = useRef<HTMLDivElement | null>(null);
  const badgesGroupRef = useRef<HTMLDivElement | null>(null);
  const resultNotificationRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const currentPreset = PRESET_FILES[activePresetIdx];
  const activeBadge = SUPPORTED_FORMAT_BADGES.find((b) => b.label === hoveredBadge) || SUPPORTED_FORMAT_BADGES[1];

  // GSAP Animation Timeline
  useEffect(() => {
    if (!containerRef.current) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const cursor = cursorRef.current;
    const fileCard = fileCardRef.current;
    const ctrlBadge = ctrlBadgeRef.current;
    const centralHub = centralHubRef.current;
    const badges = badgesGroupRef.current?.children;
    const resultNotif = resultNotificationRef.current;

    if (!cursor || !fileCard || !centralHub || !badges || !resultNotif || !ctrlBadge) return;

    // Reset initial states
    gsap.set(fileCard, { x: -140, y: 130, opacity: 0, scale: 0.8 });
    gsap.set(cursor, { x: -160, y: 150, opacity: 0, scale: 1 });
    gsap.set(ctrlBadge, { opacity: 0, y: -8, scale: 0.9 });
    gsap.set(centralHub, { scale: 1 });
    gsap.set(badges, { scale: 1, opacity: 1 });
    gsap.set(resultNotif, { y: 20, opacity: 0, scale: 0.9 });
    setIsDropped(false);
    setIsConverted(false);
    setHoveredBadge(currentPreset.targetBadge);

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 2.4,
      onUpdate: () => {
        const progress = tl.progress();
        if (progress < 0.26) setActiveStep(1);
        else if (progress < 0.52) setActiveStep(2);
        else if (progress < 0.78) setActiveStep(3);
        else setActiveStep(4);
      },
    });

    timelineRef.current = tl;

    // Target badge coordinate (idx 1 DOCX is at 45 deg from top: x ≈ 113, y ≈ -113 on 500-unit scale, ≈ 90px on 400px screen)
    const targetBadgeIndex = SUPPORTED_FORMAT_BADGES.findIndex(b => b.label === currentPreset.targetBadge);
    const angle = (targetBadgeIndex * (360 / SUPPORTED_FORMAT_BADGES.length) - 90) * (Math.PI / 180);
    const radius = 135; // Position relative to center
    const targetX = radius * Math.cos(angle);
    const targetY = radius * Math.sin(angle);

    // PHASE 1: Step 1 (Tekan Berkas Sambil Tahan CTRL & Arahkan ke OrbitDrop)
    tl.to(cursor, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      .to(fileCard, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }, '-=0.15')
      // Cursor clicks down / presses file
      .to(cursor, { scale: 0.85, duration: 0.15, ease: 'power1.in' })
      // [ CTRL ] indicator activates with neon pulse
      .to(ctrlBadge, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'back.out(1.6)' })
      // File is pressed & directed towards OrbitDrop center
      .to([cursor, fileCard], {
        x: 0,
        y: 0,
        duration: 0.95,
        ease: 'power2.inOut',
      })
      // PHASE 2: Step 2 (Drop on Center Dial & Load Metadata)
      .to(fileCard, { opacity: 0, scale: 0.4, duration: 0.22, ease: 'power2.in' })
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
      .to(badges, {
        scale: 1.05,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        stagger: 0.02,
        ease: 'back.out(2)',
      }, '-=0.2')
      // PHASE 3: Step 3 (Cursor moves to target format badge)
      .to(cursor, {
        x: targetX,
        y: targetY,
        duration: 0.75,
        ease: 'power2.out',
        onComplete: () => setHoveredBadge(currentPreset.targetBadge),
      })
      .to(cursor, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
      // PHASE 4: Step 4 (Instant Offline Conversion Complete)
      .call(() => setIsConverted(true))
      .to(resultNotif, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: 'back.out(1.8)',
      })
      .to(cursor, { opacity: 0, duration: 0.35 }, '-=0.15');

    if (!isPlaying) {
      tl.pause();
    }

    return () => {
      tl.kill();
    };
  }, [activePresetIdx, currentPreset]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (timelineRef.current) {
      if (isPlaying) {
        timelineRef.current.pause();
      } else {
        timelineRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle Step Click
  const handleStepClick = (stepId: number) => {
    if (!timelineRef.current) return;
    setIsPlaying(false);
    timelineRef.current.pause();
    setActiveStep(stepId);

    const positions = [0, 0.32, 0.62, 0.92];
    timelineRef.current.progress(positions[stepId - 1]);
  };

  const PresetIcon = currentPreset.icon;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* 3D Orbit Atmosphere in Background */}
      <ThreeOrbitBackground className="opacity-40" particleCount={140} />

      {/* ======================================================================= */}
      {/* AUTHENTIC ELECTRON DESKTOP WINDOW CONTAINER (Matching npm run dev:electron) */}
      {/* ======================================================================= */}
      <div className="relative z-10 w-full max-w-[520px] rounded-[28px] bg-[#0b0d14]/95 border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden backdrop-blur-2xl">
        
        {/* Title Bar & Controls (Matching Electron) */}
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
              <button
                type="button"
                onClick={() => {
                  setIsDropped(false);
                  setIsConverted(false);
                  if (timelineRef.current) timelineRef.current.restart();
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/90 text-white/80 hover:text-white transition flex items-center gap-1 border border-white/10 ml-1 cursor-pointer"
              >
                <RotateCcw size={10} className="text-[#00e575]" />
                <span>Ganti File</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <Minus size={13} className="hover:text-white transition cursor-pointer" />
            <Square size={11} className="hover:text-white transition cursor-pointer" />
            <X size={13} className="hover:text-rose-400 transition cursor-pointer" />
          </div>
        </header>

        {/* Central Workspace: 100% Identical to DropZone.tsx & RadialMenu.tsx in Electron */}
        <div
          ref={containerRef}
          className="relative w-full h-[450px] flex items-center justify-center p-2 select-none overflow-hidden"
        >
          {/* Virtual Floating Cursor Pointer */}
          <div
            ref={cursorRef}
            className="absolute z-50 pointer-events-none transition-transform"
            style={{ width: 28, height: 28 }}
          >
            <MousePointer2 className="w-6 h-6 text-[#00e575] fill-[#00e575]/30 filter drop-shadow-[0_0_10px_rgba(0,229,117,0.9)]" />
          </div>

          {/* Dynamic Visual CTRL Trigger Badge (Activates when file is pressed & dragged) */}
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

          {/* Initial File Card gliding in (Phase 1) */}
          <div
            ref={fileCardRef}
            className="absolute z-40 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/50 shadow-2xl flex items-center gap-2.5 backdrop-blur-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00e575]">
              <PresetIcon size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">{currentPreset.name}</div>
              <div className="text-[10px] text-emerald-400 font-mono">{currentPreset.size} • Siap Dikonversi</div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* OMNITRIX HUD (Identical SVG & CSS from src/components/DropZone/DropZone.tsx) */}
          {/* ======================================================================= */}
          <div className="relative w-[400px] h-[400px] flex items-center justify-center">

            {/* Ambient Alien Green Glow */}
            <div 
              className="absolute w-[370px] h-[370px] rounded-full blur-3xl pointer-events-none transition-all duration-500"
              style={{
                background: `radial-gradient(circle, rgba(34, 197, 94, 0.45) 0%, rgba(22, 163, 74, 0.16) 50%, transparent 72%)`,
                opacity: 0.8,
              }}
            />

            {/* Omnitrix Mechanical Bezel & Guide Rings (SVG ViewBox 0 0 500 500) */}
            <svg
              viewBox="0 0 500 500"
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
            >
              {/* Outer Matte Grey Industrial Collar */}
              <circle
                cx="250"
                cy="250"
                r="234"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Omnitrix Vibrant Green Accent Ring */}
              <circle
                cx="250"
                cy="250"
                r="228"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                opacity="0.95"
              />

              {/* 4 Quadrant Mechanical Notches (at 12, 3, 6, 9 o'clock) */}
              <line x1="250" y1="12" x2="250" y2="26" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
              <line x1="474" y1="250" x2="488" y2="250" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
              <line x1="250" y1="474" x2="250" y2="488" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
              <line x1="12" y1="250" x2="26" y2="250" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />

              {/* Concentric Circular HUD Radar Track */}
              <circle
                cx="250"
                cy="250"
                r="165"
                fill="none"
                stroke="#475569"
                strokeWidth="1.2"
                strokeDasharray="5 7"
                opacity="0.45"
              />

              {/* 8 Radial Spoke Guide Lines */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 250 + 96 * Math.cos(rad);
                const y1 = 250 + 96 * Math.sin(rad);
                const x2 = 250 + 218 * Math.cos(rad);
                const y2 = 250 + 218 * Math.sin(rad);
                return (
                  <line
                    key={`spoke-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(148, 163, 184, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                );
              })}

              {/* Inner Raised Dial Collar (Light Grey & Green Ring) */}
              <circle
                cx="250"
                cy="250"
                r="85"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="3"
              />
              <circle
                cx="250"
                cy="250"
                r="82"
                fill="none"
                stroke={activeBadge.color}
                strokeWidth="1.5"
                opacity="0.9"
                className="transition-colors duration-200"
              />
            </svg>

            {/* 8 Orbiting Supported Format Badges */}
            <div ref={badgesGroupRef} className="absolute inset-0 pointer-events-auto">
              {SUPPORTED_FORMAT_BADGES.map((badge, idx) => {
                const total = SUPPORTED_FORMAT_BADGES.length;
                const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
                const radius = 132; // Scaled radius on 400x400 container
                const x = 200 + radius * Math.cos(angle);
                const y = 200 + radius * Math.sin(angle);
                const Icon = badge.icon;
                const isHovered = hoveredBadge === badge.label;

                return (
                  <button
                    key={badge.label}
                    type="button"
                    onClick={() => setHoveredBadge(badge.label)}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                      background: isHovered ? 'rgba(15, 23, 42, 0.98)' : 'rgba(15, 23, 42, 0.85)',
                      borderColor: isHovered ? badge.color : 'rgba(148, 163, 184, 0.35)',
                      boxShadow: isHovered
                        ? `0 0 18px ${badge.color}aa, 0 4px 14px rgba(0, 0, 0, 0.8)`
                        : '0 3px 10px rgba(0, 0, 0, 0.6)',
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer select-none ${
                      isHovered ? 'scale-115 z-30' : 'scale-100 hover:scale-105 z-20'
                    }`}
                  >
                    <Icon 
                      size={12} 
                      style={{ 
                        color: badge.color,
                        filter: isHovered ? `drop-shadow(0 0 5px ${badge.color})` : 'none',
                      }} 
                    />
                    <span 
                      className="text-[11px] font-black tracking-wider transition-colors duration-200 font-sans leading-none"
                      style={{
                        color: isHovered ? '#ffffff' : '#e2e8f0',
                        textShadow: isHovered ? `0 0 6px ${badge.color}` : 'none',
                      }}
                    >
                      {badge.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Central Raised Omnitrix Dial (Exact Replica of CenterCircle in Electron) */}
            <div
              ref={centralHubRef}
              className="relative z-10 w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center p-2 text-center transition-all duration-200 group cursor-pointer"
              style={{
                background: 'radial-gradient(circle, #1e293b 0%, #0a0f1d 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `3px solid ${activeBadge.color}`,
                boxShadow: `0 10px 28px rgba(0, 0, 0, 0.85), 0 0 20px ${activeBadge.color}60, inset 0 2px 3px rgba(255, 255, 255, 0.3)`,
              }}
            >
              {/* Raised Inner Slit Ring */}
              <div className="absolute inset-1.5 rounded-full border border-slate-500/50 pointer-events-none" />

              {/* Dynamic Center Icon */}
              <div className="mb-1">
                {isConverted ? (
                  <CheckCircle2 size={22} className="text-[#00e575] animate-bounce" />
                ) : (
                  <UploadCloud 
                    size={22} 
                    className="text-[#22c55e] transition-colors duration-200" 
                    strokeWidth={2.4} 
                  />
                )}
              </div>

              {/* Omnitrix Core Pill Button: [● TARUH FILE] */}
              <div 
                className="px-3 py-1 rounded-full flex items-center justify-center gap-1.5 shadow-lg border border-white transition-all duration-150"
                style={{
                  background: `linear-gradient(to right, ${activeBadge.color}, #22c55e)`,
                  boxShadow: `0 0 14px ${activeBadge.color}aa, inset 0 1px 1px rgba(255, 255, 255, 0.9)`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40 shrink-0" />
                <span className="font-black text-[11px] tracking-wide uppercase !text-black font-sans leading-none">
                  {isDropped ? (isConverted ? 'SELESAI' : 'LEPAS BERKAS') : 'TARUH FILE'}
                </span>
              </div>

              {/* Subtext Info */}
              <span 
                className="text-[9px] font-mono font-bold tracking-tight mt-1.5 tabular-nums transition-colors duration-150 truncate max-w-[115px]"
                style={{ color: activeBadge.color }}
              >
                {isDropped ? `${currentPreset.name} (${currentPreset.size})` : 'Klik / Taruh File'}
              </span>
            </div>
          </div>

          {/* Result Notification Card (Phase 4, Matching Electron App line 325) */}
          <div
            ref={resultNotificationRef}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-slate-900/95 border border-emerald-500/60 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 select-none"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-white truncate max-w-[170px] font-mono">
              {currentPreset.targetOut}
            </span>
            <div className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1">
              <FolderOpen size={11} className="text-black" />
              <span>Buka di File Explorer</span>
            </div>
          </div>
        </div>

        {/* Window Footer Status (Exact Replica of Electron App Footer in 1 unified line) */}
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

      {/* ======================================================================= */}
      {/* MINIMALIST TUTORIAL CONTROLLER UNDER THE ELECTRON WINDOW FRAME */}
      {/* ======================================================================= */}
      <div className="w-full max-w-[520px] mt-4 flex flex-col gap-2.5">
        
        {/* Step Stepper Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TUTORIAL_STEPS.map((step) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`p-2 rounded-xl text-left transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#00e575]/15 border-[#00e575] text-white shadow-[0_0_15px_rgba(0,229,117,0.15)]'
                    : 'bg-obsidian-900/60 border-obsidian-border text-[#6e8578] hover:text-[#a0b3a8]'
                }`}
              >
                <div className={`text-[11px] font-bold ${isActive ? 'text-[#00e575]' : 'text-slate-300'}`}>
                  {step.title}
                </div>
                <div className="text-[10px] text-[#6e8578] truncate">
                  {step.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Preset Selector & Play/Pause */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#6e8578]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase">Contoh Berkas:</span>
            <div className="flex items-center gap-1 bg-obsidian-900 border border-obsidian-border p-0.5 rounded-lg">
              {PRESET_FILES.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setActivePresetIdx(idx);
                    setIsPlaying(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                    activePresetIdx === idx
                      ? 'bg-[#00e575] !text-black font-bold'
                      : 'text-[#6e8578] hover:text-white'
                  }`}
                >
                  {preset.name.split('.')[1].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="px-2.5 py-1 rounded-lg bg-obsidian-900 border border-obsidian-border text-white hover:text-[#00e575] flex items-center gap-1 transition cursor-pointer"
            >
              {isPlaying ? <Pause size={12} className="text-[#00e575]" /> : <Play size={12} className="text-[#00e575]" />}
              <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (timelineRef.current) {
                  timelineRef.current.restart();
                  setIsPlaying(true);
                }
              }}
              className="p-1.5 rounded-lg bg-obsidian-900 border border-obsidian-border text-[#6e8578] hover:text-white transition cursor-pointer"
              title="Ulangi Simulasi"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
