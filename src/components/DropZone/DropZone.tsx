import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, FolderOpen, ArrowUpRight } from 'lucide-react';
import { DroppedFileInfo } from '../../types';
import { parseDroppedFile } from '../../utils/fileHelpers';

interface DropZoneProps {
  onFileLoaded: (fileInfo: DroppedFileInfo) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleOpenFilePicker = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.electronAPI?.selectFile) {
      try {
        const fileInfo = await window.electronAPI.selectFile();
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

  const loadPreset = async (name: string, ext: string, sizeBytes: number) => {
    if (window.electronAPI?.loadPresetFile) {
      try {
        const res = await window.electronAPI.loadPresetFile(name);
        if (res && res.path) {
          onFileLoaded(res);
          return;
        }
      } catch (err) {
        console.warn('Electron loadPresetFile failed, falling back to mock:', err);
      }
    }

    const mockFile = new File(['OrbitDrop sample file content'], name, {
      type: ext === '.pdf' ? 'application/pdf' : 'image/jpeg',
    });
    Object.defineProperty(mockFile, 'size', { value: sizeBytes });
    const parsed = parseDroppedFile(mockFile);
    onFileLoaded(parsed);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-4 select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Interactive Precision Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleOpenFilePicker}
        className={`w-full p-8 rounded-3xl border transition-all duration-200 flex flex-col items-center justify-center cursor-pointer backdrop-blur-2xl ${
          isDragOver
            ? 'border-[#22c55e] bg-[#22c55e]/15 scale-[1.01] shadow-2xl shadow-[#22c55e]/40'
            : 'border-[#94a3b8]/40 border-dashed hover:border-[#22c55e] shadow-xl'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(30, 41, 59, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 24px rgba(34, 197, 94, 0.2)',
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-[#22c55e]/60 shadow-sm flex items-center justify-center mb-4 transition-transform duration-200 hover:scale-105">
          <UploadCloud className="w-7 h-7 text-[#22c55e]" strokeWidth={2.2} />
        </div>

        <h3 className="text-base font-black text-white mb-1 tracking-tight">
          Seret &amp; Lepas File ke Sini
        </h3>
        <p className="text-xs text-slate-300 mb-4 text-center max-w-xs leading-relaxed font-medium">
          Menu melingkar akan langsung melayang di atas desktop mengikuti jenis file Anda.
        </p>

        <button
          type="button"
          onClick={handleOpenFilePicker}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] text-xs font-black !text-black flex items-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
        >
          <FolderOpen size={14} className="!text-black" />
          <span className="!text-black">Buka File Picker</span>
        </button>
      </div>

      {/* Quick Test Presets */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mr-1">
          Preset Uji Coba:
        </span>
        <button
          type="button"
          onClick={() => loadPreset('Page_001.pdf', '.pdf', 1153433)}
          className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-950 border border-[#94a3b8]/40 hover:border-[#22c55e] text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <FileText size={13} className="text-[#22c55e]" />
          <span>Page_001.pdf</span>
          <span className="text-[10px] text-slate-400 tabular-nums">1.1 MB</span>
        </button>
        <button
          type="button"
          onClick={() => loadPreset('Photo_Portrait.jpg', '.jpg', 2516582)}
          className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-950 border border-[#94a3b8]/40 hover:border-[#22c55e] text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <ImageIcon size={13} className="text-[#22c55e]" />
          <span>Photo_Portrait.jpg</span>
          <span className="text-[10px] text-slate-400 tabular-nums">2.4 MB</span>
        </button>
      </div>
    </div>
  );
};
