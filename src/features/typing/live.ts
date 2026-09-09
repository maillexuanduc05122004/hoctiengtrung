/**
 * Chấm ngay trong lúc gõ cho chế độ gõ đáp án.
 *
 * Nhịp chấm chính (`gradeChallenge`) chỉ chạy khi người học bấm "Kiểm tra": nó so
 * cả câu, tha thứ vài ký tự sai rồi giải thích lỗi. Ở đây thì ngược lại — mỗi phím
 * gõ ra chỉ phải trả lời một câu hỏi duy nhất: phần đã gõ còn nằm trên đường tới
 * một đáp án nào đó hay đã chệch. Vì vậy không dùng khoảng cách chỉnh sửa mà so
 * theo tiền tố: tìm đoạn đầu dài nhất của chuỗi đã gõ mà vẫn là mở đầu của một
 * đáp án được chấp nhận, phần còn lại là phần chệch.
 *
 * Cố ý không dính React để kiểm thử thẳng bằng Vitest, giống `prompt.ts`.
 */
import {
  isBlankAnswer,
  normalizeBasic,
  normalizeEn,
  normalizeHanzi,
  normalizeVi,
  normalizeViPlain,
  pinyinFallbackKey,
} from '../../lib/answer-matcher/index.ts';
import type { TypingAnswerSet, TypingChallenge } from './prompt.ts';

/** Một đoạn của chuỗi đang gõ: còn đúng hay đã chệch. */
export interface LivePart {
  text: string;
  status: 'ok' | 'wrong';
}

/**
 * `empty` chưa gõ gì đáng kể, `ok` đang đi đúng hướng, `wrong` đã chệch,
 * `complete` đã gõ trọn vẹn một đáp án.
 */
export type LiveStatus = 'empty' | 'ok' | 'wrong' | 'complete';

export interface LiveCheck {
  status: LiveStatus;
  /** Chuỗi đã gõ tách theo trạng thái; ghép lại đúng bằng chuỗi gốc. */
  parts: LivePart[];
  /** Số ký tự đầu của chuỗi đã gõ vẫn còn khớp một đáp án. */
  okLength: number;
  /** Lời nhắc ngắn bằng tiếng Việt, rỗng khi chưa gõ gì. */
  note: string;
}

/** Cách chuẩn hoá dùng chung cho cả đáp án lẫn chuỗi đang gõ dở. */
interface LiveMatcher {
  keyOf: (text: string) => string;
  keys: string[];
}

const NOTES: Record<LiveStatus, string> = {
  empty: '',
  ok: 'Đang đúng',
  wrong: 'Phần gạch đỏ đã chệch',
  complete: 'Khớp trọn đáp án',
};

function addKey(keys: string[], value: string): void {
  if (value !== '' && !keys.includes(value)) keys.push(value);
}

/** Đáp án nhiều nghĩa ngăn bởi ";" thì mỗi vế cũng là một đáp án gõ được. */
function forms(text: string): string[] {
  return text.includes(';') ? [text, ...text.split(';')] : [text];
}

function matchersFor(set: TypingAnswerSet): LiveMatcher[] {
  const answers = [...set.expected, ...set.aliases];
  switch (set.answerKind) {
    case 'hanzi': {
      const keys: string[] = [];
      for (const answer of answers) addKey(keys, normalizeHanzi(answer));
      return [{ keyOf: normalizeHanzi, keys }];
    }
    case 'pinyin': {
      // So trên chuỗi chữ cái đã bỏ dấu thanh: gõ dở nửa âm tiết thì chưa đặt dấu
      // được, mà đúng/sai thanh điệu đã có nhịp chấm chính nói rõ sau đó.
      const keys: string[] = [];
      for (const answer of answers) addKey(keys, pinyinFallbackKey(answer));
      return [{ keyOf: pinyinFallbackKey, keys }];
    }
    case 'vi': {
      const marked: string[] = [];
      const plain: string[] = [];
      for (const answer of answers) {
        for (const form of forms(answer)) {
          addKey(marked, normalizeVi(form));
          addKey(plain, normalizeViPlain(form));
        }
      }
      // Thiếu dấu tiếng Việt vẫn là đang đi đúng hướng — nhịp chấm chính cũng chỉ
      // trừ nửa điểm cho lỗi này — nên có thêm một cách so trên chuỗi bỏ dấu.
      return [
        { keyOf: normalizeVi, keys: marked },
        { keyOf: normalizeViPlain, keys: plain },
      ];
    }
    case 'en': {
      // Chuẩn hoá chuỗi gõ dở bằng `normalizeBasic` chứ không phải `normalizeEn`:
      // người gõ "the" cho đáp án "the cat" mà bị cắt mạo từ thì thành gõ sai.
      const keys: string[] = [];
      for (const answer of answers) {
        for (const form of forms(answer)) {
          addKey(keys, normalizeBasic(form));
          addKey(keys, normalizeEn(form));
        }
      }
      return [{ keyOf: normalizeBasic, keys }];
    }
  }
}

function challengeMatchers(challenge: TypingChallenge): LiveMatcher[] {
  const sets: TypingAnswerSet[] = [
    { answerKind: challenge.answerKind, expected: challenge.expected, aliases: challenge.aliases },
  ];
  // Dạng chấp nhận hai kiểu đáp án thì gõ theo kiểu nào cũng phải được tính là đúng.
  if (challenge.alternate !== null) sets.push(challenge.alternate);
  return sets.flatMap(matchersFor).filter((matcher) => matcher.keys.length > 0);
}

/** Đoạn vừa gõ có còn là mở đầu của một đáp án của cách so này không. */
function leadsToAnswer(matcher: LiveMatcher, prefix: string): boolean {
  const key = matcher.keyOf(prefix);
  // Chuẩn hoá xong không còn gì trong khi người học rõ ràng có gõ nghĩa là nội
  // dung đó không thuộc kiểu đáp án này (gõ chữ Hán vào câu hỏi đòi pinyin),
  // chứ không phải "chuỗi rỗng nên khớp với mọi đáp án".
  if (key === '') return isBlankAnswer(prefix);
  return matcher.keys.some((answer) => answer.startsWith(key));
}

/**
 * Đối chiếu chuỗi đang gõ dở với đáp án.
 *
 * Quét từ đoạn dài nhất trở về đoạn rỗng rồi lấy đoạn đúng đầu tiên tìm được:
 * đoạn rỗng luôn khớp nên vòng lặp luôn dừng, và cách quét này không phụ thuộc
 * vào giả định rằng cứ gõ thêm một ký tự là khoá chuẩn hoá chỉ dài thêm.
 */
export function checkLive(challenge: TypingChallenge, input: string): LiveCheck {
  const matchers = challengeMatchers(challenge);
  if (matchers.length === 0 || isBlankAnswer(input)) {
    return { status: 'empty', parts: [], okLength: 0, note: NOTES.empty };
  }

  const chars = [...input];
  let okLength = 0;
  for (let length = chars.length; length >= 0; length--) {
    const prefix = chars.slice(0, length).join('');
    if (matchers.some((matcher) => leadsToAnswer(matcher, prefix))) {
      okLength = length;
      break;
    }
  }

  const okText = chars.slice(0, okLength).join('');
  const wrongText = chars.slice(okLength).join('');
  const parts: LivePart[] = [];
  if (okText !== '') parts.push({ text: okText, status: 'ok' });
  if (wrongText !== '') parts.push({ text: wrongText, status: 'wrong' });

  const complete =
    wrongText === '' &&
    matchers.some((matcher) => {
      const key = matcher.keyOf(input);
      return key !== '' && matcher.keys.includes(key);
    });
  const status: LiveStatus = wrongText !== '' ? 'wrong' : complete ? 'complete' : 'ok';

  return { status, parts, okLength, note: NOTES[status] };
}
