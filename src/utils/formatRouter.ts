import { FileCategory, RadialSliceItem } from '../types';

export const QUICK_ACTIONS_SLICES: RadialSliceItem[] = [
  {
    id: 'crop',
    label: 'CROP',
    type: 'action',
    iconName: 'Crop',
    speed: '0.06 detik',
    outputSize: '780 KB',
    description: 'Potong rasio piksel presisi',
  },
  {
    id: 'add-bg',
    label: 'ADD BG',
    type: 'action',
    iconName: 'Palette',
    speed: '0.10 detik',
    outputSize: '950 KB',
    description: 'Beri latar belakang kanvas & padding',
  },
  {
    id: 'compress',
    label: 'COMPRESS',
    type: 'action',
    iconName: 'Minimize2',
    speed: '0.08 detik',
    outputSize: '320 KB',
    description: 'Kompresi ukuran berkas tanpa merusak kualitas',
  },
  {
    id: 'metadata',
    label: 'METADATA',
    type: 'action',
    iconName: 'Info',
    speed: '0.03 detik',
    outputSize: '1.1 MB',
    description: 'Bersihkan jejak EXIF & metadata tersembunyi',
  },
  {
    id: 'redact',
    label: 'REDACT',
    type: 'action',
    iconName: 'EyeOff',
    speed: '0.09 detik',
    outputSize: '1.1 MB',
    description: 'Sensor teks atau area sensitif berkas',
  },
  {
    id: 'annotate',
    label: 'ANNOTATE',
    type: 'action',
    iconName: 'PenTool',
    speed: '0.05 detik',
    outputSize: '1.1 MB',
    description: 'Coretan cepat, panah & catatan teks',
  },
  {
    id: 'checksum',
    label: 'CHECKSUM',
    type: 'action',
    iconName: 'Hash',
    speed: '0.02 detik',
    outputSize: 'SHA-256',
    description: 'Hitung & salin SHA-256 Checksum integritas berkas',
  },
  {
    id: 'encrypt',
    label: 'ENCRYPT',
    type: 'action',
    iconName: 'Lock',
    speed: '0.11 detik',
    outputSize: '.locked',
    description: 'Enkripsi offline AES-256-GCM dengan kata sandi',
  },
];

export function getQuickActionSlicesForCategory(category: FileCategory): RadialSliceItem[] {
  switch (category) {
    case 'image':
      return QUICK_ACTIONS_SLICES;
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
        { id: 'fmt-docx', label: 'DOCX', type: 'format', iconName: 'FileText', speed: '0.14 detik', outputSize: '1.2 MB', description: 'Konversi teks dokumen Word berekstensi .docx' },
        { id: 'fmt-jpg', label: 'JPG', type: 'format', iconName: 'Image', speed: '0.09 detik', outputSize: '680 KB', description: 'Ekstrak tiap halaman PDF menjadi foto JPEG tajam' },
        { id: 'fmt-png', label: 'PNG', type: 'format', iconName: 'Image', speed: '0.11 detik', outputSize: '950 KB', description: 'Ekstrak halaman PDF ke format gambar PNG lossless' },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileCode', speed: '0.04 detik', outputSize: '45 KB', description: 'Ekstrak konten teks murni tanpa format' },
        { id: 'fmt-html', label: 'HTML', type: 'format', iconName: 'Code', speed: '0.08 detik', outputSize: '120 KB', description: 'Konversi struktur PDF ke halaman web HTML5' },
        { id: 'fmt-md', label: 'MD', type: 'format', iconName: 'FileEdit', speed: '0.05 detik', outputSize: '35 KB', description: 'Ekstrak teks ke format Markdown terstruktur' },
        { id: 'fmt-epub', label: 'EPUB', type: 'format', iconName: 'Book', speed: '0.12 detik', outputSize: '820 KB', description: 'Konversi buku digital e-reader EPUB' },
      ];

    case 'image': {
      const allImageFormats = [
        { id: 'fmt-png', label: 'PNG', ext: 'png', speed: '0.10 detik', outputSize: '920 KB' },
        { id: 'fmt-jpg', label: 'JPG', ext: 'jpg', speed: '0.08 detik', outputSize: '650 KB' },
        { id: 'fmt-webp', label: 'WEBP', ext: 'webp', speed: '0.07 detik', outputSize: '380 KB' },
        { id: 'fmt-avif', label: 'AVIF', ext: 'avif', speed: '0.15 detik', outputSize: '290 KB' },
        { id: 'fmt-tiff', label: 'TIFF', ext: 'tiff', speed: '0.12 detik', outputSize: '2.6 MB' },
        { id: 'fmt-bmp', label: 'BMP', ext: 'bmp', speed: '0.06 detik', outputSize: '3.1 MB' },
        { id: 'fmt-pdf', label: 'PDF', ext: 'pdf', speed: '0.09 detik', outputSize: '1.1 MB' },
        { id: 'fmt-docx', label: 'DOCX', ext: 'docx', speed: '0.13 detik', outputSize: '1.4 MB' },
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
        speed: item.speed,
        outputSize: item.outputSize,
      }));
    }

    case 'document':
      return [
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File', speed: '0.12 detik', outputSize: '1.1 MB' },
        { id: 'fmt-docx', label: 'DOCX', type: 'format', iconName: 'FileText', speed: '0.14 detik', outputSize: '1.2 MB' },
        { id: 'fmt-jpg', label: 'JPG', type: 'format', iconName: 'Image', speed: '0.09 detik', outputSize: '680 KB' },
        { id: 'fmt-png', label: 'PNG', type: 'format', iconName: 'Image', speed: '0.11 detik', outputSize: '950 KB' },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileCode', speed: '0.04 detik', outputSize: '45 KB' },
        { id: 'fmt-html', label: 'HTML', type: 'format', iconName: 'Code', speed: '0.08 detik', outputSize: '120 KB' },
        { id: 'fmt-md', label: 'MD', type: 'format', iconName: 'FileEdit', speed: '0.05 detik', outputSize: '35 KB' },
        { id: 'fmt-epub', label: 'EPUB', type: 'format', iconName: 'Book', speed: '0.12 detik', outputSize: '820 KB' },
      ];

    case 'video':
      return [
        { id: 'fmt-mp4', label: 'MP4', type: 'format', iconName: 'Film', speed: '0.35 detik', outputSize: '4.8 MB' },
        { id: 'fmt-gif', label: 'GIF', type: 'format', iconName: 'Image', speed: '0.18 detik', outputSize: '2.1 MB' },
        { id: 'fmt-mp3', label: 'MP3', type: 'format', iconName: 'Music', speed: '0.08 detik', outputSize: '1.5 MB' },
        { id: 'fmt-webm', label: 'WEBM', type: 'format', iconName: 'Video', speed: '0.28 detik', outputSize: '3.2 MB' },
        { id: 'fmt-mov', label: 'MOV', type: 'format', iconName: 'Film', speed: '0.32 detik', outputSize: '5.1 MB' },
      ];

    case 'audio':
      return [
        { id: 'fmt-mp3', label: 'MP3', type: 'format', iconName: 'Music', speed: '0.08 detik', outputSize: '3.2 MB' },
        { id: 'fmt-wav', label: 'WAV', type: 'format', iconName: 'Volume2', speed: '0.05 detik', outputSize: '15 MB' },
        { id: 'fmt-flac', label: 'FLAC', type: 'format', iconName: 'Headphones', speed: '0.12 detik', outputSize: '9.8 MB' },
        { id: 'fmt-aac', label: 'AAC', type: 'format', iconName: 'Radio', speed: '0.09 detik', outputSize: '2.8 MB' },
        { id: 'fmt-ogg', label: 'OGG', type: 'format', iconName: 'Disc', speed: '0.07 detik', outputSize: '3.0 MB' },
      ];

    case 'archive':
      return [
        { id: 'fmt-xlsx', label: 'XLSX', type: 'format', iconName: 'Table', speed: '0.09 detik', outputSize: '450 KB' },
        { id: 'fmt-csv', label: 'CSV', type: 'format', iconName: 'FileSpreadsheet', speed: '0.03 detik', outputSize: '120 KB' },
        { id: 'fmt-json', label: 'JSON', type: 'format', iconName: 'Code', speed: '0.02 detik', outputSize: '95 KB' },
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File', speed: '0.10 detik', outputSize: '850 KB' },
        { id: 'fmt-zip', label: 'ZIP', type: 'format', iconName: 'Archive', speed: '0.12 detik', outputSize: '2.3 MB' },
      ];

    default:
      return [
        { id: 'fmt-pdf', label: 'PDF', type: 'format', iconName: 'File', speed: '0.10 detik', outputSize: '1.1 MB' },
        { id: 'fmt-zip', label: 'ZIP', type: 'format', iconName: 'Archive', speed: '0.12 detik', outputSize: '2.3 MB' },
        { id: 'fmt-txt', label: 'TXT', type: 'format', iconName: 'FileText', speed: '0.04 detik', outputSize: '45 KB' },
      ];
  }
}
