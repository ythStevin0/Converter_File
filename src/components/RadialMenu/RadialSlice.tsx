import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Image as ImageIcon, FileCode, File, Film, Music, 
  Table, FileSpreadsheet, Archive, Code, Book, Video, Volume2, 
  Headphones, Radio, Disc, Crop, Palette, Minimize2, Info, EyeOff, 
  PenTool, Globe, ShieldCheck, Lock, FileEdit, Sparkles
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
  onSelect: (item: RadialSliceItem) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Image: ImageIcon,
  FileCode,
  File,
  Film,
  Music,
  Table,
  FileSpreadsheet,
  Archive,
  Code,
  Book,
  Video,
  Volume2,
  Headphones,
  Radio,
  Disc,
  Crop,
  Palette,
  Minimize2,
  Info,
  EyeOff,
  PenTool,
  Globe,
  ShieldCheck,
  Lock,
  FileEdit,
  Sparkles,
};

export const RadialSlice: React.FC<RadialSliceProps> = ({
  item,
  index,
  total,
  innerRadius = 86,
  outerRadius = 225,
  center = 250,
  isActive,
  onHover,
  onSelect,
}) => {
  // Angular math with padding between slices
  const sliceAngle = (2 * Math.PI) / total;
  const paddingAngle = Math.min(0.04, 0.4 / total); // sleek angular gap
  
  // Rotate by -90 deg so slice 0 starts at the top
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

  // Large arc flag for SVGs > 180 deg (rare for N >= 3)
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  // Path: Outer Arc -> Line to Inner End -> Inner Arc backwards -> Close
  const pathData = `
    M ${xOutStart} ${yOutStart}
    A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${xOutEnd} ${yOutEnd}
    L ${xInEnd} ${yInEnd}
    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${xInStart} ${yInStart}
    Z
  `;

  // Center coordinates for icon & text
  const midRadius = (innerRadius + outerRadius) / 2;
  const iconRadius = midRadius - 14;
  const labelRadius = midRadius + 18;

  const iconX = center + iconRadius * Math.cos(midAngle);
  const iconY = center + iconRadius * Math.sin(midAngle);
  const labelX = center + labelRadius * Math.cos(midAngle);
  const labelY = center + labelRadius * Math.sin(midAngle);

  // Vector offset for subtle outward expansion on hover
  const hoverShift = isActive ? 6 : 0;
  const shiftX = hoverShift * Math.cos(midAngle);
  const shiftY = hoverShift * Math.sin(midAngle);

  const IconComponent = ICON_MAP[item.iconName] || Sparkles;

  // Unique gradient ID for this slice
  const gradientId = `grad-${item.id}-${index}`;

  return (
    <g
      className="cursor-pointer transition-transform duration-200"
      transform={`translate(${shiftX}, ${shiftY})`}
      onMouseEnter={() => onHover(item)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(item)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={item.bgGradient[0]} stopOpacity={isActive ? 0.95 : 0.72} />
          <stop offset="100%" stopColor={item.bgGradient[1]} stopOpacity={isActive ? 0.88 : 0.58} />
        </linearGradient>
        <filter id={`glow-${item.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation={isActive ? "8" : "3"} floodColor={item.color} floodOpacity={isActive ? "0.7" : "0.3"} />
        </filter>
      </defs>

      {/* SVG Slice Path */}
      <motion.path
        d={pathData}
        fill={`url(#${gradientId})`}
        stroke={isActive ? item.color : 'rgba(255, 255, 255, 0.18)'}
        strokeWidth={isActive ? 2.5 : 1}
        filter={isActive ? `url(#glow-${item.id})` : undefined}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: index * 0.02 }}
        className="backdrop-blur-md"
      />

      {/* Icon */}
      <g transform={`translate(${iconX - 11}, ${iconY - 11})`} className="pointer-events-none">
        <IconComponent
          size={22}
          color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </g>

      {/* Label Text */}
      <text
        x={labelX}
        y={labelY + 4}
        textAnchor="middle"
        className="pointer-events-none font-bold tracking-wider select-none font-sans"
        fill={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.95)'}
        fontSize={total > 7 ? '11px' : '13px'}
        style={{
          textShadow: isActive ? `0 0 10px ${item.color}` : '0 2px 4px rgba(0,0,0,0.6)',
          letterSpacing: '0.06em',
        }}
      >
        {item.label}
      </text>

      {/* Subtle indicator dot if active */}
      {isActive && (
        <circle
          cx={center + (outerRadius - 10) * Math.cos(midAngle)}
          cy={center + (outerRadius - 10) * Math.sin(midAngle)}
          r={3}
          fill="#ffffff"
          className="animate-ping"
        />
      )}
    </g>
  );
};
