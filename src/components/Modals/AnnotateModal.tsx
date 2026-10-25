import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, PenTool, RotateCcw, Check, Undo, ArrowUpRight, Square, Type, Highlighter } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';
import { useFilePreview, saveEditedImage } from '../../utils/fileHelpers';

interface AnnotateModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

type ToolType = 'pen' | 'highlighter' | 'arrow' | 'rect' | 'text';

interface DrawingAction {
  type: ToolType;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ffffff', '#000000'];

export const AnnotateModal: React.FC<AnnotateModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const imageSrc = useFilePreview(fileInfo);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [actions, setActions] = useState<DrawingAction[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAction, setCurrentAction] = useState<DrawingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

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

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      loadedImgRef.current = img;
      redraw();
    };
  }, [imageSrc, actions, currentAction]);

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = loadedImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // Draw base image
    ctx.drawImage(img, 0, 0);

    // Draw all completed actions
    actions.forEach((a) => drawAction(ctx, a));

    // Draw active drawing action
    if (currentAction) {
      drawAction(ctx, currentAction);
    }
  };

  const drawAction = (ctx: CanvasRenderingContext2D, a: DrawingAction) => {
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = a.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (a.type === 'pen' && a.points && a.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(a.points[0].x, a.points[0].y);
      for (let i = 1; i < a.points.length; i++) {
        ctx.lineTo(a.points[i].x, a.points[i].y);
      }
      ctx.stroke();
    } else if (a.type === 'highlighter' && a.points && a.points.length > 1) {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = a.size * 3;
      ctx.beginPath();
      ctx.moveTo(a.points[0].x, a.points[0].y);
      for (let i = 1; i < a.points.length; i++) {
        ctx.lineTo(a.points[i].x, a.points[i].y);
      }
      ctx.stroke();
    } else if (a.type === 'arrow' && a.start && a.end) {
      const fromx = a.start.x;
      const fromy = a.start.y;
      const tox = a.end.x;
      const toy = a.end.y;
      const headlen = 16;
      const angle = Math.atan2(toy - fromy, tox - fromx);

      ctx.beginPath();
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (a.type === 'rect' && a.start && a.end) {
      const x = Math.min(a.start.x, a.end.x);
      const y = Math.min(a.start.y, a.end.y);
      const w = Math.abs(a.end.x - a.start.x);
      const h = Math.abs(a.end.y - a.start.y);
      ctx.strokeRect(x, y, w, h);
    } else if (a.type === 'text' && a.start && a.text) {
      ctx.font = `bold ${a.size * 6}px sans-serif`;
      ctx.fillText(a.text, a.start.x, a.start.y);
    }

    ctx.restore();
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

    if (currentTool === 'text') {
      const text = prompt('Ketik teks catatan anotasi:');
      if (text) {
        setActions((prev) => [
          ...prev,
          {
            type: 'text',
            color: currentColor,
            size: brushSize,
            start: coords,
            text,
          },
        ]);
      }
      return;
    }

    setIsDrawing(true);
    if (currentTool === 'pen' || currentTool === 'highlighter') {
      setCurrentAction({
        type: currentTool,
        color: currentColor,
        size: brushSize,
        points: [coords],
      });
    } else if (currentTool === 'arrow' || currentTool === 'rect') {
      setCurrentAction({
        type: currentTool,
        color: currentColor,
        size: brushSize,
        start: coords,
        end: coords,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAction) return;
    const coords = getCanvasCoordinates(e);

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      setCurrentAction((prev) =>
        prev ? { ...prev, points: [...(prev.points || []), coords] } : null
      );
    } else if (currentTool === 'arrow' || currentTool === 'rect') {
      setCurrentAction((prev) =>
        prev ? { ...prev, end: coords } : null
      );
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentAction) {
      setActions((prev) => [...prev, currentAction]);
    }
    setIsDrawing(false);
    setCurrentAction(null);
  };

  const handleUndo = () => {
    setActions((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setActions([]);
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
        suffix: 'Annotated',
        ext,
        message: 'Saved annotated file successfully',
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="annotate-modal-title"
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
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center text-[#4ade80]">
              <PenTool size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40" />
                <h2 id="annotate-modal-title" className="text-sm font-black text-white tracking-tight">Annotate &amp; Draw</h2>
              </div>
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950/40 border-b border-slate-800 gap-2">
          {/* Tool selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {[
              { id: 'pen', icon: PenTool, title: 'Coretan Pulpen' },
              { id: 'highlighter', icon: Highlighter, title: 'Stabilo' },
              { id: 'arrow', icon: ArrowUpRight, title: 'Panah' },
              { id: 'rect', icon: Square, title: 'Kotak' },
              { id: 'text', icon: Type, title: 'Teks Catatan' },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCurrentTool(t.id as ToolType)}
                  title={t.title}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    currentTool === t.id ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrentColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  currentColor === c ? 'ring-2 ring-white scale-125' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c, border: '1px solid rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={actions.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              title="Undo"
            >
              <Undo size={13} />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={actions.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              title="Hapus Semua"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative flex items-center justify-center p-4 bg-slate-950/80 min-h-[290px] max-h-[340px] overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="max-h-[300px] max-w-full object-contain cursor-crosshair rounded-lg shadow-xl"
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
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black text-xs font-black shadow-lg shadow-[#22c55e]/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check size={14} className="!text-black" />
            <span className="!text-black">{isProcessing ? 'Menyimpan...' : 'Simpan Anotasi'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
