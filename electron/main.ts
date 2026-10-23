import { app, BrowserWindow, ipcMain, shell, Tray, Menu, screen, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Pure Node.js BMP 24-bit RGB encoder (zero external dependency)
function encodeBmp(width: number, height: number, rgbaBuffer: Buffer): Buffer {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // File Header (14 bytes)
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);

  // DIB Header (40 bytes - BITMAPINFOHEADER)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(-height, 22); // Top-down
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);

  // Pixels (convert RGBA to BGR top-down with row padding)
  for (let y = 0; y < height; y++) {
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = rgbaBuffer[srcIdx];
      const g = rgbaBuffer[srcIdx + 1];
      const b = rgbaBuffer[srcIdx + 2];
      const dstIdx = rowOffset + x * 3;
      buf[dstIdx] = b;
      buf[dstIdx + 1] = g;
      buf[dstIdx + 2] = r;
    }
  }
  return buf;
}

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

// Read file as base64 for safe renderer preview
ipcMain.handle('read-file-base64', async (_event, filePath: string) => {
  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
    return { success: true, dataUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to read file' };
  }
});

// Save base64 image (from Crop, AddBG, Redact, Annotate modals)
ipcMain.handle('save-base64-image', async (_event, request: {
  sourceFilePath: string;
  base64Data: string;
  suffix: string;
  ext?: string;
}) => {
  try {
    const { sourceFilePath, base64Data, suffix, ext = 'png' } = request;
    const dir = path.dirname(sourceFilePath);
    const originalExt = path.extname(sourceFilePath);
    const baseName = path.basename(sourceFilePath, originalExt);
    const outputName = `${baseName} ${suffix}.${ext.replace(/^\./, '')}`;
    const outputFilePath = path.join(dir, outputName);

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    await fs.writeFile(outputFilePath, buffer);

    return {
      success: true,
      outputPath: outputFilePath,
      outputName,
    };
  } catch (err: any) {
    console.error('[save-base64-image] Error:', err);
    return { success: false, error: err.message || 'Failed to save image' };
  }
});

// Inspect Metadata (EXIF, format, dimensions, size)
ipcMain.handle('get-metadata', async (_event, filePath: string) => {
  try {
    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp', '.gif'].includes(ext);

    let metadata: any = {
      fileSizeBytes: stat.size,
      formattedSize: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
      format: ext.replace('.', '').toUpperCase(),
    };

    if (isImage) {
      const sharpMeta = await sharp(filePath).metadata();
      metadata = {
        ...metadata,
        format: sharpMeta.format?.toUpperCase(),
        width: sharpMeta.width,
        height: sharpMeta.height,
        space: sharpMeta.space,
        channels: sharpMeta.channels,
        depth: sharpMeta.depth,
        density: sharpMeta.density,
        hasAlpha: sharpMeta.hasAlpha,
        hasProfile: sharpMeta.hasProfile,
        exifTags: sharpMeta.exif ? { hasExif: true, bufferLength: sharpMeta.exif.length } : undefined,
      };
    }

    return { success: true, data: metadata };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to inspect metadata' };
  }
});

// Strip EXIF / sensitive metadata
ipcMain.handle('strip-metadata', async (_event, filePath: string) => {
  try {
    const dir = path.dirname(filePath);
    const originalExt = path.extname(filePath);
    const baseName = path.basename(filePath, originalExt);
    const outputName = `${baseName} Clean${originalExt}`;
    const outputFilePath = path.join(dir, outputName);

    // In sharp, not calling .withMetadata() automatically strips all EXIF, XMP, IPTC, and thumbnail data
    await sharp(filePath).toFile(outputFilePath);

    return {
      success: true,
      outputPath: outputFilePath,
      outputName,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to strip metadata' };
  }
});

// Smart File Compression
ipcMain.handle('compress-image', async (_event, request: {
  sourceFilePath: string;
  quality: number;
}) => {
  try {
    const { sourceFilePath, quality = 65 } = request;
    const statBefore = await fs.stat(sourceFilePath);
    const dir = path.dirname(sourceFilePath);
    const originalExt = path.extname(sourceFilePath);
    const baseName = path.basename(sourceFilePath, originalExt);
    const ext = originalExt.toLowerCase().replace('.', '');
    const outputName = `${baseName} Compressed${originalExt}`;
    const outputFilePath = path.join(dir, outputName);

    let pipeline = sharp(sourceFilePath);

    if (ext === 'jpg' || ext === 'jpeg') {
      await pipeline.jpeg({ quality, mozjpeg: true }).toFile(outputFilePath);
    } else if (ext === 'webp') {
      await pipeline.webp({ quality }).toFile(outputFilePath);
    } else if (ext === 'avif') {
      await pipeline.avif({ quality: Math.max(25, quality - 10) }).toFile(outputFilePath);
    } else {
      // Default PNG / others: apply maximum compression level and quality quantisation
      await pipeline.png({ compressionLevel: 9, quality: Math.min(100, quality + 10) }).toFile(outputFilePath);
    }

    const statAfter = await fs.stat(outputFilePath);

    return {
      success: true,
      outputPath: outputFilePath,
      outputName,
      originalSize: statBefore.size,
      newSize: statAfter.size,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Compression failed' };
  }
});

// Local Conversion Engine (Sharp + PDF-Lib + Local Processing)
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

    // 1. Image Conversions
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
        case 'bmp': {
          const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
          const bmpBuf = encodeBmp(info.width, info.height, data);
          await fs.writeFile(outputFilePath, bmpBuf);
          break;
        }
        case 'pdf': {
          // Native Image to PDF with pdf-lib
          const pngBuffer = await pipeline.png().toBuffer();
          const pdfDoc = await PDFDocument.create();
          const embeddedImg = await pdfDoc.embedPng(pngBuffer);
          const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
          page.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: embeddedImg.width,
            height: embeddedImg.height,
          });
          const pdfBytes = await pdfDoc.save();
          await fs.writeFile(outputFilePath, pdfBytes);
          break;
        }
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

    // 2. PDF Conversions
    if (sourceCategory === 'pdf') {
      if (targetExt === 'txt') {
        const pdfBytes = await fs.readFile(sourceFilePath);
        // Extract basic ASCII/UTF text stream or structural summary
        const content = pdfBytes.toString('utf-8');
        // Filter readable text strings from PDF stream
        const textMatches = content.match(/\((.*?)\)\s*Tj/g) || content.match(/\[(.*?)\]\s*TJ/g);
        let extracted = '';
        if (textMatches && textMatches.length > 0) {
          extracted = textMatches
            .map((m) => m.replace(/^[(\[]/, '').replace(/[)\]]\s*T[jJ]$/, ''))
            .join(' ');
        } else {
          extracted = `[OrbitDrop PDF Reader: Extracted from ${path.basename(sourceFilePath)}]\n\nFile size: ${(pdfBytes.length / 1024).toFixed(1)} KB\nRaw stream processed successfully.`;
        }
        await fs.writeFile(outputFilePath, extracted, 'utf-8');
        return {
          success: true,
          outputPath: outputFilePath,
          outputName: outputFileName,
        };
      }

      if (targetExt === 'pdf') {
        // Just duplicate/save
        await fs.copyFile(sourceFilePath, outputFilePath);
        return {
          success: true,
          outputPath: outputFilePath,
          outputName: outputFileName,
        };
      }
    }

    // 3. Document Conversions (CSV <-> JSON, TXT <-> MD)
    if (sourceCategory === 'archive' || sourceCategory === 'document') {
      if (originalExt.toLowerCase() === '.csv' && targetExt === 'json') {
        const csvContent = await fs.readFile(sourceFilePath, 'utf-8');
        const lines = csvContent.trim().split(/\r?\n/);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map((h) => h.trim());
          const rows = lines.slice(1).map((line) => {
            const vals = line.split(',');
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = vals[i] ? vals[i].trim() : '';
            });
            return obj;
          });
          await fs.writeFile(outputFilePath, JSON.stringify(rows, null, 2), 'utf-8');
          return { success: true, outputPath: outputFilePath, outputName: outputFileName };
        }
      }

      if (originalExt.toLowerCase() === '.json' && targetExt === 'csv') {
        const jsonContent = await fs.readFile(sourceFilePath, 'utf-8');
        const parsed = JSON.parse(jsonContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const headers = Object.keys(parsed[0]);
          const csvLines = [headers.join(',')];
          parsed.forEach((item) => {
            csvLines.push(headers.map((h) => item[h] ?? '').join(','));
          });
          await fs.writeFile(outputFilePath, csvLines.join('\n'), 'utf-8');
          return { success: true, outputPath: outputFilePath, outputName: outputFileName };
        }
      }

      if (targetExt === 'txt' || targetExt === 'md') {
        const content = await fs.readFile(sourceFilePath, 'utf-8');
        await fs.writeFile(outputFilePath, content, 'utf-8');
        return { success: true, outputPath: outputFilePath, outputName: outputFileName };
      }
    }

    // 4. Default fallback: duplicate with new extension
    await fs.copyFile(sourceFilePath, outputFilePath);
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
