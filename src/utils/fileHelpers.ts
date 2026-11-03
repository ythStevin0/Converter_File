import { useState, useEffect } from 'react';
import { FileCategory, DroppedFileInfo, ConversionResponse } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'tiff', 'tif', 'avif', 'bmp', 'svg', 'gif',
]);
const DOC_EXTENSIONS = new Set([
  'docx', 'doc', 'txt', 'md', 'html', 'epub', 'rtf',
]);
const VIDEO_EXTENSIONS = new Set([
  'mp4', 'mov', 'mkv', 'avi', 'webm',
]);
const AUDIO_EXTENSIONS = new Set([
  'mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac',
]);
const ARCHIVE_EXTENSIONS = new Set([
  'csv', 'xlsx', 'xls', 'json', 'zip', '7z', 'tar', 'gz',
]);

export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase().replace(/^\./, '');

  if (ext === 'pdf') {
    return 'pdf';
  }
  if (IMAGE_EXTENSIONS.has(ext)) {
    return 'image';
  }
  if (DOC_EXTENSIONS.has(ext)) {
    return 'document';
  }
  if (VIDEO_EXTENSIONS.has(ext)) {
    return 'video';
  }
  if (AUDIO_EXTENSIONS.has(ext)) {
    return 'audio';
  }
  if (ARCHIVE_EXTENSIONS.has(ext)) {
    return 'archive';
  }
  return 'unknown';
}

export function parseDroppedFile(file: File): DroppedFileInfo {
  const name = file.name;
  const extMatch = name.match(/\.([^.]+)$/);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
  const category = getFileCategory(ext);

  let realPath = '';
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.getFilePath === 'function') {
    try {
      realPath = window.electronAPI.getFilePath(file);
    } catch {
      realPath = (file as any)?.path || '';
    }
  } else {
    realPath = (file as any)?.path || '';
  }

  return {
    name,
    path: realPath || file.name,
    size: file.size,
    formattedSize: formatFileSize(file.size),
    extension: ext,
    category,
    file,
  };
}

export function triggerBrowserDownload(dataUrlOrBlobUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrlOrBlobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Custom hook to safely load file preview in both Web & Electron
export function useFilePreview(fileInfo: DroppedFileInfo): string {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function load() {
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

    load();
    return () => {
      active = false;
    };
  }, [fileInfo]);

  return imageSrc;
}

// Unified image save dispatcher: Electron IPC or browser download fallback
export async function saveEditedImage({
  fileInfo,
  dataUrl,
  suffix,
  ext = 'png',
  onSuccess,
  onClose,
}: {
  fileInfo: DroppedFileInfo;
  dataUrl: string;
  suffix: string;
  ext?: string;
  message?: string;
  onSuccess: (res: ConversionResponse) => void;
  onClose: () => void;
}): Promise<void> {
  const cleanExt = ext.replace(/^\./, '');
  const baseName = fileInfo.name.replace(/\.[^/.]+$/, '');
  const outputName = `${baseName}_${suffix}.${cleanExt}`;

  if (window.electronAPI && typeof window.electronAPI.saveBase64Image === 'function') {
    const res = await window.electronAPI.saveBase64Image({
      sourceFilePath: fileInfo.path,
      base64Data: dataUrl,
      suffix,
      ext: cleanExt,
    });
    if (res.success && res.outputPath) {
      onSuccess({
        success: true,
        outputPath: res.outputPath,
        outputName: res.outputName || outputName,
      });
      onClose();
      return;
    }
  }

  // Web fallback
  triggerBrowserDownload(dataUrl, outputName);
  onSuccess({
    success: true,
    outputName,
    downloadUrl: dataUrl,
  });
  onClose();
}
