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
  iconName: string;
  color: string;
  bgGradient: [string, string];
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

export interface ElectronAPI {
  convertFile: (request: ConversionRequest) => Promise<ConversionResponse>;
  saveFileDialog: (defaultName: string) => Promise<string | null>;
  openInFolder: (filePath: string) => Promise<void>;
  hideWindow: () => void;
  showWindow: () => void;
  onFileDropTrigger?: (callback: (fileInfo: DroppedFileInfo) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
