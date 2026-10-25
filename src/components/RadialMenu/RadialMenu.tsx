import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialSlice } from './RadialSlice';
import { CenterCircle } from './CenterCircle';
import { RingToggle } from './RingToggle';
import { DroppedFileInfo, RadialSliceItem, MenuRingMode } from '../../types';
import { getFormatSlicesForCategory, getQuickActionSlicesForCategory, QUICK_ACTIONS_SLICES } from '../../utils/formatRouter';
import { parseDroppedFile } from '../../utils/fileHelpers';

interface RadialMenuProps {
  fileInfo: DroppedFileInfo | null;
  onSelectAction: (slice: RadialSliceItem, droppedFile?: File) => void;
  onFileLoaded?: (fileInfo: DroppedFileInfo) => void;
  isConverting: boolean;
  conversionSuccess: boolean;
  conversionError: string | null;
  onClose?: () => void;
  isModalOpen?: boolean;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({
  fileInfo,
  onSelectAction,
  onFileLoaded,
  isConverting,
  conversionSuccess,
  conversionError,
  onClose,
  isModalOpen = false,
}) => {
  const [ringMode, setRingMode] = useState<MenuRingMode>('format');
  const [hoveredSlice, setHoveredSlice] = useState<RadialSliceItem | null>(null);

  // Compute format slices contextual to the file
  const formatSlices = React.useMemo(() => {
    if (!fileInfo) return [];
    return getFormatSlicesForCategory(fileInfo.category, fileInfo.extension);
  }, [fileInfo]);

  // Compute quick action slices contextual to the file category
  const quickActionSlices = React.useMemo(() => {
    if (!fileInfo) return QUICK_ACTIONS_SLICES;
    return getQuickActionSlicesForCategory(fileInfo.category);
  }, [fileInfo]);

  const activeSlices = ringMode === 'format' ? formatSlices : quickActionSlices;

  // Toggle ring mode
  const toggleRingMode = useCallback(() => {
    setRingMode((prev) => (prev === 'format' ? 'quick-action' : 'format'));
    setHoveredSlice(null);
  }, []);

  // Keyboard shortcut listener (Tab to switch ring, Escape to close)
  // Disabled when a modal is open to preserve standard form navigation and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        toggleRingMode();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRingMode, onClose, isModalOpen]);

  // Scroll wheel listener to switch ring
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 20) {
      toggleRingMode();
    }
  };

  // Polar coordinate drag math: automatically detects slice under cursor
  const handleWheelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 250;
    const y = e.clientY - rect.top - 250;
    const dist = Math.sqrt(x * x + y * y);

    if (dist >= 84 && dist <= 235 && activeSlices.length > 0) {
      let angle = Math.atan2(y, x) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;

      const sliceAngle = (2 * Math.PI) / activeSlices.length;
      const sliceIndex = Math.floor(angle / sliceAngle) % activeSlices.length;
      const targetSlice = activeSlices[sliceIndex];
      if (targetSlice && hoveredSlice?.id !== targetSlice.id) {
        setHoveredSlice(targetSlice);
      }
    } else if (dist < 84) {
      if (hoveredSlice !== null) {
        setHoveredSlice(null);
      }
    }
  };

  const handleWheelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 250;
    const y = e.clientY - rect.top - 250;
    const dist = Math.sqrt(x * x + y * y);

    if (dist >= 84 && dist <= 235 && activeSlices.length > 0) {
      let angle = Math.atan2(y, x) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;
      const sliceAngle = (2 * Math.PI) / activeSlices.length;
      const sliceIndex = Math.floor(angle / sliceAngle) % activeSlices.length;
      const targetSlice = activeSlices[sliceIndex];
      if (targetSlice) {
        onSelectAction(targetSlice, file);
        setHoveredSlice(null);
        return;
      }
    }

    // Dropped on center circle or outer wheel area: load new file!
    if (onFileLoaded) {
      const parsed = parseDroppedFile(file);
      onFileLoaded(parsed);
    }
    setHoveredSlice(null);
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center select-none"
      onWheel={handleWheel}
    >
      {/* Container with backdrop glow */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="relative w-[500px] h-[500px] flex items-center justify-center"
        onDragOver={handleWheelDragOver}
        onDrop={handleWheelDrop}
      >
        {/* Ambient Ring Glow (Radioactive Omnitrix Alien Green Glow) */}
        <div 
          className="absolute w-[470px] h-[470px] rounded-full blur-3xl opacity-60 pointer-events-none transition-all duration-500"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.42) 0%, rgba(22, 163, 74, 0.16) 50%, transparent 72%)',
          }}
        />

        {/* Omnitrix Mechanical Bezel & Guide Rings */}
        <svg
          viewBox="0 0 500 500"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        >
          {/* Outer Matte Grey Industrial Collar */}
          <circle
            cx="250"
            cy="250"
            r="234"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Omnitrix Vibrant Green Accent Ring */}
          <circle
            cx="250"
            cy="250"
            r="228"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            opacity="0.95"
          />

          {/* 4 Quadrant Mechanical Notches (Omnitrix Bezel Slits at 12, 3, 6, 9 o'clock) */}
          <line x1="250" y1="12" x2="250" y2="26" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <line x1="474" y1="250" x2="488" y2="250" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <line x1="250" y1="474" x2="250" y2="488" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="250" x2="26" y2="250" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />

          {/* Inner Raised Dial Collar (Light Grey & Green Ring) */}
          <circle
            cx="250"
            cy="250"
            r="85"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
          />
          <circle
            cx="250"
            cy="250"
            r="82"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            opacity="0.9"
          />
        </svg>

        {/* Slices SVG */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full filter drop-shadow-2xl overflow-visible z-10"
        >
          <AnimatePresence mode="wait">
            <motion.g
              key={ringMode}
              initial={{ rotate: -15, opacity: 0, scale: 0.92 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 15, opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ transformOrigin: '250px 250px' }}
            >
              {activeSlices.map((item, index) => (
                <RadialSlice
                  key={item.id}
                  item={item}
                  index={index}
                  total={activeSlices.length}
                  innerRadius={86}
                  outerRadius={225}
                  center={250}
                  isActive={hoveredSlice?.id === item.id}
                  onHover={(slice) => setHoveredSlice(slice)}
                  onSelect={(slice, droppedFile) => onSelectAction(slice, droppedFile)}
                />
              ))}
            </motion.g>
          </AnimatePresence>
        </svg>

        {/* Central Indicator Circle (Size when idle -> Action on hover) */}
        <CenterCircle
          fileInfo={fileInfo}
          hoveredSlice={hoveredSlice}
          isConverting={isConverting}
          conversionSuccess={conversionSuccess}
          conversionError={conversionError}
          radius={76}
          center={250}
        />
      </motion.div>

      {/* Mode Switcher pill */}
      <RingToggle
        mode={ringMode}
        onToggle={toggleRingMode}
        formatCount={formatSlices.length}
        toolCount={quickActionSlices.length}
      />
    </div>
  );
};
