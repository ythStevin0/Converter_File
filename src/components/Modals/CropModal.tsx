import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Crop as CropIcon, RotateCcw, Check, Move, Maximize2, AlertCircle } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';
import { useFilePreview, saveEditedImage } from '../../utils/fileHelpers';

interface CropModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

type AspectRatioPreset = 'Free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const CropModal: React.FC<CropModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const imageSrc = useFilePreview(fileInfo);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('Free');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialRect, setInitialRect] = useState(cropRect);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // When image loads, initialize crop rectangle to 80% of centered image
  const handleImageLoaded = () => {
    if (!imageRef.current) return;
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imageRef.current;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });

    const initialW = clientWidth * 0.8;
    const initialH = clientHeight * 0.8;
    const initialX = (clientWidth - initialW) / 2;
    const initialY = (clientHeight - initialH) / 2;

    setCropRect({
      x: initialX,
      y: initialY,
      width: initialW,
      height: initialH,
    });
  };

  // Adjust aspect ratio preset
  const handlePresetChange = (preset: AspectRatioPreset) => {
    setAspectRatio(preset);
    if (!imageRef.current) return;
    const { clientWidth, clientHeight } = imageRef.current;

    let targetRatio: number | null = null;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === '16:9') targetRatio = 16 / 9;
    else if (preset === '9:16') targetRatio = 9 / 16;
    else if (preset === '4:3') targetRatio = 4 / 3;
    else if (preset === '3:4') targetRatio = 3 / 4;

    if (targetRatio !== null) {
      let newW = cropRect.width;
      let newH = newW / targetRatio;
      if (newH > clientHeight * 0.9) {
        newH = clientHeight * 0.9;
        newW = newH * targetRatio;
      }
      const newX = Math.max(0, Math.min(clientWidth - newW, (clientWidth - newW) / 2));
      const newY = Math.max(0, Math.min(clientHeight - newH, (clientHeight - newH) / 2));
      setCropRect({ x: newX, y: newY, width: newW, height: newH });
    }
  };

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialRect({ ...cropRect });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragMode || !imageRef.current) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const { clientWidth, clientHeight } = imageRef.current;

    let next = { ...initialRect };

    if (dragMode === 'move') {
      next.x = Math.max(0, Math.min(clientWidth - next.width, initialRect.x + dx));
      next.y = Math.max(0, Math.min(clientHeight - next.height, initialRect.y + dy));
    } else if (dragMode === 'se') {
      next.width = Math.max(40, Math.min(clientWidth - initialRect.x, initialRect.width + dx));
      next.height = Math.max(40, Math.min(clientHeight - initialRect.y, initialRect.height + dy));
    } else if (dragMode === 'sw') {
      const newW = Math.max(40, initialRect.width - dx);
      const newX = initialRect.x + (initialRect.width - newW);
      if (newX >= 0) {
        next.x = newX;
        next.width = newW;
      }
      next.height = Math.max(40, Math.min(clientHeight - initialRect.y, initialRect.height + dy));
    } else if (dragMode === 'ne') {
      next.width = Math.max(40, Math.min(clientWidth - initialRect.x, initialRect.width + dx));
      const newH = Math.max(40, initialRect.height - dy);
      const newY = initialRect.y + (initialRect.height - newH);
      if (newY >= 0) {
        next.y = newY;
        next.height = newH;
      }
    }

    setCropRect(next);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  // Calculate actual pixel dimensions
  const scale = imageRef.current ? naturalSize.width / imageRef.current.clientWidth : 1;
  const pixelW = Math.round(cropRect.width * scale) || naturalSize.width;
  const pixelH = Math.round(cropRect.height * scale) || naturalSize.height;

  // Manual pixel change
  const handlePixelWChange = (val: number) => {
    if (!imageRef.current || scale === 0) return;
    const nextClientW = Math.min(imageRef.current.clientWidth - cropRect.x, Math.max(40, val / scale));
    setCropRect((prev) => ({ ...prev, width: nextClientW }));
  };

  const handlePixelHChange = (val: number) => {
    if (!imageRef.current || scale === 0) return;
    const nextClientH = Math.min(imageRef.current.clientHeight - cropRect.y, Math.max(40, val / scale));
    setCropRect((prev) => ({ ...prev, height: nextClientH }));
  };

  // Reset
  const handleReset = () => {
    setAspectRatio('Free');
    handleImageLoaded();
  };

  // Apply Crop
  const handleApplyCrop = async () => {
    if (!imageRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const cropX = cropRect.x * scale;
      const cropY = cropRect.y * scale;
      const cropW = cropRect.width * scale;
      const cropH = cropRect.height * scale;

      canvas.width = Math.max(1, Math.round(cropW));
      canvas.height = Math.max(1, Math.round(cropH));

      const img = imageRef.current;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

      const base64Data = canvas.toDataURL('image/png');
      const ext = fileInfo.extension.replace(/^\./, '') || 'png';

      await saveEditedImage({
        fileInfo,
        dataUrl: base64Data,
        suffix: 'Cropped',
        ext,
        message: 'Image cropped successfully',
        onSuccess,
        onClose,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memotong gambar');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="relative w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden flex flex-col p-5"
        style={{
          background: 'radial-gradient(135deg, #1e293b 0%, #0a0f1d 100%)',
          border: '2px solid #94a3b8',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(34, 197, 94, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Top Header (Close button on Left, Centered Title with Silver Rivet) */}
        <div className="relative flex items-center justify-center mb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal crop"
            className="absolute left-0 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 flex items-center justify-center transition-colors font-bold cursor-pointer"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40" />
            <h2 id="crop-modal-title" className="text-base font-black text-white tracking-tight">Crop Image</h2>
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center justify-between mb-3 px-1 text-xs">
          <span className="font-semibold text-slate-300">Aspect ratio</span>
          <div className="flex items-center gap-1.5">
            {(['Free', '1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatioPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  aspectRatio === preset
                    ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow-md font-black'
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                <span className={aspectRatio === preset ? '!text-black font-black' : ''}>{preset}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Image Preview & Interactive Crop Box (Photo 4) */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-center p-3 bg-slate-950/80 rounded-2xl min-h-[220px] max-h-[290px] overflow-hidden shadow-inner border border-slate-800 mb-3"
        >
          {imageSrc ? (
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoaded}
                className="max-h-[320px] max-w-full object-contain pointer-events-none rounded-lg shadow-md"
              />

              {/* The Precision Crop Rectangle */}
              {imageRef.current && cropRect.width > 0 && (
                <div
                  style={{
                    left: `${cropRect.x}px`,
                    top: `${cropRect.y}px`,
                    width: `${cropRect.width}px`,
                    height: `${cropRect.height}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                  className="absolute border-2 border-[#22c55e] shadow-2xl cursor-move bg-[#22c55e]/15 z-10"
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-amber-300/30" />
                    <div className="border-r border-b border-amber-300/30" />
                    <div className="border-b border-amber-300/30" />
                    <div className="border-r border-b border-amber-300/30" />
                    <div className="border-r border-b border-amber-300/30" />
                    <div className="border-b border-amber-300/30" />
                    <div className="border-r border-amber-300/30" />
                    <div className="border-r border-amber-300/30" />
                    <div />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                    className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-[#22c55e] border border-white rounded-xs cursor-se-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                    className="absolute -left-1.5 -bottom-1.5 w-3.5 h-3.5 bg-[#22c55e] border border-white rounded-xs cursor-sw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                    className="absolute -right-1.5 -top-1.5 w-3.5 h-3.5 bg-[#22c55e] border border-white rounded-xs cursor-ne-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                    className="absolute -left-1.5 -top-1.5 w-3.5 h-3.5 bg-[#22c55e] border border-white rounded-xs cursor-nw-resize shadow-md hover:scale-125 transition-transform"
                  />

                  {/* Center Drag Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 hover:opacity-90 transition-opacity pointer-events-none">
                    <Move size={15} className="text-amber-200 drop-shadow" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 font-mono">
              Memuat gambar...
            </div>
          )}
        </div>

        {/* Pixel Size Manual Controls & Reset (Photo 4) */}
        <div className="flex items-center justify-between mb-4 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">W</span>
            <input
              type="number"
              value={pixelW}
              onChange={(e) => handlePixelWChange(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-mono font-bold focus:border-[#22c55e] focus:outline-none shadow-xs text-center"
            />
            <span className="font-semibold text-stone-900 ml-1">H</span>
            <input
              type="number"
              value={pixelH}
              onChange={(e) => handlePixelHChange(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-mono font-bold focus:border-[#22c55e] focus:outline-none shadow-xs text-center"
            />
            <span className="text-stone-800 font-mono text-[11px] ml-0.5">px</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-[#86efac] hover:text-[#4ade80] underline underline-offset-2 cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Inline Error Banner */}
        {errorMessage && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bottom Actions (Photo 4) */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black text-xs font-black transition-all shadow-lg shadow-[#22c55e]/25 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? 'Memotong...' : 'Apply Crop'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
