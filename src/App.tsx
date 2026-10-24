import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
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

export const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<DroppedFileInfo | null>({
    name: 'Page 001.pdf',
    path: 'D:\\Documents\\Page 001.pdf',
    size: 1153433,
    formattedSize: '1.1 MB',
    extension: '.pdf',
    category: 'pdf',
  });

  const [activeModal, setActiveModal] = useState<'crop' | 'add-bg' | 'compress' | 'metadata' | 'redact' | 'annotate' | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ConversionResponse | null>(null);

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
        setCurrentFile(parsed);
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
        setTimeout(() => setConversionSuccess(false), 3500);
      } else {
        setConversionError(res.error || 'Konversi format ini belum didukung');
      }
    } catch (err: any) {
      setConversionError(err.message || 'Terjadi kesalahan saat konversi file');
    } finally {
      setIsConverting(false);
    }
  };

  const handleModalSuccess = (res: ConversionResponse) => {
    setConversionSuccess(true);
    setLastResult(res);
    setTimeout(() => setConversionSuccess(false), 4000);
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.hideWindow();
    } else {
      setCurrentFile(null);
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden select-none bg-transparent">
      {/* 100% Transparent Desktop Surface: ONLY Radial Menu floats here */}
      <main className="relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {currentFile ? (
            <RadialMenu
              key="radial-menu"
              fileInfo={currentFile}
              onSelectAction={handleSelectAction}
              onFileLoaded={(info) => setCurrentFile(info)}
              isConverting={isConverting}
              conversionSuccess={conversionSuccess}
              conversionError={conversionError}
              onClose={handleClose}
            />
          ) : (
            <DropZone 
              key="dropzone"
              onFileLoaded={(info) => setCurrentFile(info)} 
            />
          )}
        </AnimatePresence>
      </main>

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
      </AnimatePresence>
    </div>
  );
};
