export type FileCategory = 
  | 'image' 
  | 'pdf' 
  | 'document' 
  | 'video' 
  | 'audio' 
  | 'archive' 
  | 'unknown';

export type RadialItemType = 'format' | 'action' | 'web3';

export interface RadialSliceItem {
  id: string;
  label: string;
  type: RadialItemType;
  iconName?: string;
  description?: string;
}

export interface DroppedFileInfo {
  name: string;
  path: string;
  size: number;
  formattedSize: string;
  extension: string;
  category: FileCategory;
  file?: File;
  previewUrl?: string;
}

export type MenuRingMode = 'format' | 'quick-action';

export interface ConversionRequest {
  sourceFilePath: string;
  targetFormatOrAction: string;
  sourceCategory: FileCategory;
  file?: File;
}

export interface ConversionResponse {
  success: boolean;
  outputPath?: string;
  outputName?: string;
  downloadUrl?: string;
  error?: string;
}

export interface MetadataInfo {
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasAlpha?: boolean;
  fileSizeBytes?: number;
  formattedSize?: string;
  hasProfile?: boolean;
  exifTags?: Record<string, any>;
}

export interface ElectronAPI {
  convertFile: (request: ConversionRequest) => Promise<ConversionResponse>;
  openInFolder: (filePath: string) => Promise<void>;
  hideWindow: () => void;
  showWindow: () => void;
  minimizeWindow?: () => void;
  closeWindow?: () => void;
  saveBase64Image: (request: {
    sourceFilePath: string;
    base64Data: string;
    suffix: string;
    ext?: string;
  }) => Promise<ConversionResponse>;
  compressImage: (request: {
    sourceFilePath: string;
    quality: number;
  }) => Promise<ConversionResponse & { originalSize?: number; newSize?: number }>;
  getMetadata: (sourceFilePath: string) => Promise<{ success: boolean; data?: MetadataInfo; error?: string }>;
  stripMetadata: (sourceFilePath: string) => Promise<ConversionResponse>;
  readFileBase64: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  getFilePath?: (file: any) => string;
  onFileDropTrigger?: (callback: (fileInfo: DroppedFileInfo) => void) => void;
  loadPresetFile?: (presetName: string) => Promise<DroppedFileInfo>;
  selectFile?: () => Promise<DroppedFileInfo | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
