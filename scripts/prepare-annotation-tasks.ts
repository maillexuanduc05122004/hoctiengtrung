/**
 * Sinh các tệp công việc để bổ sung phần dữ liệu mà nguồn mở không có:
 * nghĩa tiếng Việt, cách nói đồng nghĩa tiếng Việt, câu ví dụ, và việc chọn
 * đúng nghĩa tiếng Anh theo từ loại (CC-CEDICT gộp mọi nghĩa vào một mục).
 *
 * Phần này là bản dịch máy, sẽ được đánh dấu `translationStatus: "machine"`
 * trong dữ liệu cuối cùng.
 *
 * Chạy: npm run data:tasks
 *   không tham số      → mọi cấp, ghi task-001.json, task-002.json, …
 *   --level 4          → chỉ cấp 4, ghi task-h4-01.json, task-h4-02.json, …
 *   --level 4 --prefix h4
 *                      → như trên, tên tệp là task-<prefix>-NN.json
 *
 * Có `--level` mà không có `--prefix` thì tiền tố mặc định là `h<cấp>`, để một
 * lần chạy theo cấp không bao giờ ghi đè bộ tệp task-NNN của lần chạy đầy đủ.
 *
 * Thêm một cấp mới thì dùng chế độ theo cấp chứ KHÔNG chạy lại bộ đầy đủ: bộ
 * task-NNN cắt phẳng mọi cấp thành khối 45 từ, nên nối thêm cấp sẽ dồn từ mới
 * vào khối cuối của cấp trước và thêm mục cùng chữ vào các khối đã chú giải
 * xong — tệp cũ đổi nội dung dù thứ tự nguồn không đổi.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { PROJECT_ROOT, readCachedText } from './lib/sources.ts';
import { cleanDefinition, indexCedict, parseCedict } from './lib/cedict.ts';
import { HSK_LEVELS, isHskLevel, normalizeHsk, type HskLevel } from './lib/hsk.ts';

const CHUNK_SIZE = 45;
const TASK_DIR = path.join(PROJECT_ROOT, 'scripts/annotations/tasks');

export interface AnnotationTaskWord {
  id: string;
  simplified: string;
  traditional?: string;
  pinyin: string;
  hskLevel: HskLevel;
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

interface Options {
  /** Chỉ sinh tệp cho một cấp; `null` là mọi cấp. */
  level: HskLevel | null;
  /** Tiền tố tên tệp; `null` là bộ tệp task-NNN đầy đủ. */
  prefix: string | null;
}

function readOptions(argv: readonly string[]): Options {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      level: { type: 'string' },
      prefix: { type: 'string' },
    },
    strict: true,
  });

  let level: HskLevel | null = null;
  if (values.level !== undefined) {
    const parsed = Number(values.level);
    if (!isHskLevel(parsed)) {
      throw new Error(`--level phải là một trong ${HSK_LEVELS.join(', ')}; nhận được "${values.level}".`);
    }
    level = parsed;
  }

  let prefix: string | null = values.prefix?.trim() || null;
  if (prefix !== null && !/^[a-z0-9]+$/i.test(prefix)) {
    throw new Error(`--prefix chỉ gồm chữ và số; nhận được "${prefix}".`);
  }
  if (prefix === null && level !== null) prefix = `h${level}`;

  return { level, prefix };
}

/** Tên tệp của một khối: task-NNN.json cho bộ đầy đủ, task-<prefix>-NN.json khi có tiền tố. */
function chunkName(prefix: string | null, ordinal: number): string {
  return prefix === null
    ? `task-${String(ordinal).padStart(3, '0')}.json`
    : `task-${prefix}-${String(ordinal).padStart(2, '0')}.json`;
}

function main(): void {
  const options = readOptions(process.argv.slice(2));

  const cedict = parseCedict(readCachedText('cedict.txt'));
  const index = indexCedict(cedict);
  const { words } = normalizeHsk(readCachedText('hsk30.csv'), cedict);

  const bySimplified = new Map<string, typeof words>();
  for (const word of words) {
    const bucket = bySimplified.get(word.simplified);
    if (bucket) bucket.push(word);
    else bySimplified.set(word.simplified, [word]);
  }

  const selected = options.level === null ? words : words.filter((w) => w.hskLevel === options.level);

  const tasks: AnnotationTaskWord[] = selected.map((word) => {
    const entries = word.cedictKeys
      .map((key) => index.byKey.get(key))
      .filter((e): e is NonNullable<typeof e> => e !== undefined);
    const pool = entries.length > 0 ? entries : (index.bySimplified.get(word.simplified) ?? []);
    const definitions = [
      ...new Set(pool.flatMap((e) => e.definitions.map(cleanDefinition)).filter((d) => d !== '')),
    ];

    // Mục cùng chữ được tìm trên MỌI cấp, kể cả khi chỉ sinh tệp cho một cấp:
    // từ của cấp mới phải phân biệt được với từ cùng chữ mà người học đã gặp ở
    // cấp thấp hơn, và ngược lại.
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
    const name = chunkName(options.prefix, chunks.length + 1);
    writeFileSync(path.join(TASK_DIR, name), JSON.stringify(slice, null, 2), 'utf8');
    chunks.push(name);
  }

  const scope = options.level === null ? 'mọi cấp' : `HSK ${options.level}`;
  console.log(
    `Đã ghi ${tasks.length} từ (${scope}) vào ${chunks.length} tệp công việc tại ${path.relative(PROJECT_ROOT, TASK_DIR)}` +
      (chunks.length > 0 ? ` (${chunks[0]} … ${chunks[chunks.length - 1]})` : ''),
  );
  console.log(`Số từ cần tự viết nghĩa tiếng Anh: ${tasks.filter((t) => t.needsEnglish).length}`);
  console.log(`Số từ có mục cùng chữ: ${tasks.filter((t) => t.siblings).length}`);
}

main();
