/**
 * Sinh bộ biểu tượng PWA và favicon.
 *
 * Không dùng thư viện đồ hoạ: hình được vẽ trực tiếp lên mảng điểm ảnh rồi mã
 * hoá PNG bằng zlib có sẵn của Node. Hình vẽ là con dấu vuông màu đỏ son trên
 * nền giấy ấm, bên trong là bố cục nét ngang - nét sổ gợi hình chữ Hán.
 *
 * Chạy: npm run assets:icons
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from './lib/sources.ts';

const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const PAPER: Rgb = { r: 0xf6, g: 0xf1, b: 0xe7 };
const CINNABAR: Rgb = { r: 0xb0, g: 0x3a, b: 0x28 };

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Mã hoá ảnh RGB (không kênh alpha) thành tệp PNG. */
function encodePng(width: number, height: number, pixels: Uint8Array): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // bộ lọc None
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // độ sâu bit
  ihdr[9] = 2; // màu truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Hình vẽ ở toạ độ chuẩn hoá 0..1; trả về màu hoặc null nếu trong suốt. */
type Shape = (x: number, y: number) => Rgb | null;

function roundedRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  color: Rgb,
): Shape {
  return (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return null;
    const dx = Math.max(x0 + radius - x, 0, x - (x1 - radius));
    const dy = Math.max(y0 + radius - y, 0, y - (y1 - radius));
    if (dx > 0 && dy > 0 && Math.hypot(dx, dy) > radius) return null;
    return color;
  };
}

function bar(x0: number, y0: number, x1: number, y1: number, color: Rgb): Shape {
  return (x, y) => (x >= x0 && x <= x1 && y >= y0 && y <= y1 ? color : null);
}

function compose(shapes: readonly Shape[], background: Rgb | null): Shape {
  return (x, y) => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const hit = shapes[i](x, y);
      if (hit) return hit;
    }
    return background;
  };
}

/** Vẽ với khử răng cưa bằng cách lấy mẫu 4x4 trên mỗi điểm ảnh. */
function render(size: number, shape: Shape, background: Rgb): Uint8Array {
  const pixels = new Uint8Array(size * size * 3);
  const samples = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = (px + (sx + 0.5) / samples) / size;
          const y = (py + (sy + 0.5) / samples) / size;
          const color = shape(x, y) ?? background;
          r += color.r;
          g += color.g;
          b += color.b;
        }
      }
      const total = samples * samples;
      const offset = (py * size + px) * 3;
      pixels[offset] = Math.round(r / total);
      pixels[offset + 1] = Math.round(g / total);
      pixels[offset + 2] = Math.round(b / total);
    }
  }
  return pixels;
}

/**
 * Con dấu vuông với bố cục nét bên trong.
 * `pad` là lề quanh con dấu, để bản maskable có vùng an toàn rộng hơn.
 */
function sealMark(pad: number): Shape {
  const a = pad;
  const b = 1 - pad;
  const w = b - a;
  const seal = roundedRect(a, a, b, b, w * 0.14, CINNABAR);

  // Ba nét ngang dài ngắn khác nhau và một nét sổ, gợi cấu trúc chữ Hán.
  const inner = a + w * 0.2;
  const innerRight = b - w * 0.2;
  const thickness = w * 0.075;
  const strokes: Shape[] = [
    bar(inner, a + w * 0.26, innerRight, a + w * 0.26 + thickness, PAPER),
    bar(inner + w * 0.1, a + w * 0.47, innerRight, a + w * 0.47 + thickness, PAPER),
    bar(inner, a + w * 0.68, innerRight - w * 0.16, a + w * 0.68 + thickness, PAPER),
    bar(a + w * 0.46, a + w * 0.18, a + w * 0.46 + thickness, b - w * 0.18, PAPER),
  ];
  return compose([seal, ...strokes], null);
}

function writeIcon(name: string, size: number, pad: number): void {
  const shape = compose([sealMark(pad)], PAPER);
  const pixels = render(size, shape, PAPER);
  const target = path.join(PUBLIC_DIR, name);
  writeFileSync(target, encodePng(size, size, pixels));
  console.log(`  ${name} (${size}x${size})`);
}

function writeFaviconSvg(): void {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Mỗi Ngày 中文">
  <rect width="64" height="64" fill="#f6f1e7"/>
  <rect x="8" y="8" width="48" height="48" rx="7" fill="#b03a28"/>
  <g fill="#f6f1e7">
    <rect x="17.6" y="20.5" width="28.8" height="3.6" rx="0.6"/>
    <rect x="22.4" y="30.6" width="24" height="3.6" rx="0.6"/>
    <rect x="17.6" y="40.6" width="21.1" height="3.6" rx="0.6"/>
    <rect x="30.1" y="16.6" width="3.6" height="30.7" rx="0.6"/>
  </g>
</svg>
`;
  writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), svg, 'utf8');
  console.log('  favicon.svg');
}

function main(): void {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log('Sinh biểu tượng ứng dụng');
  writeIcon('icon-192.png', 192, 0.125);
  writeIcon('icon-512.png', 512, 0.125);
  // Bản maskable cần vùng an toàn rộng hơn vì hệ điều hành sẽ cắt góc.
  writeIcon('icon-maskable.png', 512, 0.215);
  writeFaviconSvg();
}

main();
