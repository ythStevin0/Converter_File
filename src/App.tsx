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
import { calculateSHA256Hash, calculateIpfsCid } from './utils/cryptoHelpers';

const DEFAULT_SAMPLE_FILE: DroppedFileInfo = {
  name: 'Page_001.pdf',
  path: 'Page_001.pdf',
  size: 1153433,
  formattedSize: '1.1 MB',
  extension: '.pdf',
  category: 'pdf',
};

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

  
  // Keyboard listener: Escape to return to DropZone when no modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !activeModal && currentFile) {
        setCurrentFile(null);
        setConversionSuccess(false);
        setConversionError(null);
        setLastResult(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, currentFile]);

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
    if (slice.id === 'ipfs') {
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
        const { cid, gatewayUrl } = await calculateIpfsCid(arrayBuffer);
        navigator.clipboard.writeText(cid);
        setConversionSuccess(true);
        setLastResult({
          success: true,
          outputName: `IPFS CID Disalin! (${cid.slice(0, 9)}...${cid.slice(-6)})`,
          outputPath: gatewayUrl,
        });
        setTimeout(() => setConversionSuccess(false), 5000);
      } catch (err: any) {
        setConversionError(err.message || 'Gagal menghitung IPFS CID');
      } finally {
        setIsConverting(false);
      }
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
    <div className="relative w-screen h-screen flex flex-col items-center justify-center p-2 overflow-hidden select-none bg-transparent">
      {/* 1. Floating Top Brand matching User Photo */}
      <div className="flex items-center justify-center gap-2.5 mb-2 select-none titlebar-drag-region cursor-grab active:cursor-grabbing">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00e575] shadow-[0_0_10px_#00e575] animate-pulse" />
        <span className="font-extrabold text-sm tracking-wider uppercase text-white font-sans">ORBITDROP</span>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-500/40 font-medium tracking-wide">
          Local Engine
        </span>
        {currentFile && (
          <button
            type="button"
            onClick={() => {
              setCurrentFile(null);
              setConversionSuccess(false);
              setConversionError(null);
              setLastResult(null);
            }}
            className="titlebar-no-drag text-[10px] px-2.5 py-0.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white/80 hover:text-white transition-all flex items-center gap-1 border border-white/10 hover:border-[#00e575] cursor-pointer shadow-sm active:scale-95 ml-1"
            title="Ganti Berkas / Kembali ke Mode Drop Lingkaran (Esc)"
          >
            <RotateCcw className="w-3 h-3 text-[#00e575]" />
            <span>Ganti File</span>
          </button>
        )}
      </div>

      {/* 2. Central Workspace (RadialMenu) */}
      <main className="relative flex flex-col items-center justify-center">
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
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-emerald-500/60 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 animate-in fade-in select-none">
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

      {/* 3. Floating Bottom Status matching exact User Photo */}
      <footer className="flex items-center justify-center gap-4 mt-3 select-none text-xs">
        <div className="flex items-center gap-2 text-white/90">
          <span className="w-2 h-2 rounded-full bg-[#00e575] shadow-[0_0_6px_#00e575]" />
          <span>100% Offline &amp; Privat</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-white/70 shadow-md">
          <span>Shortcut:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-[10px] border border-white/20 font-semibold shadow-xs">
            Alt+Space
          </kbd>
        </div>
      </footer>

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
