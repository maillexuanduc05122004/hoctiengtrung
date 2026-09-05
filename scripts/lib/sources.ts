/**
 * Khai báo nguồn dữ liệu và lớp tải có cache.
 *
 * Nguyên tắc: mọi nguồn đều được ghim (commit hash hoặc bản phát hành cụ thể)
 * để lần import sau cho ra đúng kết quả như lần trước. Tệp tải về nằm trong
 * `scripts/.cache/` và không được commit; ứng dụng chạy hoàn toàn bằng dữ liệu
 * đã chuẩn hoá trong `public/data/`.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CACHE_DIR = path.join(PROJECT_ROOT, 'scripts/.cache');
export const DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
export const ANNOTATION_DIR = path.join(PROJECT_ROOT, 'scripts/annotations');

/** Commit được ghim của kho ivankra/hsk30. Đổi giá trị này là đổi phiên bản dữ liệu. */
export const HSK30_COMMIT = '4ff9e3915ce87baaecd7ebe263085573a4ea3192';

export interface SourceDescriptor {
  /** Khoá dùng làm tên tệp trong cache. */
  readonly file: string;
  readonly url: string;
  readonly gzipped?: boolean;
}

export const SOURCES = {
  hsk30: {
    file: 'hsk30.csv',
    url: `https://raw.githubusercontent.com/ivankra/hsk30/${HSK30_COMMIT}/hsk30.csv`,
  },
  cedict: {
    file: 'cedict.txt',
    url: 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
    gzipped: true,
  },
} as const satisfies Record<string, SourceDescriptor>;

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

/** Tải một nguồn về cache nếu chưa có sẵn. */
export async function fetchSource(descriptor: SourceDescriptor): Promise<string> {
  ensureCacheDir();
  const target = path.join(CACHE_DIR, descriptor.file);
  if (existsSync(target)) {
    console.log(`  đã có sẵn: ${descriptor.file}`);
    return target;
  }
  console.log(`  đang tải: ${descriptor.url}`);
  const response = await fetch(descriptor.url);
  if (!response.ok) {
    throw new Error(`Tải thất bại ${descriptor.url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const content = descriptor.gzipped ? gunzipSync(buffer) : buffer;
  writeFileSync(target, content);
  console.log(`  đã lưu: ${descriptor.file} (${content.byteLength} byte)`);
  return target;
}

/** Đọc một tệp trong cache, báo lỗi rõ ràng nếu chưa tải. */
export function readCachedText(file: string): string {
  const target = path.join(CACHE_DIR, file);
  if (!existsSync(target)) {
    throw new Error(`Thiếu tệp nguồn "${file}". Chạy "npm run data:fetch" trước.`);
  }
  return readFileSync(target, 'utf8');
}

/** Băm SHA-256 rút gọn, dùng để ghi nhận đúng bản dữ liệu đã dùng. */
export function shortHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/** Đọc dòng metadata phiên bản của CC-CEDICT, ví dụ "#! date=2026-09-05T07:18:24Z". */
export function readCedictMetadata(text: string): { version: string; date: string; entries: string } {
  const read = (key: string): string => {
    const match = new RegExp(`^#! ${key}=(.*)$`, 'm').exec(text);
    return match ? match[1].trim() : 'không rõ';
  };
  return { version: read('version'), date: read('date'), entries: read('entries') };
}
