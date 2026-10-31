/**
 * Kho câu cho hai cách luyện "Dịch câu" và "Luyện phát âm".
 *
 * Lấy thẳng từ các bài "Nghe cố định": câu ghép (mọi phần trừ phần từ mới đầu
 * bài) và câu dài tập gõ pinyin. Đây là những câu chỉ dùng chữ người học đã học,
 * có sẵn nghĩa tiếng Việt và pinyin đã soát tay — đúng thứ cần để vừa cho người
 * học tự dịch, vừa làm đáp án mẫu. Thêm bài nghe mới là kho tự lớn theo, không
 * phải soạn riêng câu cho hai trang này.
 */
import { FIXED_LISTENING_LESSONS, newWordsOf } from '../fixed-listening/registry.ts';
import type { FixedListeningEntry } from '../fixed-listening/types.ts';

export type SentenceSource = 'ghep' | 'dai';

export interface PracticeSentence {
  /** Mã bền qua các lần mở app, dùng để nhớ câu nào đã luyện: `bai-06:dai:3`. */
  id: string;
  lessonId: string;
  lessonNumber: number;
  source: SentenceSource;
  hanzi: string;
  pinyin: string;
  vi: string;
  /** Từ mới của bài có mặt trong câu, theo thứ tự xuất hiện. */
  newWords: string[];
}

const HAN = /\p{Script=Han}/u;

/** Số chữ Hán của câu, không tính dấu câu. */
export function hanziLength(text: string): number {
  let count = 0;
  for (const char of text) if (HAN.test(char)) count += 1;
  return count;
}

function wordsIn(hanzi: string, words: readonly string[]): string[] {
  return words
    .filter((word) => hanzi.includes(word))
    .sort((a, b) => hanzi.indexOf(a) - hanzi.indexOf(b));
}

/** Dựng kho từ danh sách bài. Câu trùng chữ Hán chỉ giữ lần xuất hiện đầu. */
export function buildPool(lessons: readonly FixedListeningEntry[]): PracticeSentence[] {
  const seen = new Set<string>();
  const out: PracticeSentence[] = [];
  const add = (
    lesson: FixedListeningEntry,
    source: SentenceSource,
    index: number,
    item: { hanzi: string; pinyin: string; vi: string },
    words: readonly string[],
  ): void => {
    const hanzi = item.hanzi.trim();
    if (hanzi === '' || item.vi.trim() === '' || seen.has(hanzi)) return;
    seen.add(hanzi);
    out.push({
      id: `${lesson.id}:${source}:${index}`,
      lessonId: lesson.id,
      lessonNumber: lesson.number,
      source,
      hanzi,
      pinyin: item.pinyin.trim(),
      vi: item.vi.trim(),
      newWords: wordsIn(hanzi, words),
    });
  };

  for (const lesson of lessons) {
    const words = newWordsOf(lesson);
    let index = 0;
    // Phần đầu là danh sách từ mới, không phải câu.
    for (const section of lesson.sections.slice(1)) {
      for (const item of section.items) add(lesson, 'ghep', (index += 1), item, words);
    }
    lesson.typing.forEach((item, i) => add(lesson, 'dai', i + 1, item, words));
  }
  return out;
}

export const PRACTICE_SENTENCES: readonly PracticeSentence[] = buildPool(FIXED_LISTENING_LESSONS);

/** Các bài có câu trong kho, để dựng ô chọn bài. */
export function lessonsInPool(
  pool: readonly PracticeSentence[],
): { id: string; number: number; count: number }[] {
  const byLesson = new Map<string, { id: string; number: number; count: number }>();
  for (const sentence of pool) {
    const entry = byLesson.get(sentence.lessonId);
    if (entry) entry.count += 1;
    else byLesson.set(sentence.lessonId, { id: sentence.lessonId, number: sentence.lessonNumber, count: 1 });
  }
  return [...byLesson.values()].sort((a, b) => a.number - b.number);
}
