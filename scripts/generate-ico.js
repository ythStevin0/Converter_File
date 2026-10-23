import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pngPath = path.join(__dirname, '../assets/icon.png');
const icoPath = path.join(__dirname, '../assets/icon.ico');

const pngBuffer = fs.readFileSync(pngPath);
const pngSize = pngBuffer.length;

// 6 bytes header + 16 bytes entry = 22 bytes
const header = Buffer.alloc(22);

// ICONDIR
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = ICO
header.writeUInt16LE(1, 4); // count 1

// ICONDIRENTRY
header.writeUInt8(0, 6);   // width 256 = 0
header.writeUInt8(0, 7);   // height 256 = 0
header.writeUInt8(0, 8);   // color count 0
header.writeUInt8(0, 9);   // reserved 0
header.writeUInt16LE(1, 10); // color planes 1
header.writeUInt16LE(32, 12); // bits per pixel 32
header.writeUInt32LE(pngSize, 14); // image size
header.writeUInt32LE(22, 18); // image offset

const icoBuffer = Buffer.concat([header, pngBuffer]);
fs.writeFileSync(icoPath, icoBuffer);

console.log(`Generated valid icon.ico (${icoBuffer.length} bytes) successfully!`);
