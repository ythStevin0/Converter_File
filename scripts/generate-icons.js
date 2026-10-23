import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, '../assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// SVG with OrbitDrop logo
const svgLogo = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="56" fill="#0c0e14"/>
  <circle cx="128" cy="128" r="92" stroke="#3b82f6" stroke-width="12" stroke-dasharray="16 20"/>
  <circle cx="128" cy="128" r="56" fill="#1e293b" stroke="#06b6d4" stroke-width="6"/>
  <circle cx="128" cy="72" r="14" fill="#f97316"/>
  <circle cx="178" cy="148" r="12" fill="#10b981"/>
  <circle cx="86" cy="162" r="10" fill="#8b5cf6"/>
  <circle cx="128" cy="128" r="18" fill="#3b82f6"/>
</svg>
`;

async function buildIcons() {
  const iconBuffer = Buffer.from(svgLogo);

  // 256x256 App Icon
  await sharp(iconBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  // 32x32 Tray Icon
  await sharp(iconBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(assetsDir, 'tray.png'));

  console.log('Generated assets/icon.png and assets/tray.png successfully!');
}

buildIcons().catch(console.error);
