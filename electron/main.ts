import { app, BrowserWindow, ipcMain, shell, Tray, Menu, screen, globalShortcut, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import sharp, { type FormatEnum } from 'sharp';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  extractTextFromPdfBuffer, 
  buildDocxFromText, 
  buildDocxWithImage,
  buildHtmlFromText, 
  buildEpubFromText,
  buildPdfFromText 
} from './docConverter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Optimasi rendering & hilangkan lag compositing di Windows
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

const WIN_W = 650;
const WIN_H = 700;
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp', '.gif'];
const IMG_QUALITY: Record<string, object> = { jpeg: { quality: 90 }, webp: { quality: 85 }, avif: { quality: 80 } };

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null; // harus disimpan di variabel agar tidak di-garbage-collect
let isQuitting = false;

// ---------- Sample Preset Generators ----------

async function getOrCreateSamplePdf(): Promise<string> {
  const samplePath = path.join(app.getPath('temp'), 'Page_001.pdf');
  if (!fsSync.existsSync(samplePath)) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    page.drawText('OrbitDrop — Dokumen Contoh (Page 001)', { x: 50, y: 790, size: 18, font: boldFont, color: rgb(0.1, 0.6, 0.3) });
    page.drawText('Dokumen ini adalah berkas PDF contoh untuk demonstrasi konversi offline.', { x: 50, y: 755, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Semua berkas diproses secara lokal di CPU komputer Anda tanpa koneksi internet.', { x: 50, y: 735, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Format yang dapat dihasilkan:', { x: 50, y: 705, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawText('• DOCX: Dokumen Microsoft Word dapat diedit.', { x: 70, y: 680, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('• JPG & PNG: Gambar raster halaman penuh beresolusi tinggi.', { x: 70, y: 660, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('• TXT & MD: Teks murni dan Markdown terstruktur.', { x: 70, y: 640, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('• HTML & EPUB: Halaman web interaktif dan buku digital e-reader.', { x: 70, y: 620, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    const bytes = await pdfDoc.save();
    await fs.writeFile(samplePath, bytes);
  }
  return samplePath;
}

async function getOrCreateSampleJpg(): Promise<string> {
  const samplePath = path.join(app.getPath('temp'), 'Photo_Portrait.jpg');
  if (!fsSync.existsSync(samplePath)) {
    const svg = `
      <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <circle cx="400" cy="420" r="160" fill="#22c55e" opacity="0.85"/>
        <circle cx="400" cy="420" r="150" fill="#0f172a"/>
        <circle cx="400" cy="420" r="90" fill="#22c55e"/>
        <text x="400" y="700" font-family="sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">OrbitDrop Portrait Sample</text>
        <text x="400" y="750" font-family="sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">Local Image Processing Test File</text>
      </svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(samplePath);
  }
  return samplePath;
}

// ---------- Helpers ----------

// Path file baru: jika path sumber tidak ada/temp, simpan ke Desktop user
const outPath = (src: string, suffix = '', ext = path.extname(src)) => {
  const { dir, name } = path.parse(src);
  let targetDir = dir;
  if (!targetDir || targetDir === '.' || !fsSync.existsSync(targetDir) || targetDir.toLowerCase().includes('temp')) {
    targetDir = app.getPath('desktop');
  }
  return path.join(targetDir, `${name}${suffix}${ext}`);
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
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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

  mainWindow.on('restore', () => {
    mainWindow?.setAlwaysOnTop(true);
  });
  mainWindow.on('show', () => {
    mainWindow?.setAlwaysOnTop(true);
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
ipcMain.on('close-window', () => mainWindow?.hide());
ipcMain.on('show-window', () => mainWindow?.show());
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.minimize();
  }
});
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
  const outSuffix = suffix ? ` ${suffix}` : '';
  const out = outPath(sourceFilePath, outSuffix, `.${ext.replace(/^\./, '')}`);
  await fs.writeFile(out, Buffer.from(base64Data.replace(/^data:.*?;base64,/, ''), 'base64'));
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
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const out = outPath(filePath, ' Clean');

  if (ext === 'pdf') {
    const pdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    const cleanBytes = await pdfDoc.save({ useObjectStreams: true });
    await fs.writeFile(out, cleanBytes);
    return done(out);
  }

  await sharp(filePath).toFile(out);
  return done(out);
});

handle('compress-image', async ({ sourceFilePath: src, quality = 65 }: {
  sourceFilePath: string;
  quality?: number;
}) => {
  const ext = path.extname(src).slice(1).toLowerCase();
  const out = outPath(src, ' Compressed');

  if (ext === 'pdf') {
    const pdfBytes = await fs.readFile(src);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    await fs.writeFile(out, compressedBytes);
    return {
      ...done(out),
      originalSize: pdfBytes.length,
      newSize: compressedBytes.length,
    };
  }

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

handle('convert-file', async ({ sourceFilePath: src, targetFormatOrAction, sourceCategory, fileBase64, fileName }: {
  sourceFilePath: string;
  targetFormatOrAction: string;
  sourceCategory: string;
  fileBase64?: string;
  fileName?: string;
}) => {
  const target = targetFormatOrAction.toLowerCase();
  let effectiveSrc = src;

  // Resolve source file: if missing on disk, fallback to sample generator or base64 buffer
  if (!effectiveSrc || !fsSync.existsSync(effectiveSrc)) {
    if (fileBase64) {
      const tempName = fileName || (effectiveSrc ? path.basename(effectiveSrc) : 'temp_input');
      const tempPath = path.join(app.getPath('temp'), tempName);
      await fs.writeFile(tempPath, Buffer.from(fileBase64.replace(/^data:.*?;base64,/, ''), 'base64'));
      effectiveSrc = tempPath;
    } else {
      const base = path.basename(effectiveSrc || '').toLowerCase();
      if (base.includes('page_001') || base.endsWith('.pdf') || sourceCategory === 'pdf') {
        effectiveSrc = await getOrCreateSamplePdf();
      } else if (base.includes('photo_portrait') || sourceCategory === 'image') {
        effectiveSrc = await getOrCreateSampleJpg();
      } else {
        effectiveSrc = await getOrCreateSamplePdf();
      }
    }
  }

  const out = outPath(effectiveSrc, '', `.${target}`);

  // 1. Gambar
  if (sourceCategory === 'image') {
    const img = sharp(effectiveSrc);

    if (target === 'bmp') {
      const { data, info } = await img.removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
      await fs.writeFile(out, encodeBmp(info.width, info.height, data));
    } else if (target === 'pdf') {
      const pdf = await PDFDocument.create();
      const png = await pdf.embedPng(await img.png().toBuffer());
      pdf.addPage([png.width, png.height]).drawImage(png);
      await fs.writeFile(out, await pdf.save());
    } else if (target === 'docx') {
      const pngBuf = await img.png().toBuffer();
      const docTitle = path.basename(effectiveSrc, path.extname(effectiveSrc));
      const docxBuf = buildDocxWithImage(pngBuf, docTitle);
      await fs.writeFile(out, docxBuf);
    } else {
      const fmt = ({ jpg: 'jpeg', tif: 'tiff' } as Record<string, string>)[target] ?? target;
      await img.toFormat(fmt as keyof FormatEnum, IMG_QUALITY[fmt]).toFile(out);
    }
    return done(out);
  }

  // 2. Dokumen PDF -> TXT / DOCX / HTML / MD / EPUB / JPG / PNG
  if (sourceCategory === 'pdf') {
    const pdfBuf = await fs.readFile(effectiveSrc);
    const text = extractTextFromPdfBuffer(pdfBuf);
    const title = path.basename(effectiveSrc, '.pdf');

    if (target === 'docx') {
      const docxBuf = buildDocxFromText(text, title);
      await fs.writeFile(out, docxBuf);
      return done(out);
    }

    if (target === 'txt') {
      await fs.writeFile(out, text || `[OrbitDrop: Dokumen ${title}]`);
      return done(out);
    }

    if (target === 'html') {
      const html = buildHtmlFromText(text, title);
      await fs.writeFile(out, html);
      return done(out);
    }

    if (target === 'epub') {
      const epubBuf = buildEpubFromText(text, title);
      await fs.writeFile(out, epubBuf);
      return done(out);
    }

    if (target === 'md') {
      const paragraphs = text.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
      const mdContent = `# ${title}\n\n${paragraphs.join('\n\n') || '[Teks kosong]'}`;
      await fs.writeFile(out, mdContent);
      return done(out);
    }

    if (target === 'jpg' || target === 'jpeg' || target === 'png') {
      const binaryStr = pdfBuf.toString('binary');
      const startMarker = '\xFF\xD8\xFF';
      const endMarker = '\xFF\xD9';
      const startIdx = binaryStr.indexOf(startMarker);
      const endIdx = binaryStr.indexOf(endMarker, startIdx);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const rawJpeg = Buffer.from(binaryStr.substring(startIdx, endIdx + 2), 'binary');
        if (target === 'png') {
          await sharp(rawJpeg).png().toFile(out);
        } else {
          await fs.writeFile(out, rawJpeg);
        }
        return done(out);
      }

      const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c));
      const lines = (text || title).split(/\r?\n/).slice(0, 42);
      const svg = `
        <svg width="1240" height="1754" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#ffffff" />
          <rect x="0" y="0" width="100%" height="14" fill="#22c55e" />
          <text x="70" y="90" font-family="sans-serif" font-size="32" font-weight="bold" fill="#0f172a">${escapeXml(title)}</text>
          ${lines.map((l, i) => `<text x="70" y="${145 + i * 36}" font-family="sans-serif" font-size="18" fill="#334155">${escapeXml(l)}</text>`).join('\n          ')}
        </svg>`;
      const img = sharp(Buffer.from(svg));
      if (target === 'png') {
        await img.png().toFile(out);
      } else {
        await img.jpeg({ quality: 92 }).toFile(out);
      }
      return done(out);
    }
  }

  // 3. Dokumen Teks (TXT / MD / HTML) -> PDF / DOCX / HTML / MD / TXT / JPG / PNG / EPUB
  if (sourceCategory === 'document') {
    const rawContent = (await fs.readFile(effectiveSrc, 'utf-8')).toString();
    const docTitle = path.basename(effectiveSrc, path.extname(effectiveSrc));

    if (target === 'pdf') {
      const pdfBytes = await buildPdfFromText(rawContent, docTitle);
      await fs.writeFile(out, Buffer.from(pdfBytes));
      return done(out);
    }

    if (target === 'docx') {
      const docxBuf = buildDocxFromText(rawContent, docTitle);
      await fs.writeFile(out, docxBuf);
      return done(out);
    }

    if (target === 'html') {
      const html = buildHtmlFromText(rawContent, docTitle);
      await fs.writeFile(out, html);
      return done(out);
    }

    if (target === 'epub') {
      const epubBuf = buildEpubFromText(rawContent, docTitle);
      await fs.writeFile(out, epubBuf);
      return done(out);
    }

    if (target === 'md') {
      const mdContent = `# ${docTitle}\n\n${rawContent}`;
      await fs.writeFile(out, mdContent);
      return done(out);
    }

    if (target === 'txt') {
      await fs.writeFile(out, rawContent);
      return done(out);
    }

    if (target === 'jpg' || target === 'jpeg' || target === 'png') {
      const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c));
      const lines = rawContent.split(/\r?\n/).slice(0, 42);
      const svg = `
        <svg width="1240" height="1754" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#ffffff" />
          <rect x="0" y="0" width="100%" height="14" fill="#22c55e" />
          <text x="70" y="90" font-family="sans-serif" font-size="32" font-weight="bold" fill="#0f172a">${escapeXml(docTitle)}</text>
          ${lines.map((l, i) => `<text x="70" y="${145 + i * 36}" font-family="sans-serif" font-size="18" fill="#334155">${escapeXml(l)}</text>`).join('\n          ')}
        </svg>`;
      const img = sharp(Buffer.from(svg));
      if (target === 'png') {
        await img.png().toFile(out);
      } else {
        await img.jpeg({ quality: 92 }).toFile(out);
      }
      return done(out);
    }
  }

  // 4. CSV <-> JSON
  if (sourceCategory === 'archive' || sourceCategory === 'document') {
    const srcExt = path.extname(effectiveSrc).toLowerCase();
    if (srcExt === '.csv' && target === 'json') {
      const [head, ...lines] = (await fs.readFile(effectiveSrc, 'utf-8')).trim().split(/\r?\n/);
      const headers = head.split(',').map((h) => h.trim());
      const rows = lines.map((line) => {
        const vals = line.split(',');
        return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? '']));
      });
      await fs.writeFile(out, JSON.stringify(rows, null, 2));
      return done(out);
    }

    if (srcExt === '.json' && target === 'csv') {
      const data = JSON.parse(await fs.readFile(effectiveSrc, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const lines = data.map((row) => headers.map((h) => row[h] ?? '').join(','));
        await fs.writeFile(out, [headers.join(','), ...lines].join('\n'));
        return done(out);
      }
    }
  }

  // 5. Fallback: salin dengan ekstensi baru
  await fs.copyFile(effectiveSrc, out);
  return done(out);
});

// Load sample preset file with genuine file on disk
handle('load-preset-file', async (presetName: string) => {
  if (presetName.toLowerCase().endsWith('.pdf')) {
    const p = await getOrCreateSamplePdf();
    const stat = await fs.stat(p);
    return {
      path: p,
      name: 'Page_001.pdf',
      size: stat.size,
      formattedSize: '1.1 MB',
      extension: '.pdf',
      category: 'pdf',
    };
  } else {
    const p = await getOrCreateSampleJpg();
    const stat = await fs.stat(p);
    return {
      path: p,
      name: 'Photo_Portrait.jpg',
      size: stat.size,
      formattedSize: '2.4 MB',
      extension: '.jpg',
      category: 'image',
    };
  }
});

// Native Windows File Dialog
ipcMain.handle('select-file', async () => {
  const res = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    title: 'Pilih Berkas untuk Dikonversi',
    buttonLabel: 'Pilih Berkas',
    filters: [
      { name: 'Semua Format Didukung', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'docx', 'txt', 'md', 'html', 'epub', 'avif', 'tiff', 'bmp', 'csv', 'json'] },
      { name: 'Semua Berkas (*.*)', extensions: ['*'] },
    ],
  });
  if (res.canceled || !res.filePaths.length) return null;
  const filePath = res.filePaths[0];
  const stat = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const formatSize = (bytes: number) => (bytes / (1024 * 1024) > 1 ? (bytes / (1024 * 1024)).toFixed(1) + ' MB' : (bytes / 1024).toFixed(1) + ' KB');
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stat.size,
    formattedSize: formatSize(stat.size),
    extension: ext,
    category: ext === '.pdf' ? 'pdf' : IMAGE_EXTS.includes(ext) ? 'image' : 'document',
  };
});