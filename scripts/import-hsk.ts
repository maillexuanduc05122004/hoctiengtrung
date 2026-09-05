/**
 * Nhập dữ liệu từ vựng HSK 3.0 (cấp 1-3) và sinh các tệp JSON cục bộ.
 *
 * Luồng xử lý:
 *   1. Đọc hsk30.csv đã ghim commit và CC-CEDICT từ thư mục cache.
 *   2. Chuẩn hoá chữ giản thể, chữ phồn thể, pinyin, từ loại, nghĩa tiếng Anh.
 *   3. Ghép phần chú giải tiếng Việt và câu ví dụ trong scripts/annotations/out/.
 *   4. Sinh pinyin cho câu ví dụ bằng pinyin-pro rồi đối chiếu với cách đọc mà
 *      CC-CEDICT ghi nhận cho từng chữ, để phát hiện chỗ đọc sai.
 *   5. Chia mỗi cấp thành các buổi học khoảng 10 từ.
 *   6. Ghi public/data/hsk-1.json, hsk-2.json, hsk-3.json và manifest.json.
 *
 * Chạy: npm run data:import
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pinyin } from 'pinyin-pro';
import {
  ANNOTATION_DIR,
  DATA_DIR,
  HSK30_COMMIT,
  PROJECT_ROOT,
  readCachedText,
  readCedictMetadata,
  shortHash,
} from './lib/sources.ts';
import { parseCedict, type CedictEntry } from './lib/cedict.ts';
import { normalizeHsk, splitIntoLessons, type BaseWord } from './lib/hsk.ts';
import { formatPinyin, parsePinyin, toAsciiPinyin } from '../src/lib/pinyin/index.ts';
import type {
  DatasetManifest,
  HskLevel,
  Lesson,
  LevelDataFile,
  VocabularyWord,
} from '../src/types/vocabulary.ts';

/** Phiên bản bộ dữ liệu đã chuẩn hoá của ứng dụng. */
const DATASET_VERSION = '1.0.0';

interface Annotation {
  id: string;
  vi: string[];
  viAliases?: string[];
  en: string[];
  enSource?: 'cedict' | 'written';
  example: { zh: string; vi: string; en: string };
}

function loadAnnotations(): Map<string, Annotation> {
  const dir = path.join(ANNOTATION_DIR, 'out');
  if (!existsSync(dir)) {
    throw new Error(`Thiếu thư mục chú giải "${path.relative(PROJECT_ROOT, dir)}".`);
  }
  const map = new Map<string, Annotation>();
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  for (const file of files) {
    const parsed: unknown = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
    if (!Array.isArray(parsed)) {
      throw new Error(`Tệp chú giải "${file}" không phải mảng JSON.`);
    }
    for (const item of parsed as Annotation[]) {
      if (typeof item?.id !== 'string') {
        throw new Error(`Tệp chú giải "${file}" có mục thiếu trường id.`);
      }
      map.set(item.id, item);
    }
  }
  console.log(`  đọc ${files.length} tệp chú giải, ${map.size} mục`);
  return map;
}

/** Các cách đọc mà CC-CEDICT ghi nhận cho từng chữ Hán đơn. */
function buildCharacterReadings(entries: readonly CedictEntry[]): Map<string, Set<string>> {
  const readings = new Map<string, Set<string>>();
  for (const entry of entries) {
    if ([...entry.simplified].length !== 1) continue;
    const syllable = toAsciiPinyin(entry.pinyinNumbered.toLowerCase().replace(/[0-5]/g, '')).replace(
      /\s+/g,
      '',
    );
    if (syllable === '') continue;
    const bucket = readings.get(entry.simplified);
    if (bucket) bucket.add(syllable);
    else readings.set(entry.simplified, new Set([syllable]));
  }
  return readings;
}

const HAN = /[㐀-鿿豈-﫿]/;

/**
 * Sinh pinyin cho một câu và kiểm tra từng âm tiết có phải là cách đọc hợp lệ
 * của chữ tương ứng hay không. Trả về cả cảnh báo để lần import nào cũng nhìn
 * thấy chỗ dữ liệu đáng ngờ thay vì âm thầm bỏ qua.
 */
function sentencePinyin(
  sentence: string,
  readings: Map<string, Set<string>>,
): { pinyin: string; warnings: string[] } {
  // `nonZh: 'removed'` để mảng trả về có đúng một phần tử cho mỗi chữ Hán;
  // các chế độ khác chèn thêm phần tử cho dấu câu và làm lệch chỉ số.
  const hanChars = [...sentence].filter((ch) => HAN.test(ch));
  const raw = pinyin(sentence, { toneType: 'symbol', type: 'array', nonZh: 'removed' });
  const warnings: string[] = [];
  const pieces: string[] = [];

  if (raw.length !== hanChars.length) {
    warnings.push(`số âm tiết (${raw.length}) không khớp số chữ Hán (${hanChars.length})`);
  }

  hanChars.forEach((ch, i) => {
    const produced = raw[i] ?? '';
    if (produced === '') return;
    const parsed = parsePinyin(produced);
    pieces.push(parsed ? formatPinyin(parsed) : produced);

    const allowed = readings.get(ch);
    if (allowed && allowed.size > 0) {
      const plain = toAsciiPinyin(produced.toLowerCase()).replace(/\s+/g, '');
      if (!allowed.has(plain)) {
        warnings.push(
          `chữ "${ch}" đọc "${produced}" không có trong CC-CEDICT (${[...allowed].join('/')})`,
        );
      }
    }
  });

  return { pinyin: pieces.join(' '), warnings };
}

function buildLessons(words: readonly BaseWord[], level: HskLevel): Lesson[] {
  const groups = splitIntoLessons(words, 10);
  return groups.map((group, i) => ({
    id: `L${level}-B${String(i + 1).padStart(2, '0')}`,
    level,
    index: i + 1,
    wordIds: group.map((w) => w.id),
    range: {
      from: group[0]?.simplified ?? '',
      to: group[group.length - 1]?.simplified ?? '',
    },
  }));
}

function main(): void {
  console.log('Nhập dữ liệu HSK 3.0 cấp 1-3');

  const hskCsv = readCachedText('hsk30.csv');
  const cedictText = readCachedText('cedict.txt');
  const cedictMeta = readCedictMetadata(cedictText);
  const cedictEntries = parseCedict(cedictText);
  console.log(`  CC-CEDICT: ${cedictEntries.length} mục, bản ${cedictMeta.date}`);

  const { words: baseWords, warnings: baseWarnings } = normalizeHsk(hskCsv, cedictEntries);
  console.log(`  chuẩn hoá ${baseWords.length} từ (${baseWarnings.length} cảnh báo)`);

  const annotations = loadAnnotations();
  const readings = buildCharacterReadings(cedictEntries);

  const sourceLabel = `ivankra/hsk30@${HSK30_COMMIT.slice(0, 10)} + CC-CEDICT ${cedictMeta.date.slice(0, 10)}`;
  const importedAt = new Date().toISOString();

  const missingAnnotation: string[] = [];
  const pinyinWarnings: string[] = [];
  const lessonByWord = new Map<string, string>();

  const levels: HskLevel[] = [1, 2, 3];
  const perLevel: LevelDataFile[] = [];

  for (const level of levels) {
    const inLevel = baseWords.filter((w) => w.hskLevel === level);
    const lessons = buildLessons(inLevel, level);
    for (const lesson of lessons) {
      for (const wordId of lesson.wordIds) lessonByWord.set(wordId, lesson.id);
    }

    const words: VocabularyWord[] = inLevel.map((base) => {
      const annotation = annotations.get(base.id);
      if (!annotation) missingAnnotation.push(base.id);

      const example = annotation?.example;
      const examples: VocabularyWord['examples'] = [];
      if (example?.zh) {
        const { pinyin: examplePinyin, warnings } = sentencePinyin(example.zh, readings);
        for (const warning of warnings) {
          pinyinWarnings.push(`${base.id} (${base.simplified}): ${warning}`);
        }
        examples.push({
          zh: example.zh,
          pinyin: examplePinyin,
          vi: example.vi ?? '',
          en: example.en ?? '',
        });
      }

      const meaningsEn = annotation?.en?.length ? annotation.en : base.meaningsEn;
      const enFromWriting = annotation?.enSource === 'written';

      return {
        id: base.id,
        simplified: base.simplified,
        ...(base.traditional ? { traditional: base.traditional } : {}),
        pinyin: base.pinyin,
        pinyinPlain: base.pinyinPlain,
        hskLevel: base.hskLevel,
        ...(base.partOfSpeech.length > 0 ? { partOfSpeech: base.partOfSpeech } : {}),
        meanings: {
          vi: annotation?.vi ?? [],
          en: meaningsEn,
        },
        aliases: {
          vi: annotation?.viAliases ?? [],
          en: base.aliasesEn,
          pinyin: base.pinyinAliases,
        },
        examples,
        source: enFromWriting ? `${sourceLabel} (nghĩa tiếng Anh do dịch máy)` : sourceLabel,
        datasetVersion: DATASET_VERSION,
        // Nghĩa tiếng Việt và câu ví dụ là bản dịch máy, chưa có người kiểm duyệt.
        translationStatus: 'machine',
        ...(base.writtenVariants.length > 0 ? { writtenVariants: base.writtenVariants } : {}),
        ...(lessonByWord.has(base.id) ? { lessonId: lessonByWord.get(base.id) } : {}),
      } satisfies VocabularyWord;
    });

    perLevel.push({ level, datasetVersion: DATASET_VERSION, words, lessons });
  }

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  for (const file of perLevel) {
    const target = path.join(DATA_DIR, `hsk-${file.level}.json`);
    writeFileSync(target, JSON.stringify(file), 'utf8');
    const size = (readFileSync(target).byteLength / 1024).toFixed(0);
    console.log(`  ghi hsk-${file.level}.json: ${file.words.length} từ, ${file.lessons.length} buổi, ${size} KB`);
  }

  const allWords = perLevel.flatMap((f) => f.words);
  const manifest: DatasetManifest = {
    datasetVersion: DATASET_VERSION,
    importedAt,
    standard: 'HSK 3.0 — Chuẩn quốc tế về trình độ tiếng Trung, công bố năm 2021',
    totalWords: allWords.length,
    levels: perLevel.map((f) => ({
      level: f.level,
      words: f.words.length,
      lessons: f.lessons.length,
      file: `hsk-${f.level}.json`,
    })),
    sources: [
      {
        name: 'ivankra/hsk30',
        url: 'https://github.com/ivankra/hsk30',
        license: 'MIT',
        version: HSK30_COMMIT,
        usedFor: 'Danh sách từ, chữ phồn thể, pinyin chính thức, từ loại, cấp độ HSK',
      },
      {
        name: 'CC-CEDICT (MDBG)',
        url: 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict',
        license: 'CC BY-SA 4.0',
        version: `${cedictMeta.version}.${cedictMeta.entries} — ${cedictMeta.date}`,
        usedFor: 'Nghĩa tiếng Anh, pinyin tách âm tiết, cách đọc của từng chữ',
      },
      {
        name: 'pinyin-pro',
        url: 'https://github.com/zh-lx/pinyin-pro',
        license: 'MIT',
        version: readPackageVersion('pinyin-pro'),
        usedFor: 'Sinh pinyin cho câu ví dụ theo ngữ cảnh (chỉ chạy lúc nhập dữ liệu)',
      },
    ],
    machineTranslated: allWords.filter((w) => w.translationStatus === 'machine').length,
    reviewedTranslations: allWords.filter((w) => w.translationStatus === 'reviewed').length,
    notes: [
      'Nghĩa tiếng Việt và câu ví dụ là bản dịch máy, chưa qua kiểm duyệt của người bản ngữ.',
      'Nghĩa tiếng Anh lấy từ CC-CEDICT và được chọn lại theo từ loại của từng mục từ.',
      'Đây là danh sách HSK 3.0 công bố năm 2021, không phải danh sách của năm 2026.',
      `Câu ví dụ có ${pinyinWarnings.length} chỗ pinyin không khớp cách đọc CC-CEDICT ghi nhận, phần lớn là chữ đa âm.`,
    ],
  };
  writeFileSync(path.join(DATA_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`  ghi manifest.json (mã băm dữ liệu ${shortHash(JSON.stringify(allWords))})`);

  if (missingAnnotation.length > 0) {
    console.warn(`\nCẢNH BÁO: ${missingAnnotation.length} từ thiếu chú giải tiếng Việt.`);
    console.warn(`  ${missingAnnotation.slice(0, 20).join(', ')}`);
  }
  if (pinyinWarnings.length > 0) {
    console.log(`\nGhi chú: ${pinyinWarnings.length} âm tiết trong câu ví dụ khác cách đọc CC-CEDICT.`);
    for (const warning of pinyinWarnings.slice(0, 10)) console.log(`  ${warning}`);
  }
  console.log('\nXong. Chạy "npm run data:verify" để kiểm tra dữ liệu.');
}

function readPackageVersion(name: string): string {
  const file = path.join(PROJECT_ROOT, 'node_modules', name, 'package.json');
  const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (parsed && typeof parsed === 'object' && 'version' in parsed) {
    const version = (parsed as { version: unknown }).version;
    if (typeof version === 'string') return version;
  }
  return 'không rõ';
}

main();
