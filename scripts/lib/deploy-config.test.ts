import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROJECT_ROOT } from './sources.ts';

/**
 * Nền tảng triển khai từ chối tệp cấu hình ngay khi nó không phải JSON hợp lệ,
 * và thông báo lỗi không nói rõ sai ở đâu. Một lần escape sai trong biểu thức
 * đường dẫn đã đủ làm hỏng cả lượt triển khai, nên kiểm ngay trong bộ test.
 */
function readJsonFile(relative: string): unknown {
  const raw = readFileSync(path.join(PROJECT_ROOT, relative), 'utf8');
  return JSON.parse(raw);
}

interface VercelConfig {
  rewrites?: { source: string; destination: string }[];
  headers?: { source: string; headers: { key: string; value: string }[] }[];
}

describe('vercel.json', () => {
  it('là JSON hợp lệ', () => {
    expect(() => readJsonFile('vercel.json')).not.toThrow();
  });

  it('có luật chuyển hướng cho ứng dụng một trang', () => {
    const config = readJsonFile('vercel.json') as VercelConfig;
    const rewrites = config.rewrites ?? [];
    expect(rewrites.length).toBeGreaterThan(0);
    expect(rewrites.some((r) => r.destination === '/index.html')).toBe(true);
  });

  it('không dùng ký tự escape mà JSON không cho phép', () => {
    const raw = readFileSync(path.join(PROJECT_ROOT, 'vercel.json'), 'utf8');
    // JSON chỉ chấp nhận \" \\ \/ \b \f \n \r \t và \uXXXX.
    const badEscape = /\\(?!["\\/bfnrtu])/.exec(raw);
    expect(badEscape?.[0] ?? null).toBeNull();
  });
});

describe('package.json', () => {
  it('là JSON hợp lệ và khai báo các lệnh bắt buộc', () => {
    const pkg = readJsonFile('package.json') as { scripts?: Record<string, string> };
    for (const command of ['dev', 'build', 'lint', 'test']) {
      expect(pkg.scripts?.[command]).toBeTruthy();
    }
  });
});
