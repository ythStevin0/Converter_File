import zlib from 'zlib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Precomputed CRC32 table for ZIP creation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function calculateCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipFileEntry {
  name: string;
  content: string | Buffer;
}

/**
 * Creates an in-memory valid ZIP buffer without external dependencies.
 */
export function createZipArchive(files: ZipFileEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf-8');
    const dataBuffer = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf-8');
    const compressedData = zlib.deflateRawSync(dataBuffer);
    const crc = calculateCrc32(dataBuffer);

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.write('PK\x03\x04', 0);
    localHeader.writeUInt16LE(20, 4); // version needed: 2.0
    localHeader.writeUInt16LE(0, 6);  // general purpose flags
    localHeader.writeUInt16LE(8, 8);  // compression: Deflate
    localHeader.writeUInt16LE(0, 10); // file mod time
    localHeader.writeUInt16LE(0, 12); // file mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedData.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    nameBuffer.copy(localHeader, 30);

    // Central directory file header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.write('PK\x01\x02', 0);
    centralHeader.writeUInt16LE(20, 4);  // version made by
    centralHeader.writeUInt16LE(20, 6);  // version needed
    centralHeader.writeUInt16LE(0, 8);   // flags
    centralHeader.writeUInt16LE(8, 10);  // compression
    centralHeader.writeUInt16LE(0, 12);  // mod time
    centralHeader.writeUInt16LE(0, 14);  // mod date
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedData.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);  // extra length
    centralHeader.writeUInt16LE(0, 32);  // comment length
    centralHeader.writeUInt16LE(0, 34);  // disk start
    centralHeader.writeUInt16LE(0, 36);  // internal attributes
    centralHeader.writeUInt32LE(0, 38);  // external attributes
    centralHeader.writeUInt32LE(offset, 42); // local header offset
    nameBuffer.copy(centralHeader, 46);

    localHeaders.push(localHeader, compressedData);
    centralHeaders.push(centralHeader);

    offset += localHeader.length + compressedData.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  // End of central directory record (22 bytes)
  const endRecord = Buffer.alloc(22);
  endRecord.write('PK\x05\x06', 0);
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // start disk
  endRecord.writeUInt16LE(files.length, 8); // entries on disk
  endRecord.writeUInt16LE(files.length, 10); // total entries
  endRecord.writeUInt32LE(centralDirSize, 12);
  endRecord.writeUInt32LE(centralDirOffset, 16);
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, endRecord]);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds a 100% valid Microsoft Word OpenXML (.docx) file containing the extracted text.
 */
export function buildDocxFromText(text: string, title = 'Document'): Buffer {
  const paragraphs = text
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(p)}</w:t></w:r></w:p>`)
    .join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    ${paragraphs || '<w:p><w:r><w:t>No text content available.</w:t></w:r></w:p>'}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return createZipArchive([
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rels },
    { name: 'word/document.xml', content: docXml },
  ]);
}

/**
 * Builds a valid Microsoft Word OpenXML (.docx) file with an embedded image.
 */
export function buildDocxWithImage(imageBuffer: Buffer, title = 'Image Document'): Buffer {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="5400000" cy="4050000"/>
            <wp:docPr id="1" name="Picture 1"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="Picture"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rIdImg1"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="5400000" cy="4050000"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    <w:sectPr/>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`;

  return createZipArchive([
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rels },
    { name: 'word/_rels/document.xml.rels', content: docRels },
    { name: 'word/document.xml', content: docXml },
    { name: 'word/media/image1.png', content: imageBuffer },
  ]);
}

/**
 * Builds a valid EPUB archive from text.
 */
export function buildEpubFromText(text: string, title = 'Document'): Buffer {
  const paragraphs = text
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeXml(p)}</p>`)
    .join('\n      ');

  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>id</dc:language>
    <dc:identifier id="BookID">urn:uuid:orbitdrop-${Date.now()}</dc:identifier>
    <dc:creator>OrbitDrop Local Engine</dc:creator>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:orbitdrop-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>${escapeXml(title)}</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;

  const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${escapeXml(title)}</title>
    <style type="text/css">
      body { font-family: sans-serif; margin: 5%; line-height: 1.6; }
      h1 { color: #0f172a; border-bottom: 1px solid #ccc; padding-bottom: 0.3em; }
      p { margin-bottom: 1em; text-indent: 1em; }
    </style>
  </head>
  <body>
    <h1>${escapeXml(title)}</h1>
    ${paragraphs || '<p>Tidak ada konten teks.</p>'}
  </body>
</html>`;

  return createZipArchive([
    { name: 'mimetype', content: 'application/epub+zip' },
    { name: 'META-INF/container.xml', content: containerXml },
    { name: 'OEBPS/content.opf', content: contentOpf },
    { name: 'OEBPS/toc.ncx', content: tocNcx },
    { name: 'OEBPS/chapter1.xhtml', content: chapterXhtml },
  ]);
}

/**
 * Builds a clean HTML5 page from text.
 */
export function buildHtmlFromText(text: string, title = 'Document'): string {
  const paragraphs = text
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeXml(p)}</p>`)
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 3rem auto;
      padding: 0 1.5rem;
      line-height: 1.7;
      color: #1e293b;
      background: #f8fafc;
    }
    h1 {
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      font-size: 1.8rem;
    }
    p {
      margin-bottom: 1.25rem;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${paragraphs || '<p>Tidak ada teks yang dapat diekstrak.</p>'}
</body>
</html>`;
}

/**
 * Robust PDF text extractor that decompresses zlib streams (FlateDecode).
 */
export function extractTextFromPdfBuffer(pdfBuffer: Buffer): string {
  const fullText: string[] = [];
  const binaryStr = pdfBuffer.toString('binary');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryStr)) !== null) {
    const rawStream = Buffer.from(match[1], 'binary');
    let decompressed: Buffer;

    try {
      decompressed = zlib.inflateSync(rawStream);
    } catch {
      try {
        decompressed = zlib.unzipSync(rawStream);
      } catch {
        decompressed = rawStream;
      }
    }

    const streamContent = decompressed.toString('utf-8');

    // Extract (...) Tj operators
    const tjMatches = streamContent.match(/\((.*?)\)\s*Tj/g) || [];
    for (const m of tjMatches) {
      const clean = m
        .replace(/^\(/, '')
        .replace(/\)\s*Tj$/, '')
        .replace(/\\([()\\])/g, '$1')
        .trim();
      if (clean) fullText.push(clean);
    }

    // Extract [...] TJ operators (array of text segments)
    const tJMatches = streamContent.match(/\[(.*?)\]\s*TJ/g) || [];
    for (const m of tJMatches) {
      const inner = m.replace(/^\[/, '').replace(/\]\s*TJ$/, '');
      const parts = inner.match(/\((.*?)\)/g) || [];
      const line = parts
        .map((p) => p.replace(/^\(/, '').replace(/\)$/, '').replace(/\\([()\\])/g, '$1'))
        .join('')
        .trim();
      if (line) fullText.push(line);
    }
  }

  // Fallback if no streams matched
  if (fullText.length === 0) {
    const rawMatches = (binaryStr.match(/\((.*?)\)\s*Tj/g) || []).map((m) =>
      m.replace(/^[(\[]/, '').replace(/[)\]]\s*T[jJ]$/, '').replace(/\\([()\\])/g, '$1').trim()
    );
    if (rawMatches.length > 0) return rawMatches.filter(Boolean).join(' ');
  }

  return fullText.join('\n');
}

/**
 * Creates a genuine PDF document from plain text using pdf-lib.
 */
export function buildPdfFromText(text: string, title = 'Document'): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 11;
      const lineHeight = 16;
      const margin = 50;
      const pageWidth = 595.28; // A4
      const pageHeight = 841.89;
      const contentWidth = pageWidth - margin * 2;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Draw Title
      currentPage.drawText(title, {
        x: margin,
        y: currentY,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 32;

      const paragraphs = text.split(/\r?\n/).map((p) => p.trim());

      for (const para of paragraphs) {
        if (!para) {
          currentY -= 10;
          continue;
        }

        // Word wrap paragraph into lines
        const words = para.split(/\s+/);
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > contentWidth && currentLine) {
            if (currentY <= margin + lineHeight) {
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              currentY = pageHeight - margin;
            }
            currentPage.drawText(currentLine, {
              x: margin,
              y: currentY,
              size: fontSize,
              font,
              color: rgb(0.2, 0.2, 0.2),
            });
            currentY -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          if (currentY <= margin + lineHeight) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
          }
          currentPage.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          currentY -= lineHeight + 6;
        }
      }

      const pdfBytes = await pdfDoc.save();
      resolve(pdfBytes);
    } catch (err) {
      reject(err);
    }
  });
}
