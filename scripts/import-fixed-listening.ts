/**
 * Nhập một trang HTML bài nghe vào phần "Nghe cố định".
 *
 * Chạy:
 *   npm run data:nghe -- <tệp.html>              thêm thành bài mới (bai-NN kế tiếp)
 *   npm run data:nghe -- <tệp.html> --id bai-01  ghi đè đúng bài đó
 *
 * Kết quả là một tệp `src/features/fixed-listening/lessons/bai-NN.ts`. Trang
 * "Nghe cố định" tự nhận mọi tệp `bai-*.ts` trong thư mục đó, nên không phải
 * sửa thêm chỗ nào khác.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { nextLessonId, parseLessonDocument, renderLessonModule } from './lib/fixed-listening.ts';
import { PROJECT_ROOT } from './lib/sources.ts';

const LESSON_DIR = path.join(PROJECT_ROOT, 'src/features/fixed-listening/lessons');

function readArgs(argv: readonly string[]): { file: string; id: string | null } {
  let file: string | null = null;
  let id: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--id') {
      id = argv[i + 1] ?? null;
      i += 1;
    } else {
      file = argv[i];
    }
  }
  if (file === null) {
    console.error('Thiếu tệp HTML. Ví dụ: npm run data:nghe -- bai-moi.html');
    process.exit(1);
  }
  if (id !== null && !/^bai-\d+$/.test(id)) {
    console.error(`Mã bài phải có dạng bai-NN, nhận được "${id}".`);
    process.exit(1);
  }
  return { file, id };
}

function main(): void {
  const { file, id: wantedId } = readArgs(process.argv.slice(2));
  const source = path.resolve(file);
  if (!existsSync(source)) {
    console.error(`Không thấy tệp ${source}`);
    process.exit(1);
  }

  const document = new JSDOM(readFileSync(source, 'utf8')).window.document;
  const lesson = parseLessonDocument(document);

  const id = wantedId ?? nextLessonId(readdirSync(LESSON_DIR));
  const target = path.join(LESSON_DIR, `${id}.ts`);
  const replacing = existsSync(target);
  writeFileSync(target, renderLessonModule(lesson, path.basename(source)), 'utf8');

  // Chỉ in số đếm, không in nội dung: kiểm tra chữ Hán thì mở tệp vừa ghi.
  console.log(`${replacing ? 'Đã ghi đè' : 'Đã thêm'} ${path.relative(PROJECT_ROOT, target)}`);
  for (const section of lesson.sections) {
    console.log(`  ${section.items.length} mục — ${section.title}`);
  }
  console.log(`  tốc độ ${lesson.rate}×, ${lesson.notes.length} dòng giới thiệu`);
}

main();
