/**
 * Sinh các tệp công việc để bổ sung phần dữ liệu mà nguồn mở không có:
 * nghĩa tiếng Việt, cách nói đồng nghĩa tiếng Việt, câu ví dụ, và việc chọn
 * đúng nghĩa tiếng Anh theo từ loại (CC-CEDICT gộp mọi nghĩa vào một mục).
 *
 * Phần này là bản dịch máy, sẽ được đánh dấu `translationStatus: "machine"`
 * trong dữ liệu cuối cùng.
 *
 * Chạy: npm run data:tasks
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT, readCachedText } from './lib/sources.ts';
import { cleanDefinition, indexCedict, parseCedict } from './lib/cedict.ts';
import { normalizeHsk } from './lib/hsk.ts';

const CHUNK_SIZE = 45;
const TASK_DIR = path.join(PROJECT_ROOT, 'scripts/annotations/tasks');

export interface AnnotationTaskWord {
  id: string;
  simplified: string;
  traditional?: string;
  pinyin: string;
  hskLevel: 1 | 2 | 3;
  partOfSpeech: string[];
  /** Toàn bộ nghĩa CC-CEDICT, chưa lọc, để chọn đúng nghĩa theo từ loại. */
  cedictDefinitions: string[];
  /** Các mục cùng chữ giản thể nhưng khác nghĩa hoặc khác âm đọc. */
  siblings?: { id: string; pinyin: string; partOfSpeech: string[] }[];
  /** Từ minh hoạ do nguồn gợi ý cho tiền tố/hậu tố. */
  affixExample?: string;
  /** `true` khi CC-CEDICT không có nghĩa nào, phải tự viết nghĩa tiếng Anh. */
  needsEnglish: boolean;
}

function main(): void {
  const cedict = parseCedict(readCachedText('cedict.txt'));
  const index = indexCedict(cedict);
  const { words } = normalizeHsk(readCachedText('hsk30.csv'), cedict);

  const bySimplified = new Map<string, typeof words>();
  for (const word of words) {
    const bucket = bySimplified.get(word.simplified);
    if (bucket) bucket.push(word);
    else bySimplified.set(word.simplified, [word]);
  }

  const tasks: AnnotationTaskWord[] = words.map((word) => {
    const entries = word.cedictKeys
      .map((key) => index.byKey.get(key))
      .filter((e): e is NonNullable<typeof e> => e !== undefined);
    const pool = entries.length > 0 ? entries : (index.bySimplified.get(word.simplified) ?? []);
    const definitions = [
      ...new Set(pool.flatMap((e) => e.definitions.map(cleanDefinition)).filter((d) => d !== '')),
    ];

    const family = bySimplified.get(word.simplified) ?? [];
    const siblings = family
      .filter((other) => other.id !== word.id)
      .map((other) => ({
        id: other.id,
        pinyin: other.pinyin,
        partOfSpeech: other.partOfSpeech,
      }));

    return {
      id: word.id,
      simplified: word.simplified,
      traditional: word.traditional,
      pinyin: word.pinyin,
      hskLevel: word.hskLevel,
      partOfSpeech: word.partOfSpeech,
      cedictDefinitions: definitions,
      ...(siblings.length > 0 ? { siblings } : {}),
      ...(word.affixExample ? { affixExample: word.affixExample } : {}),
      needsEnglish: definitions.length === 0,
    };
  });

  mkdirSync(TASK_DIR, { recursive: true });
  const chunks: string[] = [];
  for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
    const slice = tasks.slice(i, i + CHUNK_SIZE);
    const name = `task-${String(chunks.length + 1).padStart(3, '0')}.json`;
    writeFileSync(path.join(TASK_DIR, name), JSON.stringify(slice, null, 2), 'utf8');
    chunks.push(name);
  }

  console.log(`Đã ghi ${tasks.length} từ vào ${chunks.length} tệp công việc tại ${path.relative(PROJECT_ROOT, TASK_DIR)}`);
  console.log(`Số từ cần tự viết nghĩa tiếng Anh: ${tasks.filter((t) => t.needsEnglish).length}`);
  console.log(`Số từ có mục cùng chữ: ${tasks.filter((t) => t.siblings).length}`);
}

main();
