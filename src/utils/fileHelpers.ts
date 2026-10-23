import { FileCategory, DroppedFileInfo } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase().replace(/^\./, '');
  
  if (ext === 'pdf') {
    return 'pdf';
  }
  
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'tiff', 'tif', 'avif', 'bmp', 'svg', 'gif'];
  if (imageExts.includes(ext)) {
    return 'image';
  }
  
  const docExts = ['docx', 'doc', 'txt', 'md', 'html', 'epub', 'rtf'];
  if (docExts.includes(ext)) {
    return 'document';
  }
  
  const videoExts = ['mp4', 'mov', 'mkv', 'avi', 'webm'];
  if (videoExts.includes(ext)) {
    return 'video';
  }
  
  const audioExts = ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac'];
  if (audioExts.includes(ext)) {
    return 'audio';
  }
  
  const archiveExts = ['csv', 'xlsx', 'json', 'zip', '7z', 'tar', 'gz'];
  if (archiveExts.includes(ext)) {
    return 'archive';
  }
  
  return 'unknown';
}

export function parseDroppedFile(file: File): DroppedFileInfo {
  const name = file.name;
  const extMatch = name.match(/\.([^.]+)$/);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
  const category = getFileCategory(ext);

  return {
    name,
    path: (file as any).path || file.name,
    size: file.size,
    formattedSize: formatFileSize(file.size),
    extension: ext,
    category,
    file,
  };
}
