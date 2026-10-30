import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Image as ImageIcon,
  Crop,
  Palette,
  Minimize2,
  Tag,
  EyeOff,
  PenTool,
  Hash,
  Lock,
  Layers,
  Zap,
  Download,
} from 'lucide-react';

export interface RadialSliceData {
  id: string;
  label: string;
  type: 'format' | 'action';
  ext?: string;
  icon?: React.ElementType;
  outputSize: string;
  speed: string;
  description?: string;
}

// 1. PDF Format Slices (7 items matching Electron formatRouter.ts: DOCX, JPG, PNG, TXT, HTML, MD, EPUB)
export const PDF_FORMAT_SLICES: RadialSliceData[] = [
  { id: 'fmt-docx', label: 'DOCX', type: 'format', ext: 'docx', outputSize: '1.2 MB', speed: '0.14 detik', description: 'Konversi teks dokumen Word berekstensi .docx' },
  { id: 'fmt-jpg', label: 'JPG', type: 'format', ext: 'jpg', outputSize: '680 KB', speed: '0.09 detik', description: 'Ekstrak tiap halaman PDF menjadi foto JPEG tajam' },
  { id: 'fmt-png', label: 'PNG', type: 'format', ext: 'png', outputSize: '950 KB', speed: '0.11 detik', description: 'Ekstrak halaman PDF ke format gambar PNG lossless' },
  { id: 'fmt-txt', label: 'TXT', type: 'format', ext: 'txt', outputSize: '45 KB', speed: '0.04 detik', description: 'Ekstrak konten teks murni tanpa format' },
  { id: 'fmt-html', label: 'HTML', type: 'format', ext: 'html', outputSize: '120 KB', speed: '0.08 detik', description: 'Konversi struktur PDF ke halaman web HTML5' },
  { id: 'fmt-md', label: 'MD', type: 'format', ext: 'md', outputSize: '35 KB', speed: '0.05 detik', description: 'Ekstrak teks ke format Markdown terstruktur' },
  { id: 'fmt-epub', label: 'EPUB', type: 'format', ext: 'epub', outputSize: '820 KB', speed: '0.12 detik', description: 'Konversi buku digital e-reader EPUB' },
];

// 2. All Image Format Slices (matching Electron formatRouter.ts)
const ALL_IMAGE_FORMAT_SLICES: RadialSliceData[] = [
  { id: 'fmt-png', label: 'PNG', type: 'format', ext: 'png', outputSize: '920 KB', speed: '0.10 detik', description: 'Format lossless dengan transparansi kristal' },
  { id: 'fmt-jpg', label: 'JPG', type: 'format', ext: 'jpg', outputSize: '650 KB', speed: '0.08 detik', description: 'Kompresi foto JPEG standar industri' },
  { id: 'fmt-webp', label: 'WEBP', type: 'format', ext: 'webp', outputSize: '380 KB', speed: '0.07 detik', description: 'Format web modern Google efisiensi tinggi' },
  { id: 'fmt-avif', label: 'AVIF', type: 'format', ext: 'avif', outputSize: '290 KB', speed: '0.15 detik', description: 'Format generasi baru AV1 kompresi superior' },
  { id: 'fmt-tiff', label: 'TIFF', type: 'format', ext: 'tiff', outputSize: '2.6 MB', speed: '0.12 detik', description: 'Master gambar resolusi tinggi untuk percetakan' },
  { id: 'fmt-bmp', label: 'BMP', type: 'format', ext: 'bmp', outputSize: '3.1 MB', speed: '0.06 detik', description: 'Bitmap mentah tanpa kompresi' },
  { id: 'fmt-pdf', label: 'PDF', type: 'format', ext: 'pdf', outputSize: '1.1 MB', speed: '0.09 detik', description: 'Bungkus gambar ke dalam dokumen portabel PDF' },
  { id: 'fmt-docx', label: 'DOCX', type: 'format', ext: 'docx', outputSize: '1.4 MB', speed: '0.13 detik', description: 'Sematkan gambar ke dalam dokumen Microsoft Word' },
];

// 3. Quick Action Tools (8 items matching Electron formatRouter.ts)
export const ALL_QUICK_ACTIONS_SLICES: RadialSliceData[] = [
  { id: 'crop', label: 'CROP', type: 'action', icon: Crop, outputSize: '780 KB', speed: '0.06 detik', description: 'Potong rasio piksel presisi' },
  { id: 'add-bg', label: 'ADD BG', type: 'action', icon: Palette, outputSize: '950 KB', speed: '0.10 detik', description: 'Beri latar belakang kanvas & padding' },
  { id: 'compress', label: 'COMPRESS', type: 'action', icon: Minimize2, outputSize: '320 KB', speed: '0.08 detik', description: 'Kompresi ukuran berkas tanpa merusak kualitas' },
  { id: 'metadata', label: 'METADATA', type: 'action', icon: Tag, outputSize: '1.1 MB', speed: '0.03 detik', description: 'Bersihkan jejak EXIF & metadata tersembunyi' },
  { id: 'redact', label: 'REDACT', type: 'action', icon: EyeOff, outputSize: '1.1 MB', speed: '0.09 detik', description: 'Sensor teks atau area sensitif berkas' },
  { id: 'annotate', label: 'ANNOTATE', type: 'action', icon: PenTool, outputSize: '1.1 MB', speed: '0.05 detik', description: 'Coretan cepat, panah & catatan teks' },
  { id: 'checksum', label: 'CHECKSUM', type: 'action', icon: Hash, outputSize: 'SHA-256', speed: '0.02 detik', description: 'Hitung & salin SHA-256 Checksum integritas berkas' },
  { id: 'encrypt', label: 'ENCRYPT', type: 'action', icon: Lock, outputSize: '.locked', speed: '0.11 detik', description: 'Enkripsi offline AES-256-GCM dengan kata sandi' },
];

interface InteractiveRadialMenuProps {
  selectedFormat: string;
  onSelectSlice: (slice: RadialSliceData) => void;
  inputFileName: string;
  inputFileSize: string;
  onFileSelect?: (file: File) => void;
  onInstall?: (format?: string) => void;
}

export const InteractiveRadialMenu: React.FC<InteractiveRadialMenuProps> = ({
  selectedFormat,
  onSelectSlice,
  inputFileName,
  inputFileSize,
  onInstall,
}) => {
  const [ringMode, setRingMode] = useState<'format' | 'action'>('format');
  const [hoveredSlice, setHoveredSlice] = useState<RadialSliceData | null>(null);

  const fileExt = useMemo(() => {
    const parts = inputFileName.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
  }, [inputFileName]);

  const isPdf = fileExt === 'pdf';

  // Format slices contextual to file category (exact matching Electron formatRouter.ts)
  const formatSlices = useMemo(() => {
    if (isPdf) {
      return PDF_FORMAT_SLICES;
    }
    // For images, filter out the input extension
    const filtered = ALL_IMAGE_FORMAT_SLICES.filter((s) => {
      if (fileExt === 'jpg' || fileExt === 'jpeg') {
        return s.ext !== 'jpg';
      }
      return s.ext !== fileExt;
    });
    return filtered.length >= 6 ? filtered : ALL_IMAGE_FORMAT_SLICES;
  }, [isPdf, fileExt]);

  // Quick actions contextual to category (in Electron: PDF has 4, Image has 8)
  const quickActionSlices = useMemo(() => {
    if (isPdf) {
      return ALL_QUICK_ACTIONS_SLICES.filter((s) =>
        ['compress', 'metadata', 'checksum', 'encrypt'].includes(s.id)
      );
    }
    return ALL_QUICK_ACTIONS_SLICES;
  }, [isPdf]);

  const activeSlices = ringMode === 'format' ? formatSlices : quickActionSlices;

  const toggleRingMode = useCallback(() => {
    setRingMode((prev) => (prev === 'format' ? 'action' : 'format'));
    setHoveredSlice(null);
  }, []);

  // Keyboard shortcut listener for Tab key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleRingMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRingMode]);

  // Center & Radii matching Electron RadialMenu (center: 250, innerRadius: 86, outerRadius: 225)
  const center = 250;
  const outerRadius = 225;
  const innerRadius = 86;
  const total = activeSlices.length;

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Outer Glow Halo matching Electron App */}
      <div className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] flex items-center justify-center">
        
        {/* Ambient Ring Glow (Radioactive Omnitrix Alien Green Glow) */}
        <div
          className="absolute w-[94%] h-[94%] rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.42) 0%, rgba(22, 163, 74, 0.16) 50%, transparent 72%)',
          }}
        />

        {/* Omnitrix Mechanical Bezel & Guide Rings matching Electron RadialMenu */}
        <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Outer Matte Grey Industrial Collar */}
          <circle
            cx={center}
            cy={center}
            r="234"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Omnitrix Vibrant Green Accent Ring */}
          <circle
            cx={center}
            cy={center}
            r="228"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            opacity="0.95"
          />

          {/* 4 Quadrant Mechanical Notches (Omnitrix Bezel Slits at 12, 3, 6, 9 o'clock) */}
          <line x1="250" y1="12" x2="250" y2="26" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <line x1="474" y1="250" x2="488" y2="250" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <line x1="250" y1="474" x2="250" y2="488" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="250" x2="26" y2="250" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />

          {/* Inner Raised Dial Collar (Light Grey & Green Ring) */}
          <circle
            cx={center}
            cy={center}
            r="85"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
          />
          <circle
            cx={center}
            cy={center}
            r="82"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            opacity="0.9"
          />
        </svg>

        {/* SVG Petal Slices Wheel */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full filter drop-shadow-2xl overflow-visible z-10"
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <AnimatePresence mode="wait">
            <motion.g
              key={`${ringMode}-${total}-${fileExt}`}
              initial={{ rotate: -15, opacity: 0, scale: 0.94 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 15, opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ transformOrigin: '250px 250px' }}
            >
              {activeSlices.map((item, index) => {
                // Angular calculation matching Electron: slice 0 starts at 12 o'clock and rotates clockwise
                const sliceAngle = (2 * Math.PI) / total;
                const paddingAngle = Math.min(0.065, 0.45 / total);
                
                const startAngle = index * sliceAngle + paddingAngle / 2 - Math.PI / 2;
                const endAngle = (index + 1) * sliceAngle - paddingAngle / 2 - Math.PI / 2;
                const midAngle = (startAngle + endAngle) / 2;

                const xOutStart = center + outerRadius * Math.cos(startAngle);
                const yOutStart = center + outerRadius * Math.sin(startAngle);
                const xOutEnd = center + outerRadius * Math.cos(endAngle);
                const yOutEnd = center + outerRadius * Math.sin(endAngle);

                const xInStart = center + innerRadius * Math.cos(startAngle);
                const yInStart = center + innerRadius * Math.sin(startAngle);
                const xInEnd = center + innerRadius * Math.cos(endAngle);
                const yInEnd = center + innerRadius * Math.sin(endAngle);

                const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
                const pathData = `
                  M ${xOutStart} ${yOutStart}
                  A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${xOutEnd} ${yOutEnd}
                  L ${xInEnd} ${yInEnd}
                  A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${xInStart} ${yInStart}
                  Z
                `;

                const isHovered = hoveredSlice?.id === item.id;
                const isActive = isHovered;

                const midRadius = (innerRadius + outerRadius) / 2;
                const isTool = item.type === 'action';
                
                // If Quick Action (Ring 2), position icon above label. If Format (Ring 1), center the label!
                const iconYOffset = isTool ? midRadius - 13 : midRadius;
                const labelYOffset = isTool ? midRadius + 14 : midRadius;

                const iconX = center + iconYOffset * Math.cos(midAngle);
                const iconY = center + iconYOffset * Math.sin(midAngle);
                const labelX = center + labelYOffset * Math.cos(midAngle);
                const labelY = center + labelYOffset * Math.sin(midAngle);

                const gradientId = `slice-grad-omnitrix-${item.id}-${index}`;
                const IconComponent = item.icon;

                return (
                  <g
                    key={item.id}
                    className="cursor-pointer select-none"
                    onMouseEnter={() => setHoveredSlice(item)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => {
                      if (selectedFormat === item.label && onInstall) {
                        onInstall(item.label);
                      } else {
                        onSelectSlice(item);
                      }
                    }}
                  >
                    <defs>
                      {/* Omnitrix Matte Charcoal vs Alien Green Hourglass */}
                      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        {isActive ? (
                          <>
                            <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
                            <stop offset="55%" stopColor="#22c55e" stopOpacity="1" />
                            <stop offset="100%" stopColor="#15803d" stopOpacity="1" />
                          </>
                        ) : (
                          <>
                            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.96" />
                            <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.98" />
                          </>
                        )}
                      </linearGradient>

                      <filter id={`glow-${item.id}`} x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation={isActive ? '14' : '4'}
                          floodColor={isActive ? '#22c55e' : 'rgba(0, 0, 0, 0.7)'}
                          floodOpacity={isActive ? 0.9 : 0.5}
                        />
                      </filter>
                    </defs>

                    {/* Outer radioactive ambient glow when active */}
                    {isActive && (
                      <path
                        d={pathData}
                        fill="#22c55e"
                        opacity="0.5"
                        filter="blur(14px)"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Main Petal Slice with Omnitrix mechanical border */}
                    <path
                      d={pathData}
                      fill={`url(#${gradientId})`}
                      stroke={isActive ? '#ffffff' : 'rgba(203, 213, 225, 0.45)'}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={`url(#glow-${item.id})`}
                    />

                    {/* Icon (Only for Ring 2 Quick Actions) */}
                    {isTool && IconComponent && (
                      <g transform={`translate(${iconX - 10}, ${iconY - 10})`} className="pointer-events-none">
                        <IconComponent
                          size={20}
                          color={isActive ? '#000000' : '#94a3b8'}
                          strokeWidth={2.4}
                        />
                      </g>
                    )}

                    {/* Label Text (Bold Black on Active Alien Green, Crisp Silver-White on Inactive Charcoal) */}
                    <text
                      x={labelX}
                      y={isTool ? labelY + 4 : labelY + 5}
                      textAnchor="middle"
                      className="pointer-events-none font-sans font-black uppercase select-none"
                      fill={isActive ? '#000000' : '#f8fafc'}
                      fontSize={isTool ? (total > 6 ? '11px' : '12px') : total > 6 ? '12px' : total > 5 ? '13px' : '15px'}
                      letterSpacing="0.05em"
                      style={{
                        textShadow: isActive
                          ? 'none'
                          : '0 1px 3px rgba(0,0,0,0.9)',
                      }}
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </motion.g>
          </AnimatePresence>
        </svg>

        {/* Central Indicator Circle (Matches Omnitrix Raised Bezel Collar & Metallic Rivet - Clickable to Install) */}
        <div
          className="absolute z-20 flex items-center justify-center select-none"
          style={{
            width: `${innerRadius * 2 - 12}px`,
            height: `${innerRadius * 2 - 12}px`,
          }}
        >
          {/* Radioactive Ambient Halo Glow */}
          <div
            className="absolute inset-0 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(74, 222, 128, 0.55) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 75%)',
            }}
          />

          {/* Main Omnitrix Raised Bezel & Dial Collar (Clickable to Direct Install) */}
          <div
            onClick={() => {
              if (onInstall) {
                onInstall(hoveredSlice ? hoveredSlice.label : selectedFormat);
              }
            }}
            role="button"
            tabIndex={0}
            title={`Klik untuk langsung unduh & install OrbitDrop untuk konversi ke ${hoveredSlice ? hoveredSlice.label : selectedFormat}`}
            className="relative z-10 w-full h-full rounded-full flex flex-col items-center justify-center p-2 text-center transition-all duration-200 cursor-pointer active:scale-95 group hover:border-[#4ade80] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]"
            style={{
              background: 'radial-gradient(circle, #1e293b 0%, #0a0f1d 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '3px solid #cbd5e1',
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(34, 197, 94, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Raised Inner Slit Ring */}
            <div className="absolute inset-1.5 rounded-full border border-slate-500/50 pointer-events-none group-hover:border-[#4ade80]/60 transition-colors" />

            <AnimatePresence mode="wait">
              {/* Normal Dial State: Instant & In-Sync Format Pill with Metallic Silver Rivet */}
              <motion.div
                key="dial-core"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center pointer-events-none"
              >
                <div
                  className={`px-3 py-1 rounded-full flex items-center justify-center gap-1.5 shadow-lg border border-white transition-all duration-150 ${
                    hoveredSlice ? 'scale-105' : 'scale-100'
                  }`}
                  style={{
                    background: 'linear-gradient(to right, #4ade80, #22c55e, #16a34a)',
                    boxShadow: hoveredSlice
                      ? '0 0 18px rgba(34, 197, 94, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                      : '0 0 14px rgba(34, 197, 94, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {/* Metallic Silver Rivet */}
                  <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40 shrink-0" />
                  <span className="font-black text-xs tracking-wide uppercase !text-black font-sans leading-none">
                    {hoveredSlice ? hoveredSlice.label : selectedFormat}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-white group-hover:text-[#4ade80] transition-colors">
                  <Download size={11} className="text-[#4ade80] animate-bounce" />
                  <span className="tracking-tight uppercase">Install</span>
                </div>

                <span className="text-[9px] font-mono font-bold text-[#86efac]/80 tracking-tight mt-0.5 tabular-nums">
                  {hoveredSlice ? hoveredSlice.speed : inputFileSize}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Mode Switcher Pill (Matching Omnitrix Chassis & Green Trims) */}
      <div className="flex items-center justify-center gap-2 mt-4 z-20 select-none">
        <div
          className="flex items-center p-1 rounded-full cursor-pointer transition-all duration-200 shadow-xl backdrop-blur-2xl group border border-[#94a3b8]/60"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75), 0 0 16px rgba(34, 197, 94, 0.25)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRingMode('format');
              setHoveredSlice(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
              ringMode === 'format'
                ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers size={12} strokeWidth={2.4} />
            <span className={ringMode === 'format' ? '!text-black' : ''}>
              Formats ({formatSlices.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRingMode('action');
              setHoveredSlice(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
              ringMode === 'action'
                ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Zap size={12} strokeWidth={2.4} />
            <span className={ringMode === 'action' ? '!text-black' : ''}>
              Quick Actions ({quickActionSlices.length})
            </span>
          </button>

          <div className="px-2.5 py-0.5 text-[10px] font-mono text-slate-400 border-l border-slate-600/60 ml-1 flex items-center gap-1.5">
            <kbd className="bg-slate-900 text-[#4ade80] px-1.5 py-0.5 rounded text-[9px] border border-slate-600 font-mono font-bold shadow-xs">
              Tab
            </kbd>
            <span className="text-[10px] font-medium text-slate-300">ganti</span>
          </div>
        </div>
      </div>
    </div>
  );
};
