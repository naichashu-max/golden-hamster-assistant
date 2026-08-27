// 生成 PWA 应用图标（无第三方依赖，用 Node 内置 zlib 手工编码 PNG）。
// 运行：node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'client', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

// ---------- 极简 PNG 编码 ----------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 位深
  ihdr[9] = 6; // RGBA

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0; // 每行过滤器类型：None
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- 绘图 ----------
function createCanvas(size) {
  return Buffer.alloc(size * size * 4);
}

function blend(px, size, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const srcA = Math.min(1, Math.max(0, a));
  if (srcA <= 0) return;
  const i = (y * size + x) * 4;
  const dstA = px[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  px[i] = Math.round((r * srcA + px[i] * dstA * (1 - srcA)) / outA);
  px[i + 1] = Math.round((g * srcA + px[i + 1] * dstA * (1 - srcA)) / outA);
  px[i + 2] = Math.round((b * srcA + px[i + 2] * dstA * (1 - srcA)) / outA);
  px[i + 3] = Math.round(outA * 255);
}

function fillCircle(px, size, cx, cy, radius, [r, g, b], alpha = 1) {
  const x0 = Math.max(0, Math.floor(cx - radius - 1));
  const x1 = Math.min(size - 1, Math.ceil(cx + radius + 1));
  const y0 = Math.max(0, Math.floor(cy - radius - 1));
  const y1 = Math.min(size - 1, Math.ceil(cy + radius + 1));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      const coverage = Math.min(1, Math.max(0, radius + 0.5 - d));
      if (coverage > 0) blend(px, size, x, y, r, g, b, alpha * coverage);
    }
  }
}

function fillEllipse(px, size, cx, cy, rx, ry, [r, g, b], alpha = 1) {
  const x0 = Math.max(0, Math.floor(cx - rx - 1));
  const x1 = Math.min(size - 1, Math.ceil(cx + rx + 1));
  const y0 = Math.max(0, Math.floor(cy - ry - 1));
  const y1 = Math.min(size - 1, Math.ceil(cy + ry + 1));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      const coverage = Math.min(1, Math.max(0, (1 - d) * Math.min(rx, ry) + 0.5));
      if (coverage > 0) blend(px, size, x, y, r, g, b, alpha * coverage);
    }
  }
}

function drawIcon(size, faceScale) {
  const px = createCanvas(size);

  // 暖色渐变背景
  const top = [251, 246, 239];
  const bottom = [243, 227, 211];
  for (let y = 0; y < size; y += 1) {
    const t = y / (size - 1);
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = 255;
    }
  }

  const k = faceScale;
  const cx = size * 0.5;
  const cy = size * 0.55;
  const faceR = size * 0.34 * k;
  const earY = size * (0.55 - 0.27 * k);
  const earX = size * 0.21 * k;
  const earR = size * 0.13 * k;

  // 耳朵（先画，脸部会覆盖下半部分）
  for (const sign of [-1, 1]) {
    fillCircle(px, size, cx + sign * earX, earY, earR, [217, 160, 107]);
    fillCircle(px, size, cx + sign * earX, earY, earR * 0.55, [240, 199, 164]);
  }

  // 脸
  fillCircle(px, size, cx, cy, faceR * 1.04, [201, 143, 93]);
  fillCircle(px, size, cx, cy, faceR, [235, 194, 154]);

  // 高光
  fillCircle(px, size, cx - faceR * 0.34, cy - faceR * 0.42, faceR * 0.26, [255, 255, 255], 0.22);

  // 眼睛
  const eyeX = size * 0.12 * k;
  const eyeY = size * 0.52 * k;
  const eyeR = size * 0.035 * k;
  fillCircle(px, size, cx - eyeX, eyeY, eyeR, [74, 55, 40]);
  fillCircle(px, size, cx + eyeX, eyeY, eyeR, [74, 55, 40]);

  // 腮红
  const blushX = size * 0.2 * k;
  const blushR = size * 0.05 * k;
  fillCircle(px, size, cx - blushX, size * 0.64 * k, blushR, [233, 140, 120], 0.5);
  fillCircle(px, size, cx + blushX, size * 0.64 * k, blushR, [233, 140, 120], 0.5);

  // 鼻子
  fillEllipse(px, size, cx, size * 0.63 * k, size * 0.045 * k, size * 0.032 * k, [217, 118, 106]);

  return px;
}

const targets = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.84 },
  { file: 'apple-touch-icon.png', size: 180, scale: 1 },
];

for (const { file, size, scale } of targets) {
  const px = drawIcon(size, scale);
  writeFileSync(join(OUT_DIR, file), encodePng(size, size, px));
  console.log(`generated ${file}`);
}
