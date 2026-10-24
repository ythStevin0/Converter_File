import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, EyeOff, RotateCcw, Check, Undo, ShieldAlert } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';
import { useFilePreview, saveEditedImage } from '../../utils/fileHelpers';

interface RedactModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

interface RedactRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const RedactModal: React.FC<RedactModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const imageSrc = useFilePreview(fileInfo);
  const [rects, setRects] = useState<RedactRect[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<RedactRect | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      loadedImgRef.current = img;
      redraw();
    };
  }, [imageSrc, rects, currentRect]);

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = loadedImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // Draw background image
    ctx.drawImage(img, 0, 0);

    // Draw all completed censor rectangles
    ctx.fillStyle = '#000000';
    rects.forEach((r) => {
      ctx.fillRect(r.x, r.y, r.width, r.height);
    });

    // Draw currently active rectangle
    if (currentRect) {
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const coords = getCanvasCoordinates(e);

    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 5 && currentRect.height > 5) {
      setRects((prev) => [...prev, currentRect]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleUndo = () => {
    setRects((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setRects([]);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isProcessing) return;
    setIsProcessing(true);

    try {
      const base64Data = canvas.toDataURL('image/png');
      const ext = fileInfo.extension.replace(/^\./, '') || 'png';

      await saveEditedImage({
        fileInfo,
        dataUrl: base64Data,
        suffix: 'Redacted',
        ext,
        message: 'Saved redacted file successfully',
        onSuccess,
        onClose,
      });
    } catch (err: any) {
      alert('Error saving: ' + err.message);
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
    >
      <motion.div
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 10 }}
        className="relative w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'radial-gradient(135deg, #1e293b 0%, #0a0f1d 100%)',
          border: '2px solid #94a3b8',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(34, 197, 94, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center text-[#4ade80]">
              <EyeOff size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40" />
                <h2 className="text-sm font-black text-white tracking-tight">Redact &amp; Sensor Sensitive Area</h2>
              </div>
              <p className="text-[10px] text-slate-400">Tarik kotak hitam di atas area yang ingin disensor</p>
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

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={rects.length === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Undo size={13} />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={rects.length === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Hapus Semua</span>
            </button>
          </div>

          <span className="text-[11px] text-[#86efac] font-mono font-bold">
            {rects.length} area disensor
          </span>
        </div>

        {/* Canvas Area */}
        <div className="relative flex items-center justify-center p-4 bg-slate-950/80 min-h-[300px] max-h-[360px] overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="max-h-[320px] max-w-full object-contain cursor-crosshair rounded-lg shadow-xl"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-slate-950/90 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || rects.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black text-xs font-black shadow-lg shadow-[#22c55e]/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check size={14} className="!text-black" />
            <span className="!text-black">{isProcessing ? 'Menyimpan...' : 'Simpan Sensor'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
