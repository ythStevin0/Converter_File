import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Orbit, X, Sparkles, FolderCheck, ExternalLink, 
  RefreshCw, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { DroppedFileInfo, RadialSliceItem, ConversionResponse } from './types';
import { RadialMenu } from './components/RadialMenu/RadialMenu';
import { DropZone } from './components/DropZone/DropZone';
import { executeFileConversion } from './services/conversionService';

export const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<DroppedFileInfo | null>({
    name: 'Page 001.pdf',
    path: 'D:\\Documents\\Page 001.pdf',
    size: 1153433,
    formattedSize: '1.1 MB',
    extension: '.pdf',
    category: 'pdf',
  });

  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ConversionResponse | null>(null);

  // Trigger conversion when user drops/clicks a radial slice
  const handleSelectAction = async (slice: RadialSliceItem) => {
    if (!currentFile || isConverting) return;

    setIsConverting(true);
    setConversionSuccess(false);
    setConversionError(null);

    try {
      const res = await executeFileConversion({
        sourceFilePath: currentFile.path,
        targetFormatOrAction: slice.label,
        sourceCategory: currentFile.category,
        file: currentFile.file,
      });

      if (res.success) {
        setConversionSuccess(true);
        setLastResult(res);
        setTimeout(() => setConversionSuccess(false), 3500);
      } else {
        setConversionError(res.error || 'Conversion failed');
      }
    } catch (err: any) {
      setConversionError(err.message || 'An error occurred during conversion');
    } finally {
      setIsConverting(false);
    }
  };

  const handleOpenFolder = () => {
    if (lastResult?.outputPath && window.electronAPI) {
      window.electronAPI.openInFolder(lastResult.outputPath);
    }
  };

  const handleCloseWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.hideWindow();
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between p-4 overflow-hidden select-none bg-slate-950/80 backdrop-blur-2xl text-slate-100 rounded-3xl border border-slate-800/80 shadow-2xl">
      {/* Top Bar / Drag Region */}
      <header className="w-full flex items-center justify-between px-3 py-1.5 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Orbit className="w-4 h-4 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              OrbitDrop <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-medium ml-1">Tahap 1</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentFile && (
            <button
              type="button"
              onClick={() => setCurrentFile(null)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Ganti atau Lepas File Baru"
            >
              <RefreshCw size={11} />
              <span>Ganti File</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCloseWindow}
            className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors border border-slate-700/50"
            title="Tutup / Sembunyikan"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 w-full flex items-center justify-center z-20">
        <AnimatePresence mode="wait">
          {currentFile ? (
            <motion.div
              key="radial-menu-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center"
            >
              {/* The SVG Contextual Radial Menu */}
              <RadialMenu
                fileInfo={currentFile}
                onSelectAction={handleSelectAction}
                isConverting={isConverting}
                conversionSuccess={conversionSuccess}
                conversionError={conversionError}
                onClose={() => setCurrentFile(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dropzone-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex items-center justify-center"
            >
              <DropZone onFileLoaded={(info) => setCurrentFile(info)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Notification / Toast Bar */}
      <footer className="w-full flex items-center justify-between px-3 py-2 z-30">
        <div className="flex items-center gap-2">
          {lastResult?.success ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs shadow-lg animate-fade-in">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>
                Berhasil: <strong>{lastResult.outputName}</strong>
              </span>
              {lastResult.outputPath && (
                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className="ml-2 underline text-[11px] font-semibold text-emerald-200 hover:text-white flex items-center gap-1"
                >
                  <FolderCheck size={12} />
                  <span>Lihat di Folder</span>
                </button>
              )}
            </div>
          ) : conversionError ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              <AlertTriangle size={14} />
              <span>{conversionError}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
              <Layers size={13} className="text-slate-500" />
              <span>Arahkan kursor ke juring untuk melihat aksi &bull; Tekan <strong>Tab</strong> untuk tukar ring</span>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Local Engine: <span className="text-emerald-400">Ready</span> (Rp 0)
        </div>
      </footer>
    </div>
  );
};
