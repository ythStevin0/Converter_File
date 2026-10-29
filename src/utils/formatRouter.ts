import { FileCategory, RadialSliceItem } from '../types';

export const QUICK_ACTIONS_SLICES: RadialSliceItem[] = [
  {
    id: 'crop',
    label: 'CROP',
    type: 'action',
    iconName: 'Crop',
    description: 'Interactive image aspect ratio & pixel crop',
  },
  {
    id: 'add-bg',
    label: 'ADD BG',
    type: 'action',
    iconName: 'Palette',
    description: 'Add gradient background, padding & shadows',
  },
  {
    id: 'compress',
    label: 'COMPRESS',
    type: 'action',
    iconName: 'Minimize2',
    description: 'Smart lossy/lossless file size reduction',
  },
  {
    id: 'metadata',
    label: 'METADATA',
    type: 'action',
    iconName: 'Info',
    description: 'Inspect and strip EXIF / sensitive metadata',
  },
  {
    id: 'redact',
    label: 'REDACT',
    type: 'action',
    iconName: 'EyeOff',
    description: 'Blackout sensitive text or image areas',
  },
  {
    id: 'annotate',
    label: 'ANNOTATE',
    type: 'action',
    iconName: 'PenTool',
    description: 'Quick markup, arrows and text notes',
  },
  {
    id: 'checksum',
    label: 'CHECKSUM',
    type: 'action',
    iconName: 'Hash',
    description: 'Hitung & salin SHA-256 Checksum integritas berkas',
  },
  {
    id: 'encrypt',
    label: 'ENCRYPT',
    type: 'action',
    iconName: 'Lock',
    description: 'Enkripsi offline AES-256-GCM dengan kata sandi',
  },
];

export function getQuickActionSlicesForCategory(category: FileCategory): RadialSliceItem[] {
  switch (category) {
    case 'image':
      return QUICK_ACTIONS_SLICES; // All 8 image tools: Crop, Add BG, Compress, Metadata, Redact, Annotate, Checksum, Encrypt
    case 'pdf':
    case 'document':
      return QUICK_ACTIONS_SLICES.filter((s) => ['compress', 'metadata', 'checksum', 'encrypt'].includes(s.id));
    case 'video':
    case 'audio':
    case 'archive':
    default:
      return QUICK_ACTIONS_SLICES.filter((s) => ['compress', 'metadata', 'checksum', 'encrypt'].includes(s.id));
  }
}

export function getFormatSlicesForCategory(category: FileCategory, currentExtension: string): RadialSliceItem[] {
  const ext = currentExtension.toLowerCase().replace(/^\./, '');

  switch (category) {
    case 'pdf':
      return [
        { id: 'fmt-docx', label: 'DOCX', type: 'format', iconName: 'FileText' },
        { id: 'fmt-jpg', label: 'JPG', type: 'format', iconName: 'Image' },
        { id: 'fmt-png', label: 'PNG', type: 'format', iconName: 'Image' },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileCode' },
        { id: 'fmt-html', label: 'HTML', type: 'format', iconName: 'Code' },
        { id: 'fmt-md', label: 'MD', type: 'format', iconName: 'FileEdit' },
        { id: 'fmt-epub', label: 'EPUB', type: 'format', iconName: 'Book' },
      ];

    case 'image': {
      const allImageFormats = [
        { id: 'fmt-png', label: 'PNG', ext: 'png' },
        { id: 'fmt-jpg', label: 'JPG', ext: 'jpg' },
        { id: 'fmt-webp', label: 'WEBP', ext: 'webp' },
        { id: 'fmt-avif', label: 'AVIF', ext: 'avif' },
        { id: 'fmt-tiff', label: 'TIFF', ext: 'tiff' },
        { id: 'fmt-bmp', label: 'BMP', ext: 'bmp' },
        { id: 'fmt-pdf', label: 'PDF', ext: 'pdf' },
        { id: 'fmt-docx', label: 'DOCX', ext: 'docx' },
      ];

      const filtered = allImageFormats.filter(item => {
        if (ext === 'jpg' || ext === 'jpeg') {
          return item.ext !== 'jpg';
        }
        return item.ext !== ext;
      });
      return (filtered.length >= 6 ? filtered : allImageFormats).slice(0, 8).map(item => ({
        id: item.id,
        label: item.label,
        type: 'format' as const,
        iconName: 'Image',
      }));
    }

    case 'document':
      return [
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File' },
        { id: 'fmt-docx', label: 'DOCX', type: 'format', iconName: 'FileText' },
        { id: 'fmt-jpg', label: 'JPG', type: 'format', iconName: 'Image' },
        { id: 'fmt-png', label: 'PNG', type: 'format', iconName: 'Image' },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileCode' },
        { id: 'fmt-html', label: 'HTML', type: 'format', iconName: 'Code' },
        { id: 'fmt-md', label: 'MD', type: 'format', iconName: 'FileEdit' },
        { id: 'fmt-epub', label: 'EPUB', type: 'format', iconName: 'Book' },
      ];

    case 'video':
      return [
        { id: 'fmt-mp4', label: 'MP4', type: 'format', iconName: 'Film' },
        { id: 'fmt-gif', label: 'GIF', type: 'format', iconName: 'Image' },
        { id: 'fmt-mp3', label: 'MP3', type: 'format', iconName: 'Music' },
        { id: 'fmt-webm', label: 'WEBM', type: 'format', iconName: 'Video' },
        { id: 'fmt-mov', label: 'MOV', type: 'format', iconName: 'Film' },
      ];

    case 'audio':
      return [
        { id: 'fmt-mp3', label: 'MP3', type: 'format', iconName: 'Music' },
        { id: 'fmt-wav', label: 'WAV', type: 'format', iconName: 'Volume2' },
        { id: 'fmt-flac', label: 'FLAC', type: 'format', iconName: 'Headphones' },
        { id: 'fmt-aac', label: 'AAC', type: 'format', iconName: 'Radio' },
        { id: 'fmt-ogg', label: 'OGG', type: 'format', iconName: 'Disc' },
      ];

    case 'archive':
      return [
        { id: 'fmt-xlsx', label: 'XLSX', type: 'format', iconName: 'Table' },
        { id: 'fmt-csv', label: 'CSV', type: 'format', iconName: 'FileSpreadsheet' },
        { id: 'fmt-json', label: 'JSON', type: 'format', iconName: 'Code' },
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File' },
        { id: 'fmt-zip', label: 'ZIP', type: 'format', iconName: 'Archive' },
      ];

    default:
      return [
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File' },
        { id: 'fmt-zip', label: 'ZIP', type: 'format', iconName: 'Archive' },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileText' },
      ];
  }
}
