/**
 * Tải các nguồn dữ liệu đã ghim về thư mục scripts/.cache/.
 * Tệp đã có sẵn thì bỏ qua, nên chạy lại nhiều lần cũng không tốn mạng.
 *
 * Chạy: npm run data:fetch
 */
import { fetchSource, HSK30_COMMIT, SOURCES } from './lib/sources.ts';

async function main(): Promise<void> {
  console.log('Tải nguồn dữ liệu');
  console.log(`  hsk30 ghim tại commit ${HSK30_COMMIT}`);
  for (const source of Object.values(SOURCES)) {
    await fetchSource(source);
  }
  console.log('Xong. Chạy "npm run data:import" để nhập dữ liệu.');
}

await main();
