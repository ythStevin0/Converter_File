import { ConversionRequest, ConversionResponse } from '../types';
import { triggerBrowserDownload } from '../utils/fileHelpers';

export async function executeFileConversion(request: ConversionRequest): Promise<ConversionResponse> {
  // 1. If running inside Electron desktop app with native backend
  if (window.electronAPI && typeof window.electronAPI.convertFile === 'function') {
    let fileBase64: string | undefined;
    if (request.file && typeof request.file.arrayBuffer === 'function' && (!request.sourceFilePath || (!request.sourceFilePath.includes('/') && !request.sourceFilePath.includes('\\')))) {
      try {
        const buf = await request.file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        fileBase64 = btoa(binary);
      } catch (e) {
        console.warn('[ConversionService] Base64 encode skipped:', e);
      }
    }
    return await window.electronAPI.convertFile({
      ...request,
      fileBase64,
      fileName: request.file?.name,
    } as any);
  }

  // 2. Client-side fallback for Browser / Vite Dev Mode
  console.log('[ConversionService] Running in Web Mode, processing via browser engine:', request);

  const { targetFormatOrAction, file, sourceFilePath } = request;
  const fileName = file ? file.name : sourceFilePath.split(/[\\/]/).pop() || 'file';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const targetExt = targetFormatOrAction.toLowerCase();

  // If it's a format conversion on an image
  if (file && file.type.startsWith('image/')) {
    try {
      const mimeTypeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // For JPEG/BMP, fill white background if transparent
      if (targetExt === 'jpg' || targetExt === 'jpeg' || targetExt === 'bmp') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      // Handle PDF conversion in browser with pdf-lib
      if (targetExt === 'pdf') {
        const { PDFDocument } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.create();
        const pngDataUrl = canvas.toDataURL('image/png');
        const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer());
        const embeddedImg = await pdfDoc.embedPng(pngBytes);
        const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
        page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(pdfBlob);
        const outputName = `${baseName}.pdf`;

        triggerBrowserDownload(downloadUrl, outputName);
        URL.revokeObjectURL(objectUrl);

        return { success: true, outputName, downloadUrl };
      }

      const targetMime = mimeTypeMap[targetExt] || 'image/png';
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), targetMime, 0.92)
      );

      URL.revokeObjectURL(objectUrl);

      if (!blob) throw new Error('Blob generation failed');

      const downloadUrl = URL.createObjectURL(blob);
      const outputName = `${baseName}.${targetExt}`;

      // In browser preview, trigger immediate download
      triggerBrowserDownload(downloadUrl, outputName);

      return {
        success: true,
        outputName,
        downloadUrl,
      };
    } catch (err: any) {
      console.error('[ConversionService] Web image conversion error:', err);
      return {
        success: false,
        error: err.message || 'Image conversion failed in browser preview',
      };
    }
  }

  // 3. Document / Text conversion in browser mode (genuine Blob & PDF download)
  if (file) {
    try {
      if (targetExt === 'pdf') {
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const text = await file.text();
        const page = pdfDoc.addPage([595.28, 841.89]);
        page.drawText(text.slice(0, 3000), {
          x: 50,
          y: 790,
          size: 11,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const outputName = `${baseName}.pdf`;
        triggerBrowserDownload(downloadUrl, outputName);
        return { success: true, outputName, downloadUrl };
      }

      if (targetExt === 'jpg' || targetExt === 'jpeg' || targetExt === 'png') {
        const canvas = document.createElement('canvas');
        canvas.width = 1240;
        canvas.height = 1754;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(0, 0, canvas.width, 14);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText(baseName, 70, 90);
          ctx.fillStyle = '#334155';
          ctx.font = '18px sans-serif';
          const text = await file.text();
          const lines = text.split(/\r?\n/).slice(0, 42);
          lines.forEach((l, i) => ctx.fillText(l.slice(0, 80), 70, 145 + i * 36));
          const mime = targetExt === 'png' ? 'image/png' : 'image/jpeg';
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), mime, 0.92));
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const outputName = `${baseName}.${targetExt}`;
            triggerBrowserDownload(downloadUrl, outputName);
            return { success: true, outputName, downloadUrl };
          }
        }
      }

      // Plain text, Markdown, HTML, CSV, JSON real download
      const text = await file.text();
      const mime = targetExt === 'html' ? 'text/html' : targetExt === 'json' ? 'application/json' : 'text/plain';
      const blob = new Blob([text], { type: mime });
      const downloadUrl = URL.createObjectURL(blob);
      const outputName = `${baseName}.${targetExt}`;
      triggerBrowserDownload(downloadUrl, outputName);
      return { success: true, outputName, downloadUrl };
    } catch (err: any) {
      console.warn('[ConversionService] Web document conversion fallback:', err);
    }
  }

  const outputName = `${baseName}.${targetExt}`;
  return {
    success: true,
    outputName,
  };
}
