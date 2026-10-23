import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Sparkles, FolderOpen } from 'lucide-react';
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

  // Mock presets to quickly test the PRD workflow
  const loadPreset = (name: string, ext: string, sizeBytes: number) => {
    const mockFile = new File(['mock content'], name, {
      type: ext === '.pdf' ? 'application/pdf' : 'image/jpeg',
    });
    // Override size
    Object.defineProperty(mockFile, 'size', { value: sizeBytes });
    const parsed = parseDroppedFile(mockFile);
    onFileLoaded(parsed);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto p-4">
      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Interactive Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-8 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer backdrop-blur-xl ${
          isDragOver
            ? 'border-blue-400 bg-blue-500/15 scale-[1.02] shadow-2xl shadow-blue-500/20'
            : 'border-slate-700/80 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-900/80 shadow-xl'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center mb-4 text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8 text-blue-400" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
          Seret & Lepas File ke Sini
        </h3>
        <p className="text-xs text-slate-400 mb-4 text-center max-w-sm">
          Radial Menu otomatis muncul menyesuaikan jenis file (PDF, Gambar, Office, Audio, Video).
        </p>

        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-600/60 flex items-center gap-2 transition-colors"
        >
          <FolderOpen size={14} className="text-blue-400" />
          <span>Pilih File dari Komputer</span>
        </button>
      </div>

      {/* Instant Demo Presets for quick evaluation */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" /> Uji Coba Cepat:
        </span>
        <button
          type="button"
          onClick={() => loadPreset('Page 001.pdf', '.pdf', 1153433)} // 1.1 MB
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 transition-all hover:border-red-500/50"
        >
          <FileText size={12} className="text-red-400" />
          <span>Page 001.pdf (1.1 MB)</span>
        </button>
        <button
          type="button"
          onClick={() => loadPreset('Photo_Portrait.jpg', '.jpg', 2516582)} // 2.4 MB
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 transition-all hover:border-emerald-500/50"
        >
          <ImageIcon size={12} className="text-emerald-400" />
          <span>Photo_Portrait.jpg (2.4 MB)</span>
        </button>
      </div>
    </div>
  );
};
