import { app, BrowserWindow, ipcMain, shell, Tray, Menu, screen, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sharp, { type FormatEnum } from 'sharp';
import { PDFDocument } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIN_W = 650;
const WIN_H = 700;
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp', '.gif'];
const IMG_QUALITY: Record<string, object> = { jpeg: { quality: 90 }, webp: { quality: 85 }, avif: { quality: 80 } };

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null; // harus disimpan di variabel agar tidak di-garbage-collect
let isQuitting = false;

// ---------- Helpers ----------

// Path file baru di folder yang sama dengan file sumber
const outPath = (src: string, suffix = '', ext = path.extname(src)) => {
  const { dir, name } = path.parse(src);
  return path.join(dir, `${name}${suffix}${ext}`);
};
const done = (outputPath: string) => ({ outputPath, outputName: path.basename(outputPath) });

// Bungkus handler IPC: otomatis { success: true, ...hasil } atau { success: false, error }
const handle = (channel: string, fn: (req: any) => Promise<object>) =>
  ipcMain.handle(channel, async (_event, req) => {
    try {
      return { success: true, ...(await fn(req)) };
    } catch (err: any) {
      console.error(`[${channel}]`, err);
      return { success: false, error: err.message || 'Unknown error' };
    }
  });

// BMP 24-bit top-down dari buffer RGB (3 channel), tanpa dependency tambahan
function encodeBmp(w: number, h: number, rgb: Buffer): Buffer {
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const buf = Buffer.alloc(54 + rowSize * h);
  buf.write('BM', 0);
  buf.writeUInt32LE(buf.length, 2);
  buf.writeUInt32LE(54, 10); // offset pixel data
  buf.writeUInt32LE(40, 14); // BITMAPINFOHEADER
  buf.writeInt32LE(w, 18);
  buf.writeInt32LE(-h, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(rowSize * h, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 3;
      const d = 54 + y * rowSize + x * 3;
      buf[d] = rgb[s + 2];
      buf[d + 1] = rgb[s + 1];
      buf[d + 2] = rgb[s];
    }
  }
  return buf;
}

// ---------- Window & Tray ----------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    center: true,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  }

  // Tombol close hanya menyembunyikan window (app tetap hidup di tray)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function showWindowAtCursor() {
  if (!mainWindow) return createWindow();

  const cursor = screen.getCursorScreenPoint();
  const { x, y, width, height } = screen.getDisplayNearestPoint(cursor).workArea;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

  mainWindow.setPosition(
    clamp(Math.round(cursor.x - WIN_W / 2), x, x + width - WIN_W),
    clamp(Math.round(cursor.y - WIN_H / 2), y, y + height - WIN_H),
  );
  mainWindow.show();
  mainWindow.focus();
}

const toggleWindow = () => (mainWindow?.isVisible() ? mainWindow.hide() : showWindowAtCursor());

function createTray() {
  tray = new Tray(path.join(__dirname, '../assets/tray.png'));
  tray.setToolTip('OrbitDrop — Contextual File Converter (Local Engine)');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Buka OrbitDrop', click: showWindowAtCursor },
      { label: 'Shortcut: Alt+Space', enabled: false },
      { type: 'separator' },
      { label: 'Keluar (Quit)', click: () => app.quit() },
    ]),
  );
  tray.on('click', toggleWindow);
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  globalShortcut.register('Alt+Space', toggleWindow);
  app.on('activate', showWindowAtCursor);
});

app.on('before-quit', () => {
  isQuitting = true;
});
app.on('will-quit', () => globalShortcut.unregisterAll());

// ---------- IPC: window ----------

ipcMain.on('hide-window', () => mainWindow?.hide());
ipcMain.on('show-window', () => mainWindow?.show());
ipcMain.handle('open-in-folder', async (_event, filePath: string) => {
  if (filePath) shell.showItemInFolder(filePath);
});

// ---------- IPC: file & image tools ----------

// Baca file sebagai data URL untuk preview di renderer
handle('read-file-base64', async (filePath: string) => {
  const ext = path.extname(filePath).slice(1).toLowerCase().replace('jpg', 'jpeg');
  const buf = await fs.readFile(filePath);
  return { dataUrl: `data:image/${ext};base64,${buf.toString('base64')}` };
});

// Simpan hasil edit dari modal (Crop, AddBG, Redact, Annotate)
handle('save-base64-image', async ({ sourceFilePath, base64Data, suffix, ext = 'png' }: {
  sourceFilePath: string;
  base64Data: string;
  suffix: string;
  ext?: string;
}) => {
  const out = outPath(sourceFilePath, ` ${suffix}`, `.${ext.replace(/^\./, '')}`);
  await fs.writeFile(out, Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  return done(out);
});

// Metadata file (+ info gambar via sharp)
handle('get-metadata', async (filePath: string) => {
  const { size } = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const data: Record<string, unknown> = {
    fileSizeBytes: size,
    formattedSize: (size / (1024 * 1024)).toFixed(2) + ' MB',
    format: ext.slice(1).toUpperCase(),
  };

  if (IMAGE_EXTS.includes(ext)) {
    const { format, width, height, space, channels, depth, density, hasAlpha, hasProfile, exif } =
      await sharp(filePath).metadata();
    Object.assign(data, {
      format: format?.toUpperCase(),
      width, height, space, channels, depth, density, hasAlpha, hasProfile,
      exifTags: exif ? { hasExif: true, bufferLength: exif.length } : undefined,
    });
  }
  return { data };
});

// Sharp otomatis membuang EXIF/XMP/IPTC selama .withMetadata() tidak dipanggil
handle('strip-metadata', async (filePath: string) => {
  const out = outPath(filePath, ' Clean');
  await sharp(filePath).toFile(out);
  return done(out);
});

handle('compress-image', async ({ sourceFilePath: src, quality = 65 }: {
  sourceFilePath: string;
  quality?: number;
}) => {
  const ext = path.extname(src).slice(1).toLowerCase();
  const out = outPath(src, ' Compressed');
  const img = sharp(src);

  if (ext === 'jpg' || ext === 'jpeg') img.jpeg({ quality, mozjpeg: true });
  else if (ext === 'webp') img.webp({ quality });
  else if (ext === 'avif') img.avif({ quality: Math.max(25, quality - 10) });
  else img.png({ compressionLevel: 9, quality: Math.min(100, quality + 10) });

  await img.toFile(out);
  return {
    ...done(out),
    originalSize: (await fs.stat(src)).size,
    newSize: (await fs.stat(out)).size,
  };
});

// ---------- IPC: konversi ----------

handle('convert-file', async ({ sourceFilePath: src, targetFormatOrAction, sourceCategory }: {
  sourceFilePath: string;
  targetFormatOrAction: string;
  sourceCategory: string;
}) => {
  const target = targetFormatOrAction.toLowerCase();
  const srcExt = path.extname(src).toLowerCase();
  const out = outPath(src, '', `.${target}`);

  // 1. Gambar
  if (sourceCategory === 'image') {
    const img = sharp(src);

    if (target === 'bmp') {
      const { data, info } = await img.removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
      await fs.writeFile(out, encodeBmp(info.width, info.height, data));
    } else if (target === 'pdf') {
      const pdf = await PDFDocument.create();
      const png = await pdf.embedPng(await img.png().toBuffer());
      pdf.addPage([png.width, png.height]).drawImage(png);
      await fs.writeFile(out, await pdf.save());
    } else {
      const fmt = ({ jpg: 'jpeg', tif: 'tiff' } as Record<string, string>)[target] ?? target;
      await img.toFormat(fmt as keyof FormatEnum, IMG_QUALITY[fmt]).toFile(out);
    }
    return done(out);
  }

  // 2. PDF -> TXT (ekstraksi sederhana)
  if (sourceCategory === 'pdf' && target === 'txt') {
    const content = (await fs.readFile(src)).toString('utf-8');
    const text = (content.match(/\((.*?)\)\s*Tj/g) || content.match(/\[(.*?)\]\s*TJ/g) || [])
      .map((m) => m.replace(/^[(\[]/, '').replace(/[)\]]\s*T[jJ]$/, ''))
      .join(' ');
    await fs.writeFile(out, text || `[OrbitDrop: tidak ada teks yang bisa diekstrak dari ${path.basename(src)}]`);
    return done(out);
  }

  // 3. CSV <-> JSON
  if (sourceCategory === 'archive' || sourceCategory === 'document') {
    if (srcExt === '.csv' && target === 'json') {
      const [head, ...lines] = (await fs.readFile(src, 'utf-8')).trim().split(/\r?\n/);
      const headers = head.split(',').map((h) => h.trim());
      const rows = lines.map((line) => {
        const vals = line.split(',');
        return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? '']));
      });
      await fs.writeFile(out, JSON.stringify(rows, null, 2));
      return done(out);
    }

    if (srcExt === '.json' && target === 'csv') {
      const data = JSON.parse(await fs.readFile(src, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const lines = data.map((row) => headers.map((h) => row[h] ?? '').join(','));
        await fs.writeFile(out, [headers.join(','), ...lines].join('\n'));
        return done(out);
      }
    }
  }

  // 4. Fallback (termasuk PDF->PDF dan TXT<->MD): salin dengan ekstensi baru
  await fs.copyFile(src, out);
  return done(out);
});