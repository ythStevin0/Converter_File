import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialSlice } from './RadialSlice';
import { CenterCircle } from './CenterCircle';
import { RingToggle } from './RingToggle';
import { DroppedFileInfo, RadialSliceItem, MenuRingMode } from '../../types';
import { getFormatSlicesForCategory, QUICK_ACTIONS_SLICES } from '../../utils/formatRouter';

interface RadialMenuProps {
  fileInfo: DroppedFileInfo | null;
  onSelectAction: (slice: RadialSliceItem) => void;
  isConverting: boolean;
  conversionSuccess: boolean;
  conversionError: string | null;
  onClose?: () => void;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({
  fileInfo,
  onSelectAction,
  isConverting,
  conversionSuccess,
  conversionError,
  onClose,
}) => {
  const [ringMode, setRingMode] = useState<MenuRingMode>('format');
  const [hoveredSlice, setHoveredSlice] = useState<RadialSliceItem | null>(null);

  // Compute format slices contextual to the file
  const formatSlices = React.useMemo(() => {
    if (!fileInfo) return [];
    return getFormatSlicesForCategory(fileInfo.category, fileInfo.extension);
  }, [fileInfo]);

  const activeSlices = ringMode === 'format' ? formatSlices : QUICK_ACTIONS_SLICES;

  // Toggle ring mode
  const toggleRingMode = useCallback(() => {
    setRingMode((prev) => (prev === 'format' ? 'quick-action' : 'format'));
    setHoveredSlice(null);
  }, []);

  // Keyboard shortcut listener (Tab to switch ring, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleRingMode();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRingMode, onClose]);

  // Scroll wheel listener to switch ring
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 20) {
      toggleRingMode();
    }
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
      >
        {/* Ambient Ring Glow */}
        <div 
          className="absolute w-[440px] h-[440px] rounded-full blur-2xl opacity-25 pointer-events-none transition-colors duration-500"
          style={{
            background: ringMode === 'format'
              ? 'radial-gradient(circle, #3b82f6 0%, #8b5cf6 50%, transparent 70%)'
              : 'radial-gradient(circle, #f97316 0%, #ec4899 50%, transparent 70%)',
          }}
        />

        {/* Outer Guide Ring */}
        <svg
          viewBox="0 0 500 500"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <circle
            cx="250"
            cy="250"
            r="234"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx="250"
            cy="250"
            r="82"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
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
                  onSelect={(slice) => onSelectAction(slice)}
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
        toolCount={QUICK_ACTIONS_SLICES.length}
      />
    </div>
  );
};
