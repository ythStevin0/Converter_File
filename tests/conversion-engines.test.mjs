/**
 * Automated Conversion Engines Verification Suite
 * Validates Sharp (Raster & Vector SVG), DocConverter (DOCX, HTML, EPUB, PDF), SheetJS (XLSX, CSV), and ZipArchive
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as XLSX from 'xlsx';
import { ZipArchive } from 'archiver';
import {
  buildDocxFromText,
  buildDocxWithImage,
  buildHtmlFromText,
  buildEpubFromText,
  buildPdfFromText,
} from '../dist-electron/docConverter.js';

// Minimal 24-bit uncompressed Windows BMP encoder
function encodeBmp(width, height, rawRgb) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const imageSize = rowSize * height;
  const fileSize = 54 + imageSize;
  const buf = Buffer.alloc(fileSize);

  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(imageSize, 34);

  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      buf[offset++] = rawRgb[srcIdx + 2]; // B
      buf[offset++] = rawRgb[srcIdx + 1]; // G
      buf[offset++] = rawRgb[srcIdx];     // R
    }
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      buf[offset++] = 0;
    }
  }
  return buf;
}

async function runEngineTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING ORBITDROP CONVERSION ENGINES TEST SUITE');
  console.log('======================================================\n');

  // 1. Sharp Image Conversions (SVG Vector, PNG, WEBP, AVIF, TIFF, BMP)
  {
    console.log('  [Test 1] Sharp Image Engine (Vector SVG to Raster PNG & Formats)...');
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <rect width="120" height="120" fill="#22c55e" rx="16"/>
      <circle cx="60" cy="60" r="30" fill="#0f172a"/>
    </svg>`;
    const svgBuffer = Buffer.from(svgData);

    // SVG -> PNG with 300 DPI density
    const pngBuffer = await sharp(svgBuffer, { density: 300 }).png().toBuffer();
    assert(pngBuffer.length > 500, 'PNG buffer should be generated from SVG');
    assert.equal(pngBuffer[0], 0x89, 'PNG magic byte 0 should be 0x89');
    assert.equal(pngBuffer[1], 0x50, 'PNG magic byte 1 should be P (0x50)');

    // PNG -> WEBP
    const webpBuffer = await sharp(pngBuffer).webp({ quality: 85 }).toBuffer();
    assert(webpBuffer.length > 200, 'WEBP buffer should be generated');
    assert.equal(webpBuffer.subarray(0, 4).toString(), 'RIFF', 'WEBP header should start with RIFF');

    // PNG -> AVIF
    const avifBuffer = await sharp(pngBuffer).avif({ quality: 80 }).toBuffer();
    assert(avifBuffer.length > 200, 'AVIF buffer should be generated');

    // PNG -> TIFF
    const tiffBuffer = await sharp(pngBuffer).tiff().toBuffer();
    assert(tiffBuffer.length > 500, 'TIFF buffer should be generated');

    // PNG -> BMP via encodeBmp
    const { data: rawRgb, info } = await sharp(pngBuffer)
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });
    const bmpBuffer = encodeBmp(info.width, info.height, rawRgb);
    assert.equal(bmpBuffer[0], 0x42, 'BMP magic byte 0 should be B');
    assert.equal(bmpBuffer[1], 0x4d, 'BMP magic byte 1 should be M');

    console.log('  ✓ Passed (SVG -> PNG, WEBP, AVIF, TIFF, BMP verified)');
  }

  // 2. DocConverter (DOCX, HTML, EPUB, PDF)
  {
    console.log('  [Test 2] DocConverter Document Engine (DOCX, HTML, EPUB, PDF)...');
    const sampleText = 'OrbitDrop High Performance Local Converter\nSemua berkas diproses 100% lokal di CPU pengguna.';

    // buildDocxFromText
    const docxBuf = buildDocxFromText(sampleText, 'Sample Document');
    assert(docxBuf.length > 500, 'DOCX buffer must be generated');
    assert.equal(docxBuf[0], 0x50, 'DOCX is a zip archive, byte 0 must be 0x50 (P)');
    assert.equal(docxBuf[1], 0x4b, 'DOCX is a zip archive, byte 1 must be 0x4B (K)');

    // buildDocxWithImage
    const dummyImage = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 34, g: 197, b: 94, alpha: 1 } },
    }).png().toBuffer();
    const docxImgBuf = buildDocxWithImage(dummyImage, 'Image Document');
    assert(docxImgBuf.length > 500, 'DOCX with image must be generated');

    // buildHtmlFromText
    const htmlString = buildHtmlFromText(sampleText, 'Sample Document');
    assert(htmlString.includes('<!DOCTYPE html>'), 'HTML output must contain DOCTYPE');
    assert(htmlString.includes('OrbitDrop High Performance'), 'HTML output must include text');

    // buildEpubFromText
    const epubBuf = buildEpubFromText(sampleText, 'Sample E-Book');
    assert(epubBuf.length > 500, 'EPUB buffer must be generated');
    assert.equal(epubBuf[0], 0x50, 'EPUB is a zip archive, byte 0 must be 0x50');

    // buildPdfFromText
    const pdfBuf = await buildPdfFromText(sampleText, 'Sample PDF');
    assert(pdfBuf.length > 500, 'PDF buffer must be generated');
    const pdfHeader = Buffer.from(pdfBuf).subarray(0, 4).toString('ascii');
    assert.equal(pdfHeader, '%PDF', 'PDF header must start with %PDF');

    console.log('  ✓ Passed (DOCX, HTML, EPUB, and PDF generation verified)');
  }

  // 3. SheetJS Spreadsheet Engine (JSON <-> XLSX, CSV)
  {
    console.log('  [Test 3] SheetJS Engine (JSON <-> XLSX, CSV)...');
    const tableData = [
      { ID: 1, Nama: 'OrbitDrop App', Kategori: 'Desktop', Status: 'Aktif' },
      { ID: 2, Nama: 'Converter Engine', Kategori: 'Core', Status: 'Aktif' },
      { ID: 3, Nama: 'Web3 Security', Kategori: 'Crypto', Status: 'Aktif' },
    ];

    // JSON -> XLSX
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    assert(xlsxBuffer.length > 1000, 'XLSX buffer must be generated');
    assert.equal(xlsxBuffer[0], 0x50, 'XLSX is an OPC zip archive, byte 0 must be 0x50');

    // XLSX -> Read back
    const readWb = XLSX.read(xlsxBuffer, { type: 'buffer' });
    const sheetName = readWb.SheetNames[0];
    const extractedJson = XLSX.utils.sheet_to_json(readWb.Sheets[sheetName]);
    assert.equal(extractedJson.length, 3, 'Extracted rows must match original 3 rows');
    assert.equal(extractedJson[0].Nama, 'OrbitDrop App', 'First row data must match');

    // JSON -> CSV
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    assert(csvContent.includes('Nama,Kategori,Status'), 'CSV must contain headers');
    assert(csvContent.includes('Converter Engine'), 'CSV must contain data values');

    console.log('  ✓ Passed (JSON <-> XLSX, CSV bidirectional conversion verified)');
  }

  // 4. ZipArchive Engine (Packaging & Verification)
  {
    console.log('  [Test 4] ZipArchive Engine (Packaging & Integrity)...');
    const tmpZipPath = path.join(process.cwd(), 'temp_test_orbitdrop.zip');
    const zip = new ZipArchive({ zlib: { level: 9 } });
    const outStream = fs.createWriteStream(tmpZipPath);

    await new Promise((resolve, reject) => {
      outStream.on('close', resolve);
      zip.on('error', reject);
      zip.pipe(outStream);
      zip.append('Halo OrbitDrop - Local Conversion Engine', { name: 'orbitdrop_readme.txt' });
      zip.append(JSON.stringify({ project: 'OrbitDrop', version: '1.0.0' }), { name: 'manifest.json' });
      zip.finalize().catch(reject);
    });

    const zipStat = fs.statSync(tmpZipPath);
    assert(zipStat.size > 100, 'ZIP file must be non-empty');
    const zipBytes = fs.readFileSync(tmpZipPath);
    assert.equal(zipBytes[0], 0x50, 'ZIP magic byte 0 must be P');
    assert.equal(zipBytes[1], 0x4b, 'ZIP magic byte 1 must be K');

    // Clean up
    fs.unlinkSync(tmpZipPath);
    console.log('  ✓ Passed (ZipArchive packaging & PK signature verified)');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 4 CONVERSION ENGINE TEST SUITES PASSED (100%)');
  console.log('======================================================\n');
}

runEngineTests().catch((err) => {
  console.error('❌ Conversion engine test suite failed:', err);
  process.exit(1);
});
