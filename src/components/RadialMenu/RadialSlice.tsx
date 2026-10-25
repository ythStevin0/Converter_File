import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Image as ImageIcon, Crop, Palette, Minimize2, 
  Tag, EyeOff, Sliders, PenTool, Lock, ShieldCheck, Globe, File, Hash
} from 'lucide-react';
import { RadialSliceItem } from '../../types';

interface RadialSliceProps {
  item: RadialSliceItem;
  index: number;
  total: number;
  innerRadius?: number;
  outerRadius?: number;
  center?: number;
  isActive: boolean;
  onHover: (item: RadialSliceItem | null) => void;
  onSelect: (item: RadialSliceItem, droppedFile?: File) => void;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  compress: Minimize2,
  crop: Crop,
  'add-bg': Palette,
  metadata: Tag,
  redact: EyeOff,
  edit: Sliders,
  annotate: PenTool,
  ipfs: Globe,
  stamp: ShieldCheck,
  checksum: Hash,
  encrypt: Lock,
};

export const RadialSlice: React.FC<RadialSliceProps> = ({
  item,
  index,
  total,
  innerRadius = 92,
  outerRadius = 222,
  center = 250,
  isActive,
  onHover,
  onSelect,
}) => {
  // Angular math with generous gap between slices for rounded petal feel
  const sliceAngle = (2 * Math.PI) / total;
  const paddingAngle = Math.min(0.065, 0.45 / total);
  
  // Rotate by -90 deg so slice 0 starts at top-center
  const startAngle = index * sliceAngle + paddingAngle / 2 - Math.PI / 2;
  const endAngle = (index + 1) * sliceAngle - paddingAngle / 2 - Math.PI / 2;
  const midAngle = (startAngle + endAngle) / 2;

  // Outer arc points
  const xOutStart = center + outerRadius * Math.cos(startAngle);
  const yOutStart = center + outerRadius * Math.sin(startAngle);
  const xOutEnd = center + outerRadius * Math.cos(endAngle);
  const yOutEnd = center + outerRadius * Math.sin(endAngle);

  // Inner arc points
  const xInStart = center + innerRadius * Math.cos(startAngle);
  const yInStart = center + innerRadius * Math.sin(startAngle);
  const xInEnd = center + innerRadius * Math.cos(endAngle);
  const yInEnd = center + innerRadius * Math.sin(endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  // Outer Arc -> Line to Inner End -> Inner Arc backwards -> Close
  const pathData = `
    M ${xOutStart} ${yOutStart}
    A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${xOutEnd} ${yOutEnd}
    L ${xInEnd} ${yInEnd}
    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${xInStart} ${yInStart}
    Z
  `;

  // Center positioning for icon and text
  const midRadius = (innerRadius + outerRadius) / 2;
  const isTool = item.type === 'action' || item.type === 'web3';
  
  // If it's a tool (Ring 2), position icon above label. If it's a format (Ring 1), center the label!
  const iconYOffset = isTool ? midRadius - 13 : midRadius;
  const labelYOffset = isTool ? midRadius + 14 : midRadius;

  const iconX = center + iconYOffset * Math.cos(midAngle);
  const iconY = center + iconYOffset * Math.sin(midAngle);
  const labelX = center + labelYOffset * Math.cos(midAngle);
  const labelY = center + labelYOffset * Math.sin(midAngle);

  // Subtle shift on hover
  const hoverShift = isActive ? 5 : 0;
  const shiftX = hoverShift * Math.cos(midAngle);
  const shiftY = hoverShift * Math.sin(midAngle);

  const IconComponent = ACTION_ICONS[item.id] || (item.iconName ? File : null);
  const gradientId = `slice-grad-${item.id}-${index}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={item.description || item.label}
      className="cursor-pointer select-none focus:outline-none"
      style={{
        transform: `translate(${shiftX}px, ${shiftY}px)`,
        transition: 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={() => onHover(item)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onHover(item);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
        if (!isActive) onHover(item);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onHover(null);
        const file = e.dataTransfer?.files?.[0];
        onSelect(item, file);
      }}
    >
      <defs>
        {/* Omnitrix Matte Charcoal vs Alien Green Hourglass */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isActive ? (
            <>
              <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
              <stop offset="55%" stopColor="#22c55e" stopOpacity="1" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="1" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.98" />
            </>
          )}
        </linearGradient>

        <filter id={`glow-${item.id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow 
            dx="0" 
            dy="2" 
            stdDeviation={isActive ? "14" : "4"} 
            floodColor={isActive ? "#22c55e" : "rgba(0, 0, 0, 0.7)"} 
            floodOpacity={isActive ? "0.9" : "0.5"} 
          />
        </filter>
      </defs>

      {/* Outer radioactive ambient glow when active */}
      {isActive && (
        <path
          d={pathData}
          fill="#22c55e"
          opacity="0.5"
          filter="blur(14px)"
          className="pointer-events-none"
        />
      )}

      {/* Main Petal Slice with Omnitrix mechanical border */}
      <motion.path
        d={pathData}
        fill={`url(#${gradientId})`}
        stroke={isActive ? '#ffffff' : 'rgba(203, 213, 225, 0.45)'}
        strokeWidth={isActive ? 2.5 : 1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#glow-${item.id})`}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, delay: index * 0.015 }}
      />

      {/* Icon (Only for Ring 2 Quick Actions) */}
      {isTool && IconComponent && (
        <g transform={`translate(${iconX - 10}, ${iconY - 10})`} className="pointer-events-none">
          <IconComponent
            size={20}
            color={isActive ? '#000000' : '#94a3b8'}
            strokeWidth={2.4}
          />
        </g>
      )}

      {/* Label Text (Bold Black on Active Alien Green, Crisp Silver-White on Inactive Charcoal) */}
      <text
        x={labelX}
        y={isTool ? labelY + 4 : labelY + 5}
        textAnchor="middle"
        className="pointer-events-none font-sans font-black uppercase select-none"
        fill={isActive ? '#000000' : '#f8fafc'}
        fontSize={isTool ? (total > 6 ? '11px' : '12px') : (total > 5 ? '13px' : '15px')}
        letterSpacing="0.05em"
        style={{
          textShadow: isActive 
            ? 'none' 
            : '0 1px 3px rgba(0,0,0,0.9)',
        }}
      >
        {item.label}
      </text>
    </g>
  );
};
