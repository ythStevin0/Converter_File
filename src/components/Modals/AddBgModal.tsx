import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Palette, RotateCcw, Check, Sparkles, Sliders, Layers } from 'lucide-react';
import { DroppedFileInfo, ConversionResponse } from '../../types';

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

const BG_PRESETS: BgPreset[] = [
  { id: 'transparent', name: 'Transparent', type: 'transparent', value: 'transparent' },
  { id: 'dark', name: 'Dark Slate', type: 'solid', value: '#0f172a' },
  { id: 'white', name: 'Clean White', type: 'solid', value: '#ffffff' },
  { id: 'grad-hyper', name: 'Hyper Violet', type: 'gradient', value: '', gradient: ['#4f46e5', '#9333ea'] },
  { id: 'grad-sunset', name: 'Sunset Glow', type: 'gradient', value: '', gradient: ['#f97316', '#db2777'] },
  { id: 'grad-ocean', name: 'Ocean Cyan', type: 'gradient', value: '', gradient: ['#0284c7', '#0d9488'] },
  { id: 'grad-neon', name: 'Neon Cyber', type: 'gradient', value: '', gradient: ['#10b981', '#3b82f6'] },
  { id: 'grad-aurora', name: 'Aurora Dusk', type: 'gradient', value: '', gradient: ['#ec4899', '#8b5cf6'] },
];

export const AddBgModal: React.FC<AddBgModalProps> = ({ fileInfo, onClose, onSuccess }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<BgPreset>(BG_PRESETS[3]); // default Hyper Violet gradient
  const [padding, setPadding] = useState<number>(48);
  const [borderRadius, setBorderRadius] = useState<number>(24);
  const [shadowBlur, setShadowBlur] = useState<number>(30);
  const [canvasRatio, setCanvasRatio] = useState<CanvasRatio>('Auto');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Load preview image
  useEffect(() => {
    let active = true;

    async function loadImg() {
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

    loadImg();
    return () => {
      active = false;
    };
  }, [fileInfo]);

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

      if (window.electronAPI && typeof window.electronAPI.saveBase64Image === 'function') {
        const res = await window.electronAPI.saveBase64Image({
          sourceFilePath: fileInfo.path,
          base64Data,
          suffix: 'With Background',
          ext: 'png',
        });

        if (res.success) {
          onSuccess(res);
          onClose();
        } else {
          alert('Failed to save: ' + res.error);
        }
      } else {
        // Browser fallback
        const baseName = fileInfo.name.replace(/\.[^.]+$/, '');
        const outputName = `${baseName} With Background.png`;
        const link = document.createElement('a');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl select-none"
    >
      <motion.div
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 10 }}
        className="relative w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Palette size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Add Background</h2>
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

        {/* Live Canvas Preview */}
        <div className="relative flex items-center justify-center p-4 bg-slate-950/70 min-h-[260px] max-h-[300px] overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-h-[270px] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/50"
          />
        </div>

        {/* Controls Panel */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-col gap-3.5">
          {/* Background Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={12} className="text-pink-400" /> Pilihan Background:
              </span>
              <span className="text-[10px] font-mono text-slate-400">{selectedPreset.name}</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {BG_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  title={preset.name}
                  className={`w-7 h-7 rounded-lg transition-transform shrink-0 ${
                    selectedPreset.id === preset.id
                      ? 'ring-2 ring-pink-500 scale-110 shadow-lg'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{
                    background:
                      preset.type === 'solid'
                        ? preset.value
                        : preset.type === 'gradient' && preset.gradient
                        ? `linear-gradient(135deg, ${preset.gradient[0]}, ${preset.gradient[1]})`
                        : 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 10px 10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Sliders: Padding, Corners, Shadow */}
          <div className="grid grid-cols-3 gap-3">
            {/* Padding */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                <span>Padding</span>
                <span className="font-mono text-slate-200">{padding}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                className="w-full accent-pink-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Corners (Border Radius) */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                <span>Corners</span>
                <span className="font-mono text-slate-200">{borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="64"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                className="w-full accent-pink-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Shadow */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                <span>Shadow</span>
                <span className="font-mono text-slate-200">{shadowBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={shadowBlur}
                onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                className="w-full accent-pink-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Canvas Ratio Buttons */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Layers size={12} className="text-pink-400" /> Rasio Kanvas:
            </span>
            <div className="flex items-center gap-1.5">
              {(['Auto', '1:1', '16:9', '4:5'] as CanvasRatio[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCanvasRatio(r)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                    canvasRatio === r
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 bg-slate-950/90 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
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
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-pink-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isProcessing ? 'Menyimpan...' : 'Save with Background'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
