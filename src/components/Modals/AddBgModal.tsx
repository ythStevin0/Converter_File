import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Palette, RotateCcw, Check, Sparkles, Sliders, Layers } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';
import { useFilePreview, saveEditedImage } from '../../utils/fileHelpers';

interface AddBgModalProps {
  fileInfo: DroppedFileInfo;
  onClose: () => void;
  onSuccess: (res: ConversionResponse) => void;
}

type CanvasRatio = 'Auto' | '1:1' | '16:9' | '4:5';

interface BgPreset {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'transparent';
  value: string;
  gradient?: [string, string];
}

const BG_GRADIENTS: BgPreset[] = [
  { id: 'grad-sunset', name: 'Sunset Orange', type: 'gradient', value: '', gradient: ['#f97316', '#eab308'] },
  { id: 'grad-white-glow', name: 'Pure Frost', type: 'gradient', value: '', gradient: ['#ffffff', '#f1f5f9'] },
  { id: 'grad-warm-pastel', name: 'Warm Pastel', type: 'gradient', value: '', gradient: ['#fde68a', '#fca5a5'] },
  { id: 'grad-soft-cloud', name: 'Soft Peach', type: 'gradient', value: '', gradient: ['#fed7aa', '#fbcfe8'] },
  { id: 'grad-dusk', name: 'Deep Sunset', type: 'gradient', value: '', gradient: ['#7c2d12', '#b91c1c'] },
  { id: 'grad-ocean', name: 'Ocean Cyan', type: 'gradient', value: '', gradient: ['#06b6d4', '#3b82f6'] },
  { id: 'grad-hyper', name: 'Hyper Violet', type: 'gradient', value: '', gradient: ['#4f46e5', '#9333ea'] },
];

const BG_SOLIDS: BgPreset[] = [
  { id: 'solid-white', name: 'White', type: 'solid', value: '#ffffff' },
  { id: 'solid-yellow', name: 'Amber Yellow', type: 'solid', value: '#eab308' },
  { id: 'solid-lime', name: 'Lime', type: 'solid', value: '#84cc16' },
  { id: 'solid-green', name: 'Emerald Green', type: 'solid', value: '#10b981' },
  { id: 'solid-teal', name: 'Teal', type: 'solid', value: '#14b8a6' },
  { id: 'solid-cyan', name: 'Sky Cyan', type: 'solid', value: '#06b6d4' },
  { id: 'solid-blue', name: 'Electric Blue', type: 'solid', value: '#2563eb' },
  { id: 'solid-slate', name: 'Deep Navy', type: 'solid', value: '#1e293b' },
  { id: 'solid-purple', name: 'Royal Purple', type: 'solid', value: '#7c3aed' },
  { id: 'solid-indigo', name: 'Indigo Pill', type: 'solid', value: '#4338ca' },
];

const BG_PRESETS: BgPreset[] = [...BG_GRADIENTS, ...BG_SOLIDS];

export const AddBgModal: React.FC<AddBgModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const imageSrc = useFilePreview(fileInfo);
  const [selectedPreset, setSelectedPreset] = useState<BgPreset>(BG_PRESETS[3]); // default Hyper Violet gradient
  const [padding, setPadding] = useState<number>(48);
  const [borderRadius, setBorderRadius] = useState<number>(24);
  const [shadowBlur, setShadowBlur] = useState<number>(30);
  const [canvasRatio, setCanvasRatio] = useState<CanvasRatio>('Auto');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

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

  // Redraw canvas whenever settings change
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      loadedImageRef.current = img;
      renderCanvas();
    };
  }, [imageSrc, selectedPreset, padding, borderRadius, shadowBlur, canvasRatio]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;

    // Calculate canvas size based on ratio and padding
    let targetW = imgW + padding * 2;
    let targetH = imgH + padding * 2;

    if (canvasRatio === '1:1') {
      const maxDim = Math.max(targetW, targetH);
      targetW = maxDim;
      targetH = maxDim;
    } else if (canvasRatio === '16:9') {
      const requiredW = Math.max(targetW, (targetH * 16) / 9);
      targetW = requiredW;
      targetH = (requiredW * 9) / 16;
    } else if (canvasRatio === '4:5') {
      const requiredW = Math.max(targetW, (targetH * 4) / 5);
      targetW = requiredW;
      targetH = (requiredW * 5) / 4;
    }

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);

    // 1. Draw Background
    if (selectedPreset.type === 'transparent') {
      // Checkerboard pattern
      const size = 16;
      for (let y = 0; y < targetH; y += size) {
        for (let x = 0; x < targetW; x += size) {
          ctx.fillStyle = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0 ? '#1e293b' : '#0f172a';
          ctx.fillRect(x, y, size, size);
        }
      }
    } else if (selectedPreset.type === 'solid') {
      ctx.fillStyle = selectedPreset.value;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (selectedPreset.type === 'gradient' && selectedPreset.gradient) {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, selectedPreset.gradient[0]);
      grad.addColorStop(1, selectedPreset.gradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    // 2. Center the image
    const drawX = (targetW - imgW) / 2;
    const drawY = (targetH - imgH) / 2;

    ctx.save();

    // 3. Draw Shadow
    if (shadowBlur > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetY = shadowBlur * 0.4;
      ctx.fillStyle = '#000000';

      // Draw rounded shadow path
      ctx.beginPath();
      roundedRectPath(ctx, drawX, drawY, imgW, imgH, borderRadius);
      ctx.fill();
    }

    // 4. Draw Rounded Image Clip
    ctx.beginPath();
    roundedRectPath(ctx, drawX, drawY, imgW, imgH, borderRadius);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, imgW, imgH);

    ctx.restore();
  };

  // Helper for drawing rounded rectangle paths
  const roundedRectPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.min(r, Math.min(w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  // Reset to defaults
  const handleReset = () => {
    setSelectedPreset(BG_PRESETS[3]);
    setPadding(48);
    setBorderRadius(24);
    setShadowBlur(30);
    setCanvasRatio('Auto');
  };

  // Save With Background
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isProcessing) return;
    setIsProcessing(true);

    try {
      const base64Data = canvas.toDataURL('image/png');

      await saveEditedImage({
        fileInfo,
        dataUrl: base64Data,
        suffix: 'With Background',
        ext: 'png',
        message: 'Saved with background successfully',
        onSuccess,
        onClose,
      });
    } catch (err: any) {
      alert('Error saving image: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md select-none"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bg-modal-title"
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
            aria-label="Tutup modal latar belakang"
            className="absolute left-0 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 flex items-center justify-center transition-colors font-bold cursor-pointer"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 shadow-xs ring-1 ring-black/40" />
            <h2 id="add-bg-modal-title" className="text-base font-black text-white tracking-tight">Add Background</h2>
          </div>
        </div>

        {/* Live Canvas Preview */}
        <div className="relative flex items-center justify-center p-3 bg-slate-950/80 rounded-2xl min-h-[210px] max-h-[260px] overflow-hidden shadow-inner border border-slate-800 mb-3">
          <canvas
            ref={canvasRef}
            className="max-h-[240px] max-w-full object-contain rounded-xl shadow-xl"
          />
        </div>

        {/* Controls Panel (Photo 5) */}
        <div className="flex flex-col gap-3">
          {/* Background Preset Swatches */}
          <div>
            <span className="text-xs font-semibold text-slate-300 mb-1.5 block">Background</span>
            
            {/* Gradients Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-1.5">
              {BG_GRADIENTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  title={preset.name}
                  className={`w-8 h-6 rounded-md transition-all shrink-0 ${
                    selectedPreset.id === preset.id
                      ? 'ring-2 ring-white scale-105 shadow-md'
                      : 'opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${preset.gradient![0]}, ${preset.gradient![1]})`,
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>

            {/* Solid Colors Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {BG_SOLIDS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  title={preset.name}
                  className={`w-6 h-6 rounded-md transition-all shrink-0 ${
                    selectedPreset.id === preset.id
                      ? 'ring-2 ring-white scale-110 shadow-md'
                      : 'opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: preset.value,
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sliders: Padding, Corners, Shadow */}
          <div className="flex flex-col gap-2 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-700/60">
            {/* Padding Slider */}
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="font-semibold text-slate-300 w-16">Padding</span>
              <input
                type="range"
                min="0"
                max="120"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                className="w-full accent-[#22c55e] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-[#86efac] font-bold w-12 text-right tabular-nums">
                {padding * 4} px
              </span>
            </div>

            {/* Corners Slider */}
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="font-semibold text-slate-300 w-16">Corners</span>
              <input
                type="range"
                min="0"
                max="64"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                className="w-full accent-[#22c55e] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-[#86efac] font-bold w-12 text-right tabular-nums">
                {borderRadius * 3} px
              </span>
            </div>

            {/* Shadow Slider */}
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="font-semibold text-slate-300 w-16">Shadow</span>
              <input
                type="range"
                min="0"
                max="60"
                value={shadowBlur}
                onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                className="w-full accent-[#22c55e] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-[#86efac] font-bold w-12 text-right tabular-nums">
                {shadowBlur} px
              </span>
            </div>
          </div>

          {/* Ratio Row & Actions */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-300">Ratio</span>
              <div className="flex items-center gap-1">
                {(['Auto', '1:1', '16:9', '4:5'] as CanvasRatio[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCanvasRatio(r)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      canvasRatio === r
                        ? 'bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black shadow-md font-black'
                        : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50'
                    }`}
                  >
                    <span className={canvasRatio === r ? '!text-black font-black' : ''}>{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-[#86efac] hover:text-[#4ade80] underline underline-offset-2 cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Apply Button */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] !text-black text-xs font-black transition-all shadow-lg shadow-[#22c55e]/25 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'Menyimpan...' : 'Apply Background'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
