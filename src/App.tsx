import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Minus, Layers, RotateCcw, FolderOpen, CheckCircle2 } from 'lucide-react';
import { DroppedFileInfo, RadialSliceItem, ConversionResponse } from './types';
import { RadialMenu } from './components/RadialMenu/RadialMenu';
import { DropZone } from './components/DropZone/DropZone';
import { executeFileConversion } from './services/conversionService';
import { parseDroppedFile } from './utils/fileHelpers';
import { CropModal } from './components/Modals/CropModal';
import { AddBgModal } from './components/Modals/AddBgModal';
import { CompressModal } from './components/Modals/CompressModal';
import { MetadataModal } from './components/Modals/MetadataModal';
import { RedactModal } from './components/Modals/RedactModal';
import { AnnotateModal } from './components/Modals/AnnotateModal';
import { EncryptModal } from './components/Modals/EncryptModal';
import { UnlockModal } from './components/Modals/UnlockModal';
import { calculateSHA256Hash } from './utils/cryptoHelpers';

export const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<DroppedFileInfo | null>(null);
  const [isTransparentHud, setIsTransparentHud] = useState(false);

  const [activeModal, setActiveModal] = useState<'crop' | 'add-bg' | 'compress' | 'metadata' | 'redact' | 'annotate' | 'encrypt' | 'unlock' | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ConversionResponse | null>(null);

  const handleFileLoaded = (info: DroppedFileInfo) => {
    setCurrentFile(info);
    if (info.name.toLowerCase().endsWith('.locked') || info.extension.toLowerCase() === '.locked') {
      setActiveModal('unlock');
    }
  };

  // Global Drag & Drop listener to enable smooth file drag and prevent OS prohibited ⃠ cursor
  useEffect(() => {
    const handleGlobalDrag = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const parsed = parseDroppedFile(file);
        handleFileLoaded(parsed);
      }
    };

    window.addEventListener('dragenter', handleGlobalDrag);
    window.addEventListener('dragover', handleGlobalDrag);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragenter', handleGlobalDrag);
      window.removeEventListener('dragover', handleGlobalDrag);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Listen to drag and drop from Electron IPC or desktop
  useEffect(() => {
    if (window.electronAPI?.onFileDropTrigger) {
      window.electronAPI.onFileDropTrigger((fileInfo: any) => {
        if (fileInfo) {
          setCurrentFile(fileInfo);
          setConversionSuccess(false);
          setConversionError(null);
        }
      });
    }
  }, []);

  // Trigger conversion or open modal when user drops/clicks a radial slice
  const handleSelectAction = async (slice: RadialSliceItem, droppedFile?: File) => {
    const targetFile = droppedFile ? parseDroppedFile(droppedFile) : currentFile;
    if (!targetFile || isConverting) return;

    if (droppedFile) {
      setCurrentFile(targetFile);
    }

    // 1. Intercept Quick Action Modals
    if (slice.id === 'crop') {
      setActiveModal('crop');
      return;
    }
    if (slice.id === 'add-bg') {
      setActiveModal('add-bg');
      return;
    }
    if (slice.id === 'compress') {
      setActiveModal('compress');
      return;
    }
    if (slice.id === 'metadata') {
      setActiveModal('metadata');
      return;
    }
    if (slice.id === 'redact') {
      setActiveModal('redact');
      return;
    }
    if (slice.id === 'annotate') {
      setActiveModal('annotate');
      return;
    }
    if (slice.id === 'encrypt') {
      setActiveModal('encrypt');
      return;
    }
    if (slice.id === 'checksum' || slice.id === 'stamp') {
      setIsConverting(true);
      try {
        let arrayBuffer: ArrayBuffer;
        if (targetFile.file) {
          arrayBuffer = await targetFile.file.arrayBuffer();
        } else if (window.electronAPI && typeof window.electronAPI.readFileBase64 === 'function') {
          const res = await window.electronAPI.readFileBase64(targetFile.path);
          if (!res.success || !res.dataUrl) throw new Error('Gagal membaca berkas');
          const base64 = res.dataUrl.replace(/^data:.*?;base64,/, '');
          const binaryStr = atob(base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          arrayBuffer = bytes.buffer;
        } else {
          throw new Error('Berkas tidak dapat diakses.');
        }
        const hash = await calculateSHA256Hash(arrayBuffer);
        navigator.clipboard.writeText(hash);
        setConversionSuccess(true);
        setLastResult({
          success: true,
          outputName: `SHA-256 disalin! (${hash.slice(0, 8)}...${hash.slice(-6)})`,
        });
        setTimeout(() => setConversionSuccess(false), 4500);
      } catch (err: any) {
        setConversionError(err.message || 'Gagal menghitung checksum SHA-256');
      } finally {
        setIsConverting(false);
      }
      return;
    }

    // 2. Format conversions
    setIsConverting(true);
    setConversionSuccess(false);
    setConversionError(null);

    try {
      const res = await executeFileConversion({
        sourceFilePath: targetFile.path,
        targetFormatOrAction: slice.label,
        sourceCategory: targetFile.category,
        file: targetFile.file,
      });

      if (res.success) {
        setConversionSuccess(true);
        setLastResult(res);
        if (res.outputPath && window.electronAPI?.openInFolder) {
          window.electronAPI.openInFolder(res.outputPath);
        }
        setTimeout(() => setConversionSuccess(false), 3500);
      } else {
        setConversionError(res.error || 'Konversi format ini belum didukung');
        setTimeout(() => setConversionError(null), 4000);
      }
    } catch (err: any) {
      setConversionError(err.message || 'Terjadi kesalahan saat konversi file');
      setTimeout(() => setConversionError(null), 4000);
    } finally {
      setIsConverting(false);
    }
  };

  const handleModalSuccess = (res: ConversionResponse) => {
    setConversionSuccess(true);
    setLastResult(res);
    if (res.outputPath && window.electronAPI?.openInFolder) {
      window.electronAPI.openInFolder(res.outputPath);
    }
    setTimeout(() => setConversionSuccess(false), 4000);
  };

  const handleMinimize = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    } else if (window.electronAPI?.hideWindow) {
      window.electronAPI.hideWindow();
    } else {
      setCurrentFile(null);
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center p-2.5 overflow-hidden select-none bg-transparent">
      {/* Sleek Floating Card or Transparent HUD */}
      <div 
        className={`relative w-[620px] h-[670px] rounded-[24px] flex flex-col transition-all duration-300 overflow-hidden ${
          isTransparentHud
            ? 'bg-transparent border border-white/5'
            : 'bg-[#0b0d14]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Title Bar & Controls */}
        <header 
          className={`h-11 px-4 flex items-center justify-between border-b select-none shrink-0 transition-colors ${
            isTransparentHud 
              ? 'bg-black/40 border-white/5 rounded-t-[24px]' 
              : 'bg-[#0f111a]/90 border-white/5'
          }`}
        >
          {/* Logo & Engine Status (Draggable Window Area) */}
          <div className="flex items-center gap-2 flex-1 h-full cursor-grab active:cursor-grabbing titlebar-drag-region">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="font-semibold text-xs tracking-wider uppercase text-white/90">OrbitDrop</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Local Engine
            </span>
          </div>

          {/* Window Actions (Strictly Non-Draggable & Clickable) */}
          <div className="flex items-center gap-1.5 titlebar-no-drag z-30">
            {currentFile && (
              <button
                type="button"
                onClick={() => setCurrentFile(null)}
                className="titlebar-no-drag text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center gap-1 border border-white/5 mr-1 cursor-pointer"
                title="Ganti File / Kembali ke Drop Zone"
              >
                <RotateCcw className="w-3 h-3 text-emerald-400" />
                <span>Ganti File</span>
              </button>
            )}

            {/* Mode Toggle: Solid Card vs HUD Transparan */}
            <button
              type="button"
              onClick={() => setIsTransparentHud(!isTransparentHud)}
              className={`titlebar-no-drag p-1.5 rounded-md border transition-all cursor-pointer ${
                isTransparentHud 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title={isTransparentHud ? 'Mode Transparan HUD Aktif (Klik untuk Mode Jendela)' : 'Beralih ke Mode Transparan HUD'}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Minimize */}
            <button
              type="button"
              onClick={handleMinimize}
              className="titlebar-no-drag p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer active:scale-95"
              title="Minimize"
              aria-label="Minimize Window"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Close / Hide to Tray */}
            <button
              type="button"
              onClick={handleClose}
              className="titlebar-no-drag p-1.5 rounded-md bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 transition-all cursor-pointer active:scale-95"
              title="Tutup Jendela (Alt+Space untuk Buka Kembali)"
              aria-label="Close Window"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Central Workspace Area */}
        <main className="relative flex-1 flex items-center justify-center p-2 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentFile ? (
              <RadialMenu
                key="radial-menu"
                fileInfo={currentFile}
                onSelectAction={handleSelectAction}
                onFileLoaded={handleFileLoaded}
                isConverting={isConverting}
                conversionSuccess={conversionSuccess}
                conversionError={conversionError}
                lastResult={lastResult}
                onOpenFolder={(path) => {
                  if (window.electronAPI?.openInFolder) window.electronAPI.openInFolder(path);
                }}
                onClearError={() => setConversionError(null)}
                onClose={handleClose}
                isModalOpen={activeModal !== null}
              />
            ) : (
              <DropZone 
                key="dropzone"
                onFileLoaded={handleFileLoaded} 
              />
            )}
          </AnimatePresence>

          {/* Floating Quick Action: Open Converted File in File Explorer */}
          {conversionSuccess && lastResult?.outputPath && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-emerald-500/60 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 animate-in fade-in select-none">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold text-white truncate max-w-[150px]">
                {lastResult.outputName}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (lastResult.outputPath && window.electronAPI?.openInFolder) {
                    window.electronAPI.openInFolder(lastResult.outputPath);
                  }
                }}
                className="px-2.5 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-400 !text-black text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <FolderOpen size={11} className="text-black" />
                <span className="!text-black">Buka di File Explorer</span>
              </button>
            </div>
          )}
        </main>

        {/* Footer / Status Hint */}
        <footer 
          className={`h-7 px-4 flex items-center justify-between border-t text-[11px] select-none shrink-0 transition-colors ${
            isTransparentHud 
              ? 'bg-black/40 border-white/5 text-white/40 rounded-b-[24px]' 
              : 'bg-[#0f111a]/90 border-white/5 text-white/40'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            <span>100% Offline & Privat • File diproses lokal</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px] border border-white/10">Alt+Space</kbd>
          </div>
        </footer>
      </div>

      {/* Floating Modals */}
      <AnimatePresence>
        {activeModal === 'crop' && currentFile && (
          <CropModal
            fileInfo={currentFile}
            onClose={() => setActiveModal(null)}
            onSuccess={handleModalSuccess}
          />
        )}
        {activeModal === 'add-bg' && currentFile && (
          <AddBgModal
            fileInfo={currentFile}
            onClose={() => setActiveModal(null)}
            onSuccess={handleModalSuccess}
          />
        )}
        {activeModal === 'compress' && currentFile && (
          <CompressModal
            fileInfo={currentFile}
            onClose={() => setActiveModal(null)}
            onSuccess={handleModalSuccess}
          />
        )}
        {activeModal === 'metadata' && currentFile && (
          <MetadataModal
            fileInfo={currentFile}
            onClose={() => setActiveModal(null)}
            onSuccess={handleModalSuccess}
          />
        )}
        {activeModal === 'redact' && currentFile && (
          <RedactModal
            fileInfo={currentFile}
            onClose={() => setActiveModal(null)}
            onSuccess={handleModalSuccess}
          />
        )}
        {activeModal === 'annotate' && currentFile && (
          <AnnotateModal
            fileInfo={currentFile}
            onClose={() => setActiveModal(null)}
            onSuccess={handleModalSuccess}
          />
        )}
        {activeModal === 'encrypt' && currentFile && (
          <EncryptModal
            fileInfo={currentFile}
            onClose={() => setActiveModal(null)}
            onSuccess={handleModalSuccess}
          />
        )}
        {activeModal === 'unlock' && currentFile && (
          <UnlockModal
            fileInfo={currentFile}
            onClose={() => {
              setActiveModal(null);
              setCurrentFile(null);
            }}
            onSuccess={handleModalSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
