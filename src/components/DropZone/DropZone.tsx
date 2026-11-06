import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LucideIcon,
  UploadCloud, FileText, Image as ImageIcon, FolderOpen, 
  FileCode, Film, Music, Table
} from 'lucide-react';
import { DroppedFileInfo } from '../../types';
import { parseDroppedFile } from '../../utils/fileHelpers';

interface DropZoneProps {
  onFileLoaded: (fileInfo: DroppedFileInfo) => void;
}

interface FormatBadgeItem {
  label: string;
  ext: string;
  icon: LucideIcon;
  color: string;
  desc: string;
}

const SUPPORTED_FORMAT_BADGES: FormatBadgeItem[] = [
  { label: 'PDF', ext: 'pdf', icon: FileText, color: '#38bdf8', desc: 'Pilih Dokumen PDF' },
  { label: 'DOCX', ext: 'docx', icon: FileCode, color: '#60a5fa', desc: 'Pilih Dokumen Word DOCX' },
  { label: 'XLSX', ext: 'xlsx', icon: Table, color: '#34d399', desc: 'Pilih Spreadsheet Excel / CSV' },
  { label: 'MP4', ext: 'mp4', icon: Film, color: '#f472b6', desc: 'Pilih Berkas Video MP4' },
  { label: 'MP3', ext: 'mp3', icon: Music, color: '#fb923c', desc: 'Pilih Berkas Audio MP3' },
  { label: 'JPG', ext: 'jpg', icon: ImageIcon, color: '#fbbf24', desc: 'Pilih Berkas Gambar JPG' },
  { label: 'PNG', ext: 'png', icon: ImageIcon, color: '#a78bfa', desc: 'Pilih Berkas Gambar PNG' },
  { label: 'EPUB', ext: 'epub', icon: FileText, color: '#4ade80', desc: 'Pilih E-Book EPUB' },
];

export const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredFormat, setHoveredFormat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBadge = SUPPORTED_FORMAT_BADGES.find(b => b.label === hoveredFormat);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const parsed = parseDroppedFile(file);
      onFileLoaded(parsed);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const parsed = parseDroppedFile(file);
      onFileLoaded(parsed);
    }
  };

  const handleOpenFilePicker = async (e?: React.MouseEvent, targetExt?: string) => {
    e?.stopPropagation();
    if (window.electronAPI?.selectFile) {
      try {
        const fileInfo = await window.electronAPI.selectFile(targetExt);
        if (fileInfo) {
          onFileLoaded(fileInfo);
          return;
        }
      } catch (err) {
        console.warn('Native selectFile failed, falling back to html input:', err);
      }
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Circular HUD Drop Container matching RadialMenu 500x500 dimensions */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => handleOpenFilePicker(e)}
        className={`relative w-[500px] h-[500px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragOver ? 'scale-102' : 'hover:scale-[1.01]'
        }`}
      >
        {/* Ambient Ring Glow (Radioactive Omnitrix Alien Green Glow) */}
        <div 
          className="absolute w-[470px] h-[470px] rounded-full blur-3xl pointer-events-none transition-all duration-500"
          style={{
            background: isDragOver
              ? 'radial-gradient(circle, rgba(34, 197, 94, 0.65) 0%, rgba(22, 163, 74, 0.3) 50%, transparent 72%)'
              : activeBadge
              ? `radial-gradient(circle, ${activeBadge.color}55 0%, rgba(22, 163, 74, 0.2) 50%, transparent 72%)`
              : 'radial-gradient(circle, rgba(34, 197, 94, 0.38) 0%, rgba(22, 163, 74, 0.14) 50%, transparent 72%)',
            opacity: isDragOver || activeBadge ? 0.95 : 0.6,
          }}
        />

        {/* Omnitrix Mechanical Bezel & Guide Rings (Identical to RadialMenu) */}
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
            stroke={isDragOver ? '#4ade80' : activeBadge ? activeBadge.color : '#94a3b8'}
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-colors duration-200"
          />

          {/* Omnitrix Vibrant Green Accent Ring */}
          <circle
            cx="250"
            cy="250"
            r="228"
            fill="none"
            stroke={activeBadge ? activeBadge.color : '#22c55e'}
            strokeWidth={isDragOver || activeBadge ? '3' : '2'}
            opacity={isDragOver || activeBadge ? '1' : '0.95'}
            className="transition-all duration-200"
          />

          {/* 4 Quadrant Mechanical Notches (Omnitrix Bezel Slits at 12, 3, 6, 9 o'clock) */}
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
            stroke={isDragOver ? '#22c55e' : activeBadge ? activeBadge.color : '#475569'}
            strokeWidth="1.2"
            strokeDasharray="5 7"
            opacity={isDragOver || activeBadge ? '0.85' : '0.45'}
            className="transition-all duration-300"
          />

          {/* Subtle 8 Radial Spoke Guide Lines */}
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
                stroke={isDragOver ? 'rgba(34, 197, 94, 0.4)' : 'rgba(148, 163, 184, 0.15)'}
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
            stroke={activeBadge ? activeBadge.color : '#22c55e'}
            strokeWidth="1.5"
            opacity="0.9"
            className="transition-colors duration-200"
          />
        </svg>

        {/* Orbiting Supported Formats Badges (Interactive with Rich Hover Effects) */}
        <div className="absolute inset-0 pointer-events-none">
          {SUPPORTED_FORMAT_BADGES.map((badge, idx) => {
            const total = SUPPORTED_FORMAT_BADGES.length;
            const angle = (idx * (360 / total) - 90) * (Math.PI / 180);
            const radius = 160;
            const x = 250 + radius * Math.cos(angle);
            const y = 250 + radius * Math.sin(angle);
            const Icon = badge.icon;
            const isHovered = hoveredFormat === badge.label;

            return (
              <button
                key={badge.label}
                type="button"
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoveredFormat(badge.label);
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  setHoveredFormat(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenFilePicker(e, badge.ext);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer pointer-events-auto select-none ${
                  isHovered
                    ? 'scale-120 z-30'
                    : 'scale-100 hover:scale-110 z-20'
                }`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  background: isHovered
                    ? 'rgba(15, 23, 42, 0.98)'
                    : isDragOver
                    ? 'rgba(15, 23, 42, 0.95)'
                    : 'rgba(15, 23, 42, 0.85)',
                  borderColor: isHovered
                    ? badge.color
                    : isDragOver
                    ? 'rgba(34, 197, 94, 0.5)'
                    : 'rgba(148, 163, 184, 0.35)',
                  boxShadow: isHovered
                    ? `0 0 20px ${badge.color}aa, 0 6px 16px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.5)`
                    : '0 4px 12px rgba(0, 0, 0, 0.6)',
                }}
                title={`Klik untuk memilih berkas ${badge.label} dari File Explorer`}
              >
                <Icon 
                  size={13} 
                  style={{ 
                    color: badge.color,
                    filter: isHovered ? `drop-shadow(0 0 6px ${badge.color})` : 'none',
                  }} 
                />
                <span 
                  className="text-[11px] font-black tracking-wider transition-colors duration-200 font-sans"
                  style={{
                    color: isHovered ? '#ffffff' : '#e2e8f0',
                    textShadow: isHovered ? `0 0 8px ${badge.color}` : 'none',
                  }}
                >
                  {badge.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center Circle / Omnitrix Raised Bezel (Matching Radial CenterCircle) */}
        <div 
          className="relative z-10 w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center p-3 text-center transition-all duration-200"
          style={{
            background: 'radial-gradient(circle, #1e293b 0%, #0a0f1d 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: `3px solid ${activeBadge ? activeBadge.color : '#cbd5e1'}`,
            boxShadow: isDragOver
              ? '0 12px 32px rgba(0, 0, 0, 0.9), 0 0 28px rgba(34, 197, 94, 0.7), inset 0 2px 3px rgba(255, 255, 255, 0.4)'
              : activeBadge
              ? `0 12px 32px rgba(0, 0, 0, 0.9), 0 0 24px ${activeBadge.color}80, inset 0 2px 3px rgba(255, 255, 255, 0.4)`
              : '0 10px 28px rgba(0, 0, 0, 0.85), 0 0 20px rgba(34, 197, 94, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Raised Inner Slit Ring */}
          <div className="absolute inset-1.5 rounded-full border border-slate-500/50 pointer-events-none" />

          {/* Animated Dynamic Icon (Reacts to Hovered Format or UploadCloud) */}
          <motion.div
            key={hoveredFormat || 'default-icon'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: isDragOver ? [-3, 3, -3] : [0, -2, 0] }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ repeat: isDragOver ? Infinity : 0, duration: 0.8, ease: 'easeInOut' }}
            className="mb-1"
          >
            {activeBadge ? (
              <activeBadge.icon 
                size={24} 
                style={{ 
                  color: activeBadge.color,
                  filter: `drop-shadow(0 0 8px ${activeBadge.color})` 
                }} 
                strokeWidth={2.4} 
              />
            ) : (
              <UploadCloud 
                className={`w-6 h-6 transition-colors duration-200 ${
                  isDragOver ? 'text-[#4ade80]' : 'text-[#22c55e]'
                }`} 
                strokeWidth={2.4} 
              />
            )}
          </motion.div>

          {/* Omnitrix Core Pill Button (Reacts to Hovered Format) */}
          <div 
            className="px-3.5 py-1 rounded-full flex items-center justify-center gap-1.5 shadow-lg border border-white transition-all duration-150"
            style={{
              background: activeBadge
                ? `linear-gradient(to right, ${activeBadge.color}, #22c55e)`
                : 'linear-gradient(to right, #4ade80, #22c55e, #16a34a)',
              boxShadow: isDragOver
                ? '0 0 18px rgba(34, 197, 94, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                : activeBadge
                ? `0 0 16px ${activeBadge.color}cc, inset 0 1px 1px rgba(255, 255, 255, 0.9)`
                : '0 0 14px rgba(34, 197, 94, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40 shrink-0" />
            <span className="font-black text-xs tracking-wide uppercase !text-black font-sans leading-none">
              {isDragOver ? 'LEPAS BERKAS' : activeBadge ? `PILIH ${activeBadge.label}` : 'TARUH FILE'}
            </span>
          </div>

          {/* Subtext info */}
          <span 
            className="text-[9px] font-mono font-bold tracking-tight mt-1.5 tabular-nums transition-colors duration-150 truncate max-w-[140px]"
            style={{ color: activeBadge ? activeBadge.color : '#86efac' }}
          >
            {isDragOver ? 'Lepas untuk proses' : activeBadge ? activeBadge.desc : 'Klik / Seret File (Tahan CTRL)'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
