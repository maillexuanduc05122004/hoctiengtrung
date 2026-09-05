import { describe, expect, it } from 'vitest';
import { EXPECTED_PER_LEVEL, EXPECTED_TOTAL, summarize, verifyDataset } from './verify.ts';
import { splitIntoLessons } from './hsk.ts';
import type { HskLevel, LevelDataFile, VocabularyWord } from '../../src/types/vocabulary.ts';

function makeWord(id: string, level: HskLevel, simplified: string): VocabularyWord {
  return {
    id,
    simplified,
    pinyin: 'nǐ hǎo',
    pinyinPlain: 'ni hao',
    hskLevel: level,
    partOfSpeech: ['V'],
    meanings: { vi: ['chào'], en: ['hello'] },
    aliases: { vi: [], en: [], pinyin: [] },
    examples: [{ zh: `我说${simplified}。`, pinyin: 'wǒ shuō', vi: 'Tôi nói.', en: 'I say.' }],
    source: 'nguồn kiểm thử',
    datasetVersion: '1.0.0',
    translationStatus: 'machine',
  };
}

const CHARACTERS = '一二三四五六七八九十上下大小人口日月水火山川木金土天地中文字明';

/** Sinh chuỗi chữ Hán duy nhất bằng cách đổi cơ số sang bảng ký tự trên. */
function hanCode(value: number): string {
  const base = CHARACTERS.length;
  let n = value;
  let out = '';
  do {
    out = CHARACTERS[n % base] + out;
    n = Math.floor(n / base);
  } while (n > 0);
  return out;
}

/** Dựng một bộ dữ liệu hợp lệ đúng số lượng thật của HSK 3.0 cấp 1-3. */
function makeDataset(): LevelDataFile[] {
  return ([1, 2, 3] as const).map((level) => {
    const words = Array.from({ length: EXPECTED_PER_LEVEL[level] }, (_, i) =>
      makeWord(`L${level}-${String(i + 1).padStart(4, '0')}`, level, hanCode(level * 10000 + i)),
    );
    const groups = splitIntoLessons(words, 10);
    return {
      level,
      datasetVersion: '1.0.0',
      words,
      lessons: groups.map((group, i) => ({
        id: `L${level}-B${String(i + 1).padStart(2, '0')}`,
        level,
        index: i + 1,
        wordIds: group.map((w) => w.id),
        range: { from: group[0].simplified, to: group[group.length - 1].simplified },
      })),
    };
  });
}

function failures(files: LevelDataFile[]): string[] {
  return verifyDataset(files)
    .filter((r) => !r.passed)
    .map((r) => r.name);
}

describe('verifyDataset', () => {
  it('bộ dữ liệu đúng chuẩn thì mọi kiểm tra đều đạt', () => {
    const results = verifyDataset(makeDataset());
    expect(summarize(results).failed).toBe(0);
  });

  it('đếm đúng tổng số từ cấp 1 đến 3', () => {
    const files = makeDataset();
    const total = files.reduce((sum, f) => sum + f.words.length, 0);
    expect(total).toBe(EXPECTED_TOTAL);
    expect(total).toBe(2245);
  });

  it('đếm đúng số từ từng cấp', () => {
    const files = makeDataset();
    expect(files.map((f) => f.words.length)).toEqual([500, 772, 973]);
  });

  it('phát hiện ID bị trùng', () => {
    const files = makeDataset();
    files[0].words[3] = { ...files[0].words[3], id: files[0].words[0].id };
    expect(failures(files)).toContain('Không trùng ID');
  });

  it('phát hiện thiếu số từ', () => {
    const files = makeDataset();
    files[1].words = files[1].words.slice(0, 700);
    const names = failures(files);
    expect(names).toContain('Số từ HSK 2');
    expect(names).toContain('Tổng số từ cấp 1-3');
  });

  it('phát hiện thiếu pinyin', () => {
    const files = makeDataset();
    files[0].words[10] = { ...files[0].words[10], pinyin: '' };
    expect(failures(files)).toContain('Không thiếu pinyin');
  });

  it('phát hiện thiếu nghĩa tiếng Anh', () => {
    const files = makeDataset();
    files[2].words[5] = {
      ...files[2].words[5],
      meanings: { vi: ['chào'], en: [] },
    };
    expect(failures(files)).toContain('Mọi từ có nghĩa tiếng Anh');
  });

  it('phát hiện thiếu nghĩa tiếng Việt', () => {
    const files = makeDataset();
    files[0].words[7] = { ...files[0].words[7], meanings: { vi: [], en: ['hello'] } };
    expect(failures(files)).toContain('Mọi từ có nghĩa tiếng Việt');
  });

  it('phát hiện câu ví dụ không chứa từ đang học', () => {
    const files = makeDataset();
    files[0].words[2] = {
      ...files[0].words[2],
      examples: [{ zh: '这是别的句子。', pinyin: 'zhè shì', vi: 'Câu khác.', en: 'Other.' }],
    };
    expect(failures(files)).toContain('Câu ví dụ chứa từ đang học');
  });

  it('phát hiện từ không thuộc buổi học nào', () => {
    const files = makeDataset();
    files[0].lessons = files[0].lessons.slice(0, 10);
    expect(failures(files)).toContain('Mọi từ đều thuộc một buổi học');
  });

  it('phát hiện buổi học có số từ bất thường', () => {
    const files = makeDataset();
    files[0].lessons[0] = { ...files[0].lessons[0], wordIds: files[0].lessons[0].wordIds.slice(0, 2) };
    expect(failures(files)).toContain('Mỗi buổi khoảng 10 từ');
  });

  it('phát hiện trạng thái dịch không hợp lệ', () => {
    const files = makeDataset();
    files[0].words[1] = {
      ...files[0].words[1],
      // Ép kiểu qua `unknown` vì đây đúng là dữ liệu hỏng cần bị bắt lỗi.
      translationStatus: 'unknown' as unknown as VocabularyWord['translationStatus'],
    };
    expect(failures(files)).toContain('Trạng thái dịch hợp lệ');
  });
});

describe('splitIntoLessons', () => {
  it('chia 500 từ thành 50 buổi đúng 10 từ', () => {
    const lessons = splitIntoLessons(Array.from({ length: 500 }, (_, i) => i), 10);
    expect(lessons).toHaveLength(50);
    expect(new Set(lessons.map((l) => l.length))).toEqual(new Set([10]));
  });

  it('không để buổi cuối bị hụt quá nhiều', () => {
    for (const total of [772, 973, 137, 41]) {
      const lessons = splitIntoLessons(Array.from({ length: total }, (_, i) => i), 10);
      const sizes = lessons.map((l) => l.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it('không mất từ nào và không lặp từ', () => {
    const items = Array.from({ length: 973 }, (_, i) => `w${i}`);
    const flat = splitIntoLessons(items, 10).flat();
    expect(flat).toHaveLength(items.length);
    expect(new Set(flat).size).toBe(items.length);
  });

  it('danh sách rỗng cho ra không buổi nào', () => {
    expect(splitIntoLessons([], 10)).toEqual([]);
  });
});
