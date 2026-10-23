import { FileCategory, RadialSliceItem } from '../types';

export const QUICK_ACTIONS_SLICES: RadialSliceItem[] = [
  {
    id: 'crop',
    label: 'CROP',
    type: 'action',
    iconName: 'Crop',
    color: '#f97316',
    bgGradient: ['#ea580c', '#c2410c'],
    description: 'Interactive image aspect ratio & pixel crop',
  },
  {
    id: 'add-bg',
    label: 'ADD BG',
    type: 'action',
    iconName: 'Palette',
    color: '#ec4899',
    bgGradient: ['#db2777', '#be185d'],
    description: 'Add gradient background, padding & shadows',
  },
  {
    id: 'compress',
    label: 'COMPRESS',
    type: 'action',
    iconName: 'Minimize2',
    color: '#3b82f6',
    bgGradient: ['#2563eb', '#1d4ed8'],
    description: 'Smart lossy/lossless file size reduction',
  },
  {
    id: 'metadata',
    label: 'METADATA',
    type: 'action',
    iconName: 'Info',
    color: '#6366f1',
    bgGradient: ['#4f46e5', '#4338ca'],
    description: 'Inspect and strip EXIF / sensitive metadata',
  },
  {
    id: 'redact',
    label: 'REDACT',
    type: 'action',
    iconName: 'EyeOff',
    color: '#ef4444',
    bgGradient: ['#dc2626', '#b91c1c'],
    description: 'Blackout sensitive text or image areas',
  },
  {
    id: 'annotate',
    label: 'ANNOTATE',
    type: 'action',
    iconName: 'PenTool',
    color: '#eab308',
    bgGradient: ['#ca8a04', '#a16207'],
    description: 'Quick markup, arrows and text notes',
  },
  {
    id: 'ipfs-drop',
    label: 'IPFS DROP',
    type: 'web3',
    iconName: 'Globe',
    color: '#06b6d4',
    bgGradient: ['#0891b2', '#0e7490'],
    description: 'Instant decentralized storage & share link',
  },
  {
    id: 'stamp',
    label: 'STAMP',
    type: 'web3',
    iconName: 'ShieldCheck',
    color: '#10b981',
    bgGradient: ['#059669', '#047857'],
    description: 'SHA-256 On-Chain Attestation & Timestamp',
  },
  {
    id: 'encrypt',
    label: 'ENCRYPT',
    type: 'web3',
    iconName: 'Lock',
    color: '#8b5cf6',
    bgGradient: ['#7c3aed', '#6d28d9'],
    description: 'AES-256-GCM / Lit Protocol file encryption',
  },
];

export function getFormatSlicesForCategory(category: FileCategory, currentExtension: string): RadialSliceItem[] {
  const ext = currentExtension.toLowerCase().replace(/^\./, '');

  switch (category) {
    case 'pdf':
      return [
        { id: 'fmt-docx', label: 'DOCX', type: 'format', iconName: 'FileText', color: '#2563eb', bgGradient: ['#3b82f6', '#1d4ed8'] },
        { id: 'fmt-jpg', label: 'JPG', type: 'format', iconName: 'Image', color: '#f59e0b', bgGradient: ['#fbbf24', '#d97706'] },
        { id: 'fmt-png', label: 'PNG', type: 'format', iconName: 'Image', color: '#10b981', bgGradient: ['#34d399', '#059669'] },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileCode', color: '#64748b', bgGradient: ['#94a3b8', '#475569'] },
      ];

    case 'image': {
      const allImageFormats = [
        { id: 'fmt-png', label: 'PNG', ext: 'png', color: '#10b981', bg: ['#34d399', '#059669'] as [string, string] },
        { id: 'fmt-jpg', label: 'JPG', ext: 'jpg', color: '#f59e0b', bg: ['#fbbf24', '#d97706'] as [string, string] },
        { id: 'fmt-webp', label: 'WEBP', ext: 'webp', color: '#06b6d4', bg: ['#22d3ee', '#0891b2'] as [string, string] },
        { id: 'fmt-avif', label: 'AVIF', ext: 'avif', color: '#8b5cf6', bg: ['#a78bfa', '#7c3aed'] as [string, string] },
        { id: 'fmt-tiff', label: 'TIFF', ext: 'tiff', color: '#ec4899', bg: ['#f472b6', '#db2777'] as [string, string] },
        { id: 'fmt-bmp', label: 'BMP', ext: 'bmp', color: '#6366f1', bg: ['#818cf8', '#4f46e5'] as [string, string] },
        { id: 'fmt-pdf', label: 'PDF', ext: 'pdf', color: '#ef4444', bg: ['#f87171', '#dc2626'] as [string, string] },
        { id: 'fmt-docx', label: 'DOCX', ext: 'docx', color: '#3b82f6', bg: ['#60a5fa', '#2563eb'] as [string, string] },
      ];

      // Filter out the exact same format as current extension if desired, but keep a healthy set of 6-8 options
      const filtered = allImageFormats.filter(item => item.ext !== ext);
      return (filtered.length >= 6 ? filtered : allImageFormats).slice(0, 8).map(item => ({
        id: item.id,
        label: item.label,
        type: 'format',
        iconName: 'Image',
        color: item.color,
        bgGradient: item.bg,
      }));
    }

    case 'document':
      return [
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File', color: '#ef4444', bgGradient: ['#f87171', '#dc2626'] },
        { id: 'fmt-docx', label: 'DOCX', type: 'format', iconName: 'FileText', color: '#2563eb', bgGradient: ['#3b82f6', '#1d4ed8'] },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileCode', color: '#64748b', bgGradient: ['#94a3b8', '#475569'] },
        { id: 'fmt-html', label: 'HTML', type: 'format', iconName: 'Code', color: '#ea580c', bgGradient: ['#f97316', '#c2410c'] },
        { id: 'fmt-md', label: 'MD', type: 'format', iconName: 'FileEdit', color: '#0284c7', bgGradient: ['#38bdf8', '#0369a1'] },
        { id: 'fmt-epub', label: 'EPUB', type: 'format', iconName: 'Book', color: '#7c3aed', bgGradient: ['#a78bfa', '#6d28d9'] },
      ];

    case 'video':
      return [
        { id: 'fmt-mp4', label: 'MP4', type: 'format', iconName: 'Film', color: '#3b82f6', bgGradient: ['#60a5fa', '#2563eb'] },
        { id: 'fmt-gif', label: 'GIF', type: 'format', iconName: 'Image', color: '#ec4899', bgGradient: ['#f472b6', '#db2777'] },
        { id: 'fmt-mp3', label: 'MP3', type: 'format', iconName: 'Music', color: '#10b981', bgGradient: ['#34d399', '#059669'] },
        { id: 'fmt-webm', label: 'WEBM', type: 'format', iconName: 'Video', color: '#06b6d4', bgGradient: ['#22d3ee', '#0891b2'] },
        { id: 'fmt-mov', label: 'MOV', type: 'format', iconName: 'Film', color: '#8b5cf6', bgGradient: ['#a78bfa', '#7c3aed'] },
      ];

    case 'audio':
      return [
        { id: 'fmt-mp3', label: 'MP3', type: 'format', iconName: 'Music', color: '#10b981', bgGradient: ['#34d399', '#059669'] },
        { id: 'fmt-wav', label: 'WAV', type: 'format', iconName: 'Volume2', color: '#3b82f6', bgGradient: ['#60a5fa', '#2563eb'] },
        { id: 'fmt-flac', label: 'FLAC', type: 'format', iconName: 'Headphones', color: '#8b5cf6', bgGradient: ['#a78bfa', '#7c3aed'] },
        { id: 'fmt-aac', label: 'AAC', type: 'format', iconName: 'Radio', color: '#f59e0b', bgGradient: ['#fbbf24', '#d97706'] },
        { id: 'fmt-ogg', label: 'OGG', type: 'format', iconName: 'Disc', color: '#06b6d4', bgGradient: ['#22d3ee', '#0891b2'] },
      ];

    case 'archive':
      return [
        { id: 'fmt-xlsx', label: 'XLSX', type: 'format', iconName: 'Table', color: '#10b981', bgGradient: ['#34d399', '#059669'] },
        { id: 'fmt-csv', label: 'CSV', type: 'format', iconName: 'FileSpreadsheet', color: '#06b6d4', bgGradient: ['#22d3ee', '#0891b2'] },
        { id: 'fmt-json', label: 'JSON', type: 'format', iconName: 'Code', color: '#f59e0b', bgGradient: ['#fbbf24', '#d97706'] },
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File', color: '#ef4444', bgGradient: ['#f87171', '#dc2626'] },
        { id: 'fmt-zip', label: 'ZIP', type: 'format', iconName: 'Archive', color: '#8b5cf6', bgGradient: ['#a78bfa', '#7c3aed'] },
      ];

    default:
      return [
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File', color: '#ef4444', bgGradient: ['#f87171', '#dc2626'] },
        { id: 'fmt-zip', label: 'ZIP', type: 'format', iconName: 'Archive', color: '#8b5cf6', bgGradient: ['#a78bfa', '#7c3aed'] },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileText', color: '#64748b', bgGradient: ['#94a3b8', '#475569'] },
      ];
  }
}
