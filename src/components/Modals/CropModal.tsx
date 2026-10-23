import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Crop as CropIcon, RotateCcw, Check, Move, Maximize2 } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';

interface CropModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

type AspectRatioPreset = 'Free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const CropModal: React.FC<CropModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('Free');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialRect, setInitialRect] = useState(cropRect);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load preview image safely
  useEffect(() => {
    let active = true;

    async function loadPreview() {
      if (fileInfo.file) {
        const url = URL.createObjectURL(fileInfo.file);
        if (active) setImageSrc(url);
      } else if (window.electronAPI && typeof window.electronAPI.readFileBase64 === 'function') {
        const res = await window.electronAPI.readFileBase64(fileInfo.path);
        if (active && res.success && res.dataUrl) {
          setImageSrc(res.dataUrl);
        }
      }
    }

    loadPreview();

    return () => {
      active = false;
    };
  }, [fileInfo]);

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

      // 1. If running inside Electron desktop app
      if (window.electronAPI && typeof window.electronAPI.saveBase64Image === 'function') {
        const res = await window.electronAPI.saveBase64Image({
          sourceFilePath: fileInfo.path,
          base64Data,
          suffix: 'Cropped',
          ext,
        });
        if (res.success) {
          onSuccess(res);
          onClose();
        } else {
          alert('Crop failed: ' + res.error);
        }
      } else {
        // 2. Browser fallback: trigger immediate direct download
        const link = document.createElement('a');
        const baseName = fileInfo.name.replace(/\.[^.]+$/, '');
        const outputName = `${baseName} Cropped.${ext}`;
        link.download = outputName;
        link.href = base64Data;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onSuccess({
          success: true,
          outputName,
          downloadUrl: base64Data,
        });
        onClose();
      }
    } catch (err: any) {
      alert('Error cropping image: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <motion.div
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 10 }}
        className="relative w-full max-w-xl bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <CropIcon size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Crop Image</h2>
              <p className="text-[10px] text-slate-400">{fileInfo.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950/20 border-b border-slate-800/60 overflow-x-auto gap-2">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
            <Maximize2 size={12} className="text-orange-400" /> Rasio:
          </span>
          <div className="flex items-center gap-1.5">
            {(['Free', '1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatioPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  aspectRatio === preset
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 border border-orange-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Image Preview & Interactive Orange Crop Box */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-center p-4 bg-slate-950/60 min-h-[300px] max-h-[360px] overflow-hidden"
        >
          {imageSrc ? (
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoaded}
                className="max-h-[320px] max-w-full object-contain pointer-events-none rounded-lg"
              />

              {/* The Orange Crop Rectangle */}
              {imageRef.current && cropRect.width > 0 && (
                <div
                  style={{
                    left: `${cropRect.x}px`,
                    top: `${cropRect.y}px`,
                    width: `${cropRect.width}px`,
                    height: `${cropRect.height}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                  className="absolute border-2 border-orange-500 shadow-2xl cursor-move bg-orange-500/10 z-10 transition-shadow"
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-orange-400/25" />
                    <div className="border-r border-b border-orange-400/25" />
                    <div className="border-b border-orange-400/25" />
                    <div className="border-r border-b border-orange-400/25" />
                    <div className="border-r border-b border-orange-400/25" />
                    <div className="border-b border-orange-400/25" />
                    <div className="border-r border-orange-400/25" />
                    <div className="border-r border-orange-400/25" />
                    <div />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                    className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-orange-500 rounded-sm cursor-se-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                    className="absolute -left-1.5 -bottom-1.5 w-3.5 h-3.5 bg-orange-500 rounded-sm cursor-sw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                    className="absolute -right-1.5 -top-1.5 w-3.5 h-3.5 bg-orange-500 rounded-sm cursor-ne-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                    className="absolute -left-1.5 -top-1.5 w-3.5 h-3.5 bg-orange-500 rounded-sm cursor-nw-resize shadow-md hover:scale-125 transition-transform"
                  />

                  {/* Center Drag Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity pointer-events-none">
                    <Move size={16} className="text-orange-300 drop-shadow" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="animate-spin">🌀</span> Memuat gambar...
            </div>
          )}
        </div>

        {/* Pixel Size Manual Controls & Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-950/80 border-t border-slate-800 gap-3">
          {/* Manual W x H */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2 py-1 rounded-xl">
              <span className="text-[11px] font-mono text-slate-400">W:</span>
              <input
                type="number"
                value={pixelW}
                onChange={(e) => handlePixelWChange(parseInt(e.target.value) || 0)}
                className="w-16 bg-transparent text-[12px] font-mono font-bold text-white focus:outline-none text-right"
              />
              <span className="text-[10px] text-slate-500 font-mono">px</span>
            </div>

            <span className="text-slate-600 text-xs">&times;</span>

            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2 py-1 rounded-xl">
              <span className="text-[11px] font-mono text-slate-400">H:</span>
              <input
                type="number"
                value={pixelH}
                onChange={(e) => handlePixelHChange(parseInt(e.target.value) || 0)}
                className="w-16 bg-transparent text-[12px] font-mono font-bold text-white focus:outline-none text-right"
              />
              <span className="text-[10px] text-slate-500 font-mono">px</span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
              title="Reset Crop"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isProcessing ? 'Memproses...' : 'Apply Crop'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
