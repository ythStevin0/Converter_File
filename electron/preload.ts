import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  convertFile: (request: any) => ipcRenderer.invoke('convert-file', request),
  openInFolder: (filePath: string) => ipcRenderer.invoke('open-in-folder', filePath),
  hideWindow: () => ipcRenderer.send('hide-window'),
  showWindow: () => ipcRenderer.send('show-window'),
  onFileDropTrigger: (callback: (fileInfo: any) => void) => {
    ipcRenderer.on('file-drop-trigger', (_event, value) => callback(value));
  },
});
