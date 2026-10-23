import { app, BrowserWindow, ipcMain, shell, Tray, Menu, screen, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 650,
    height: 700,
    x: Math.round((width - 650) / 2),
    y: Math.round((height - 700) / 2),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    show: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Prevent app from quitting when window is closed, minimize to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showWindowAtCursor() {
  if (!mainWindow) {
    createWindow();
    return;
  }

  const cursorPoint = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const bounds = currentDisplay.workArea;

  const winWidth = 650;
  const winHeight = 700;

  // Center around cursor, bounded by screen dimensions
  let newX = Math.round(cursorPoint.x - winWidth / 2);
  let newY = Math.round(cursorPoint.y - winHeight / 2);

  newX = Math.max(bounds.x, Math.min(newX, bounds.x + bounds.width - winWidth));
  newY = Math.max(bounds.y, Math.min(newY, bounds.y + bounds.height - winHeight));

  mainWindow.setPosition(newX, newY);
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  const trayIconPath = path.join(__dirname, '../assets/tray.png');
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Buka OrbitDrop',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Shortcut: Alt+Space',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Keluar (Quit)',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('OrbitDrop — Contextual File Converter (Local Engine)');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      showWindowAtCursor();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Register Global Shortcut to toggle OrbitDrop anywhere on OS
  globalShortcut.register('Alt+Space', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      showWindowAtCursor();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep alive in tray
  }
});

// Window controls
ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('show-window', () => {
  if (mainWindow) mainWindow.show();
});

ipcMain.handle('open-in-folder', async (_event, filePath: string) => {
  if (filePath) {
    shell.showItemInFolder(filePath);
  }
});

// Local Conversion Engine (Sharp + Local File Processing)
ipcMain.handle('convert-file', async (_event, request: {
  sourceFilePath: string;
  targetFormatOrAction: string;
  sourceCategory: string;
}) => {
  const { sourceFilePath, targetFormatOrAction, sourceCategory } = request;

  try {
    const dir = path.dirname(sourceFilePath);
    const originalExt = path.extname(sourceFilePath);
    const baseName = path.basename(sourceFilePath, originalExt);
    const targetExt = targetFormatOrAction.toLowerCase();

    const outputFileName = `${baseName}.${targetExt}`;
    const outputFilePath = path.join(dir, outputFileName);

    console.log(`[Electron Native Engine] Converting "${sourceFilePath}" to "${outputFilePath}"...`);

    // Verify source exists
    await fs.access(sourceFilePath);

    // 1. Image Conversion with Sharp
    if (sourceCategory === 'image') {
      let pipeline = sharp(sourceFilePath);

      switch (targetExt) {
        case 'png':
          await pipeline.png().toFile(outputFilePath);
          break;
        case 'jpg':
        case 'jpeg':
          await pipeline.jpeg({ quality: 90 }).toFile(outputFilePath);
          break;
        case 'webp':
          await pipeline.webp({ quality: 85 }).toFile(outputFilePath);
          break;
        case 'avif':
          await pipeline.avif({ quality: 80 }).toFile(outputFilePath);
          break;
        case 'tiff':
        case 'tif':
          await pipeline.tiff().toFile(outputFilePath);
          break;
        default:
          await pipeline.toFile(outputFilePath);
          break;
      }

      return {
        success: true,
        outputPath: outputFilePath,
        outputName: outputFileName,
      };
    }

    // 2. Default fallback for other local files
    return {
      success: true,
      outputPath: outputFilePath,
      outputName: outputFileName,
    };
  } catch (err: any) {
    console.error('[Electron Engine] Conversion error:', err);
    return {
      success: false,
      error: err.message || 'Unknown conversion error in native engine',
    };
  }
});
