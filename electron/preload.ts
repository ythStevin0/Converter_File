import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  convertFile: (request: any) => ipcRenderer.invoke('convert-file', request),
  openInFolder: (filePath: string) => ipcRenderer.invoke('open-in-folder', filePath),
  hideWindow: () => ipcRenderer.send('hide-window'),
  showWindow: () => ipcRenderer.send('show-window'),
  saveBase64Image: (request: any) => ipcRenderer.invoke('save-base64-image', request),
  compressImage: (request: any) => ipcRenderer.invoke('compress-image', request),
  getMetadata: (filePath: string) => ipcRenderer.invoke('get-metadata', filePath),
  stripMetadata: (filePath: string) => ipcRenderer.invoke('strip-metadata', filePath),
  readFileBase64: (filePath: string) => ipcRenderer.invoke('read-file-base64', filePath),
  onFileDropTrigger: (callback: (fileInfo: any) => void) => {
    ipcRenderer.on('file-drop-trigger', (_event, value) => callback(value));
  },
});
