/**
 * Kiểm tra bộ dữ liệu đã nhập trong public/data/.
 * Thoát với mã 1 khi có bất kỳ kiểm tra nào không đạt.
 *
 * Chạy: npm run data:verify
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, PROJECT_ROOT } from './lib/sources.ts';
import { summarize, verifyDataset } from './lib/verify.ts';
import type { DatasetManifest, LevelDataFile } from '../src/types/vocabulary.ts';

function readJson<T>(file: string): T {
  const target = path.join(DATA_DIR, file);
  if (!existsSync(target)) {
    throw new Error(`Thiếu tệp "${path.relative(PROJECT_ROOT, target)}". Chạy "npm run data:import" trước.`);
  }
  return JSON.parse(readFileSync(target, 'utf8')) as T;
}

function main(): void {
  const files = [1, 2, 3].map((level) => readJson<LevelDataFile>(`hsk-${level}.json`));
  const manifest = readJson<DatasetManifest>('manifest.json');

  const results = verifyDataset(files, manifest);
  const width = Math.max(...results.map((r) => r.name.length));

  console.log('Kiểm tra dữ liệu HSK 3.0 cấp 1-3\n');
  for (const result of results) {
    const mark = result.passed ? 'ĐẠT ' : 'LỖI ';
    console.log(`  ${mark} ${result.name.padEnd(width)}  ${result.detail}`);
  }

  const { passed, failed } = summarize(results);
  console.log(`\n${passed} kiểm tra đạt, ${failed} kiểm tra lỗi.`);

  if (failed > 0) process.exit(1);
}

main();
