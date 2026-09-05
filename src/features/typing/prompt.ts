/**
 * Sinh đề bài và chấm điểm cho chế độ gõ đáp án.
 *
 * Tệp này cố ý không dính React. Nhờ vậy bốn dạng đề và toàn bộ cách chấm được
 * kiểm thử thẳng bằng Vitest, còn phần giao diện chỉ việc gọi `buildChallenge`
 * rồi `gradeChallenge` mà không phải biết gì về luật so khớp.
 */
import { matchAnswer, type MatchResult } from '../../lib/answer-matcher/index.ts';
import type { AnswerKind, AnswerVerdict } from '../../types/study.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

/** Bốn dạng đề của chế độ gõ. */
export type TypingPromptKind = 'vi-to-zh' | 'en-to-zh' | 'zh-to-pinyin' | 'pinyin-to-meaning';

/** Một cách chấm: kiểu nội dung phải gõ cùng danh sách đáp án được chấp nhận. */
export interface TypingAnswerSet {
  answerKind: AnswerKind;
  expected: string[];
  aliases: string[];
}

export interface TypingChallenge {
  kind: TypingPromptKind;
  /** Nội dung đề bài hiển thị. */
  question: string;
  /** Nhãn mô tả việc cần làm, ví dụ "Gõ chữ Hán hoặc pinyin". */
  instruction: string;
  /** Kiểu nội dung người học phải gõ, dùng cho matchAnswer. */
  answerKind: AnswerKind;
  expected: string[];
  aliases: string[];
  /** Nhãn ngắn cho biết đề bài đang cho gì, ví dụ "Nghĩa tiếng Việt". */
  questionLabel: string;
  /** Loại nội dung của đề bài, để giao diện chọn phông chữ và thuộc tính lang. */
  questionKind: AnswerKind;
  /**
   * Cách chấm thứ hai, dành cho những dạng chấp nhận hai kiểu đáp án: chữ Hán
   * HOẶC pinyin, nghĩa tiếng Việt HOẶC nghĩa tiếng Anh. `gradeChallenge` thử cả
   * hai rồi giữ kết quả có lợi hơn cho người học.
   */
  alternate: TypingAnswerSet | null;
}

/** Bỏ chuỗi rỗng và khoảng trắng thừa; dữ liệu nhập máy đôi khi còn sót. */
function clean(list: readonly string[] | undefined): string[] {
  const out: string[] = [];
  for (const item of list ?? []) {
    const value = item.trim();
    if (value !== '' && !out.includes(value)) out.push(value);
  }
  return out;
}

function hanziAnswers(word: VocabularyWord): TypingAnswerSet {
  const aliases = clean(word.writtenVariants);
  // Người học gõ bằng bàn phím phồn thể vẫn nhớ đúng từ, nên tính là đáp án phụ.
  if (word.traditional !== undefined && word.traditional !== word.simplified) {
    aliases.push(word.traditional);
  }
  return { answerKind: 'hanzi', expected: [word.simplified], aliases };
}

function pinyinAnswers(word: VocabularyWord): TypingAnswerSet {
  return { answerKind: 'pinyin', expected: [word.pinyin.trim()], aliases: clean(word.aliases.pinyin) };
}

function viAnswers(word: VocabularyWord): TypingAnswerSet {
  return { answerKind: 'vi', expected: clean(word.meanings.vi), aliases: clean(word.aliases.vi) };
}

function enAnswers(word: VocabularyWord): TypingAnswerSet {
  return { answerKind: 'en', expected: clean(word.meanings.en), aliases: clean(word.aliases.en) };
}

/** Thứ tự cố định để việc bốc đề bằng một số ngẫu nhiên là đoán trước được. */
const KIND_ORDER: readonly TypingPromptKind[] = [
  'vi-to-zh',
  'en-to-zh',
  'zh-to-pinyin',
  'pinyin-to-meaning',
];

/**
 * Những dạng đề ra được với dữ liệu của từ này.
 *
 * Một số từ dịch máy còn thiếu nghĩa tiếng Việt hoặc tiếng Anh; ra đề từ ô trống
 * thì người học không thể nào trả lời đúng nên phải loại bỏ ngay từ đầu.
 */
function availableKinds(word: VocabularyWord): TypingPromptKind[] {
  const hasVi = viAnswers(word).expected.length > 0;
  const hasEn = enAnswers(word).expected.length > 0;
  const hasPinyin = word.pinyin.trim() !== '';
  const kinds = KIND_ORDER.filter((kind) => {
    switch (kind) {
      case 'vi-to-zh':
        return hasVi;
      case 'en-to-zh':
        return hasEn;
      case 'zh-to-pinyin':
        return hasPinyin;
      case 'pinyin-to-meaning':
        return hasPinyin && (hasVi || hasEn);
    }
  });
  // Hết sạch dữ liệu thì chữ Hán vẫn còn, nên lui về dạng lấy chữ Hán làm ĐÁP ÁN.
  // Lui về "chữ Hán -> pinyin" mới là hỏng: đáp án của dạng đó là pinyin, mà đúng
  // lúc này pinyin rỗng, nên người học gõ gì cũng sai và nút gợi ý không mở được gì.
  return kinds.length > 0 ? kinds : ['vi-to-zh'];
}

function meaningToHanzi(word: VocabularyWord, kind: 'vi-to-zh' | 'en-to-zh'): TypingChallenge {
  const source = kind === 'vi-to-zh' ? viAnswers(word) : enAnswers(word);
  const pinyin = pinyinAnswers(word);
  const hasPinyin = pinyin.expected[0] !== '';
  return {
    kind,
    question: source.expected.join('; '),
    instruction: hasPinyin ? 'Gõ chữ Hán hoặc pinyin' : 'Gõ chữ Hán',
    ...hanziAnswers(word),
    questionLabel: kind === 'vi-to-zh' ? 'Nghĩa tiếng Việt' : 'Nghĩa tiếng Anh',
    questionKind: kind === 'vi-to-zh' ? 'vi' : 'en',
    alternate: hasPinyin ? pinyin : null,
  };
}

function hanziToPinyin(word: VocabularyWord): TypingChallenge {
  return {
    kind: 'zh-to-pinyin',
    question: word.simplified,
    instruction: 'Gõ pinyin, có dấu thanh càng tốt',
    ...pinyinAnswers(word),
    questionLabel: 'Chữ Hán',
    questionKind: 'hanzi',
    alternate: null,
  };
}

function pinyinToMeaning(word: VocabularyWord): TypingChallenge {
  const vi = viAnswers(word);
  const en = enAnswers(word);
  // Ưu tiên tiếng Việt vì đây là ngôn ngữ mẹ đẻ của người dùng ứng dụng.
  const primary = vi.expected.length > 0 ? vi : en;
  const other = primary === vi ? en : vi;
  const both = vi.expected.length > 0 && en.expected.length > 0;
  return {
    kind: 'pinyin-to-meaning',
    question: word.pinyin.trim(),
    instruction: both
      ? 'Gõ nghĩa tiếng Việt hoặc tiếng Anh'
      : primary.answerKind === 'vi'
        ? 'Gõ nghĩa tiếng Việt'
        : 'Gõ nghĩa tiếng Anh',
    ...primary,
    questionLabel: 'Pinyin',
    questionKind: 'pinyin',
    alternate: other.expected.length > 0 ? other : null,
  };
}

/** Dựng đề bài của một dạng cụ thể. */
export function makeChallenge(word: VocabularyWord, kind: TypingPromptKind): TypingChallenge {
  switch (kind) {
    case 'vi-to-zh':
    case 'en-to-zh':
      return meaningToHanzi(word, kind);
    case 'zh-to-pinyin':
      return hanziToPinyin(word);
    case 'pinyin-to-meaning':
      return pinyinToMeaning(word);
  }
}

/**
 * Bốc một dạng đề cho từ này.
 *
 * Nhận `random` từ bên ngoài để phần kiểm thử và phần giao diện đều điều khiển
 * được kết quả: giao diện gieo hạt theo mã từ nên cùng một từ trong một phiên
 * luôn ra cùng một dạng đề, không đổi giữa chừng khi React vẽ lại.
 */
export function buildChallenge(word: VocabularyWord, random: () => number = Math.random): TypingChallenge {
  const kinds = availableKinds(word);
  const roll = random();
  // Chặn hai đầu để một bộ sinh trả về 1 hay NaN cũng không làm chỉ số vượt mảng.
  const safe = Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0;
  return makeChallenge(word, kinds[Math.floor(safe * kinds.length)]);
}

/**
 * Các phần mở dần của đáp án cho nút gợi ý.
 *
 * Chữ Hán mở theo từng chữ; pinyin và nghĩa mở theo từng âm tiết hoặc từng
 * tiếng, vì mở theo chữ cái thì gợi ý gần như vô nghĩa.
 */
export function hintUnits(challenge: TypingChallenge): string[] {
  const answer = (challenge.expected[0] ?? '').trim();
  if (answer === '') return [];
  if (challenge.answerKind === 'hanzi') return [...answer];
  return answer.split(/\s+/).filter((unit) => unit !== '');
}

const VERDICT_RANK: Record<AnswerVerdict, number> = { correct: 2, close: 1, wrong: 0 };

/** Kết luận quan trọng hơn độ giống: "gần đúng" luôn hơn "chưa đúng" giống 90%. */
function score(result: MatchResult): number {
  return VERDICT_RANK[result.verdict] * 10 + result.similarity;
}

/**
 * Chấm một câu trả lời của chế độ gõ.
 *
 * Với dạng cho phép hai kiểu đáp án, thử lần lượt cả hai cách chấm rồi giữ kết
 * quả tốt hơn: người gõ "ài" và người gõ "爱" đều đang nhớ đúng từ đó.
 */
export function gradeChallenge(
  challenge: TypingChallenge,
  input: string,
  usedHint: boolean,
): MatchResult {
  const primary = matchAnswer(input, {
    kind: challenge.answerKind,
    expected: challenge.expected,
    aliases: challenge.aliases,
    usedHint,
  });
  const alternate = challenge.alternate;
  if (alternate === null) return primary;

  const second = matchAnswer(input, {
    kind: alternate.answerKind,
    expected: alternate.expected,
    aliases: alternate.aliases,
    usedHint,
  });
  return score(second) > score(primary) ? second : primary;
}

/**
 * Bộ sinh số giả ngẫu nhiên gieo bằng chuỗi (mulberry32).
 *
 * Dùng để dạng đề của một từ đứng yên trong suốt câu hỏi: nếu gọi thẳng
 * Math.random trong lúc vẽ thì mỗi lần React vẽ lại là đề đổi một kiểu.
 */
export function seededRandom(seed: string): () => number {
  let state = 0x9e3779b9;
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 0x01000193) >>> 0;
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
