import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDeflate } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to construct uncompressed PNG with pure JS & Node zlib
async function createPNG(width, height, drawPixelFn) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw pixel data with filter byte 0 per scanline
  const scanlineSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // IDAT chunk (zlib sync)
  const zlib = await import('zlib');
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Icon design: Gradient blue-purple background with white "M↓" markdown badge design
function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Rounded rectangle bounds
  const radius = 0.22;
  const isCorner = 
    (nx < radius && ny < radius && Math.hypot(nx - radius, ny - radius) > radius) ||
    (nx > 1 - radius && ny < radius && Math.hypot(nx - (1 - radius), ny - radius) > radius) ||
    (nx < radius && ny > 1 - radius && Math.hypot(nx - radius, ny - (1 - radius)) > radius) ||
    (nx > 1 - radius && ny > 1 - radius && Math.hypot(nx - (1 - radius), ny - (1 - radius)) > radius);

  if (isCorner) return [0, 0, 0, 0]; // transparent

  // Background Gradient (Deep Indigo #4F46E5 to Electric Violet #9333EA)
  const rBg = Math.round(79 + nx * 68);
  const gBg = Math.round(70 - ny * 20);
  const bBg = Math.round(229 + ny * 5);

  // Markdown symbol drawing: M + Down Arrow
  // M left stem: nx 0.25 to 0.35, ny 0.25 to 0.75
  // M right stem: nx 0.65 to 0.75, ny 0.25 to 0.75
  // M middle peak: (0.5, 0.5)
  // Arrow: nx 0.75-0.9, ny 0.4-0.75

  let isWhite = false;

  // M shape
  if (nx >= 0.22 && nx <= 0.30 && ny >= 0.28 && ny <= 0.72) isWhite = true;
  if (nx >= 0.52 && nx <= 0.60 && ny >= 0.28 && ny <= 0.72) isWhite = true;
  
  // Left diagonal of M
  if (nx >= 0.30 && nx <= 0.41 && ny >= 0.28 && ny <= 0.52) {
    const diag = (nx - 0.30) / 0.11;
    if (Math.abs((ny - 0.28) / 0.24 - diag) < 0.35) isWhite = true;
  }
  // Right diagonal of M
  if (nx >= 0.41 && nx <= 0.52 && ny >= 0.28 && ny <= 0.52) {
    const diag = (0.52 - nx) / 0.11;
    if (Math.abs((ny - 0.28) / 0.24 - diag) < 0.35) isWhite = true;
  }

  // Down arrow
  // Stem: nx 0.72 to 0.80, ny 0.28 to 0.62
  if (nx >= 0.72 && nx <= 0.80 && ny >= 0.28 && ny <= 0.58) isWhite = true;
  // Arrow head: ny 0.55 to 0.72, diagonal pointing down
  if (ny >= 0.55 && ny <= 0.72) {
    const arrowWidth = (0.72 - ny) * 0.8;
    if (Math.abs(nx - 0.76) <= arrowWidth + 0.03) isWhite = true;
  }

  if (isWhite) {
    return [255, 255, 255, 255];
  }

  return [rBg, gBg, bBg, 255];
}

async function main() {
  const iconsDir = path.resolve(__dirname, '../public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const sizes = [16, 32, 48, 128];
  for (const size of sizes) {
    const buf = await createPNG(size, size, drawIcon);
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buf);
    console.log(`Generated icon${size}.png`);
  }
}

main().catch(console.error);
