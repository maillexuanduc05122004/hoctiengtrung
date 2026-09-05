/**
 * Bộ kiểm tra dữ liệu sau khi nhập. Tách riêng khỏi phần đọc tệp để chạy được
 * trong Vitest với dữ liệu dựng sẵn.
 */
import type { DatasetManifest, LevelDataFile, VocabularyWord } from '../../src/types/vocabulary.ts';

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

/** Tổng số từ HSK 3.0 cấp 1-3 theo danh sách chính thức công bố năm 2021. */
export const EXPECTED_TOTAL = 2245;
export const EXPECTED_PER_LEVEL: Record<1 | 2 | 3, number> = { 1: 500, 2: 772, 3: 973 };

/** Sai lệch cho phép so với tổng số từ mong đợi. */
const TOLERANCE = 5;

const HAN = /^[㐀-鿿豈-﫿〇]+$/;

function check(name: string, passed: boolean, detail: string): CheckResult {
  return { name, passed, detail };
}

function list(items: readonly string[], limit = 8): string {
  if (items.length === 0) return '';
  const shown = items.slice(0, limit).join(', ');
  return items.length > limit ? `${shown} … (+${items.length - limit})` : shown;
}

export function verifyDataset(
  files: readonly LevelDataFile[],
  manifest?: DatasetManifest,
): CheckResult[] {
  const results: CheckResult[] = [];
  const words: VocabularyWord[] = files.flatMap((f) => f.words);

  // 1. Tổng số từ
  const diff = Math.abs(words.length - EXPECTED_TOTAL);
  results.push(
    check(
      'Tổng số từ cấp 1-3',
      diff <= TOLERANCE,
      `${words.length} từ (mong đợi khoảng ${EXPECTED_TOTAL})`,
    ),
  );

  // 2. Số từ từng cấp
  for (const level of [1, 2, 3] as const) {
    const count = words.filter((w) => w.hskLevel === level).length;
    results.push(
      check(
        `Số từ HSK ${level}`,
        count === EXPECTED_PER_LEVEL[level],
        `${count} từ (mong đợi ${EXPECTED_PER_LEVEL[level]})`,
      ),
    );
  }

  // 3. Không trùng ID
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const word of words) {
    if (seen.has(word.id)) duplicateIds.push(word.id);
    seen.add(word.id);
  }
  results.push(
    check('Không trùng ID', duplicateIds.length === 0, duplicateIds.length === 0 ? `${seen.size} ID duy nhất` : list(duplicateIds)),
  );

  // 4. Không thiếu chữ giản thể, và phải là chữ Hán thuần
  const missingSimplified = words.filter((w) => !w.simplified?.trim()).map((w) => w.id);
  const notHan = words.filter((w) => w.simplified && !HAN.test(w.simplified)).map((w) => `${w.id}:${w.simplified}`);
  results.push(check('Không thiếu chữ giản thể', missingSimplified.length === 0, list(missingSimplified) || 'đủ'));
  results.push(check('Chữ giản thể là chữ Hán thuần', notHan.length === 0, list(notHan) || 'đạt'));

  // 5. Không thiếu pinyin
  const missingPinyin = words.filter((w) => !w.pinyin?.trim()).map((w) => w.id);
  const missingPlain = words.filter((w) => !w.pinyinPlain?.trim()).map((w) => w.id);
  results.push(check('Không thiếu pinyin', missingPinyin.length === 0, list(missingPinyin) || 'đủ'));
  results.push(check('Không thiếu pinyin không dấu', missingPlain.length === 0, list(missingPlain) || 'đủ'));

  // 6. Không thiếu cấp HSK
  const badLevel = words.filter((w) => ![1, 2, 3].includes(w.hskLevel)).map((w) => w.id);
  results.push(check('Không thiếu cấp HSK', badLevel.length === 0, list(badLevel) || 'đủ'));

  // 7. Mọi từ phải có nghĩa tiếng Anh
  const missingEn = words.filter((w) => !w.meanings?.en?.length).map((w) => w.id);
  results.push(check('Mọi từ có nghĩa tiếng Anh', missingEn.length === 0, list(missingEn) || 'đủ'));

  // 8. Nghĩa tiếng Việt lưu riêng và có trạng thái dịch
  const missingVi = words.filter((w) => !w.meanings?.vi?.length).map((w) => w.id);
  results.push(check('Mọi từ có nghĩa tiếng Việt', missingVi.length === 0, list(missingVi) || 'đủ'));

  const badStatus = words
    .filter((w) => w.translationStatus !== 'machine' && w.translationStatus !== 'reviewed')
    .map((w) => w.id);
  results.push(
    check('Trạng thái dịch hợp lệ', badStatus.length === 0, badStatus.length === 0
      ? `${words.filter((w) => w.translationStatus === 'machine').length} dịch máy, ${words.filter((w) => w.translationStatus === 'reviewed').length} đã kiểm duyệt`
      : list(badStatus)),
  );

  // 9. Câu ví dụ
  const missingExample = words.filter((w) => w.examples.length === 0).map((w) => w.id);
  results.push(check('Mọi từ có câu ví dụ', missingExample.length === 0, list(missingExample) || 'đủ'));

  const exampleWithoutWord = words
    .filter((w) => w.examples.length > 0)
    .filter((w) => {
      const forms = [w.simplified, ...(w.writtenVariants ?? [])];
      return !w.examples.some((e) => forms.some((form) => e.zh.includes(form)));
    })
    .map((w) => `${w.id}:${w.simplified}`);
  results.push(
    check('Câu ví dụ chứa từ đang học', exampleWithoutWord.length === 0, list(exampleWithoutWord) || 'đạt'),
  );

  const exampleMissingPinyin = words
    .flatMap((w) => w.examples.map((e) => ({ id: w.id, e })))
    .filter(({ e }) => e.zh.trim() !== '' && e.pinyin.trim() === '')
    .map(({ id }) => id);
  results.push(check('Câu ví dụ có pinyin', exampleMissingPinyin.length === 0, list(exampleMissingPinyin) || 'đủ'));

  const exampleMissingVi = words
    .flatMap((w) => w.examples.map((e) => ({ id: w.id, e })))
    .filter(({ e }) => e.vi.trim() === '' || e.en.trim() === '')
    .map(({ id }) => id);
  results.push(check('Câu ví dụ có bản dịch Việt và Anh', exampleMissingVi.length === 0, list(exampleMissingVi) || 'đủ'));

  // 10. Buổi học
  const lessons = files.flatMap((f) => f.lessons);
  const lessonIds = new Set(lessons.map((l) => l.id));
  results.push(check('Không trùng mã buổi học', lessonIds.size === lessons.length, `${lessons.length} buổi`));

  const covered = new Set(lessons.flatMap((l) => l.wordIds));
  const uncovered = words.filter((w) => !covered.has(w.id)).map((w) => w.id);
  results.push(check('Mọi từ đều thuộc một buổi học', uncovered.length === 0, list(uncovered) || `${covered.size} từ đã xếp buổi`));

  const oddSizes = lessons.filter((l) => l.wordIds.length < 8 || l.wordIds.length > 12).map((l) => `${l.id}:${l.wordIds.length}`);
  results.push(check('Mỗi buổi khoảng 10 từ', oddSizes.length === 0, list(oddSizes) || `${lessons.length} buổi, 8-12 từ mỗi buổi`));

  const wordIdSet = new Set(words.map((w) => w.id));
  const danglingLessonWords = lessons
    .flatMap((l) => l.wordIds.filter((id) => !wordIdSet.has(id)).map((id) => `${l.id}:${id}`));
  results.push(check('Buổi học không trỏ tới từ lạ', danglingLessonWords.length === 0, list(danglingLessonWords) || 'đạt'));

  // 11. Manifest khớp dữ liệu
  if (manifest) {
    results.push(
      check('Manifest khớp tổng số từ', manifest.totalWords === words.length, `${manifest.totalWords} / ${words.length}`),
    );
    const levelsMatch = manifest.levels.every((entry) => {
      const file = files.find((f) => f.level === entry.level);
      return file !== undefined && file.words.length === entry.words && file.lessons.length === entry.lessons;
    });
    results.push(check('Manifest khớp từng cấp', levelsMatch, levelsMatch ? 'đạt' : 'lệch số liệu'));
    results.push(
      check('Manifest ghi rõ nguồn và giấy phép', manifest.sources.length >= 2 && manifest.sources.every((s) => s.license && s.version), `${manifest.sources.length} nguồn`),
    );
    const mislabeled = /hsk\s*2026/i.test(JSON.stringify(manifest));
    results.push(check('Không gắn nhãn HSK 2026', !mislabeled, mislabeled ? 'phát hiện nhãn sai' : 'đạt'));
  }

  return results;
}

export function summarize(results: readonly CheckResult[]): { passed: number; failed: number } {
  return {
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
  };
}
