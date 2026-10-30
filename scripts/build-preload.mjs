import fs from 'fs';
import path from 'path';

const preloadContent = `const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  convertFile: (request) => ipcRenderer.invoke('convert-file', request),
  openInFolder: (filePath) => ipcRenderer.invoke('open-in-folder', filePath),
  hideWindow: () => ipcRenderer.send('hide-window'),
  showWindow: () => ipcRenderer.send('show-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  saveBase64Image: (request) => ipcRenderer.invoke('save-base64-image', request),
  compressImage: (request) => ipcRenderer.invoke('compress-image', request),
  getMetadata: (filePath) => ipcRenderer.invoke('get-metadata', filePath),
  stripMetadata: (filePath) => ipcRenderer.invoke('strip-metadata', filePath),
  readFileBase64: (filePath) => ipcRenderer.invoke('read-file-base64', filePath),
  getFilePath: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
      return file?.path || '';
    } catch {
      return file?.path || '';
    }
  },
  onFileDropTrigger: (callback) => {
    ipcRenderer.on('file-drop-trigger', (_event, value) => callback(value));
  },
  loadPresetFile: (presetName) => ipcRenderer.invoke('load-preset-file', presetName),
  selectFile: () => ipcRenderer.invoke('select-file'),
});
`;

const outDir = path.join(process.cwd(), 'dist-electron');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'preload.cjs'), preloadContent, 'utf8');
console.log('✓ Successfully generated dist-electron/preload.cjs (CommonJS)');
