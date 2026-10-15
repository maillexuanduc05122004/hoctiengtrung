/**
 * Chấm một câu pinyin gõ cho cả câu dài.
 *
 * Dựa trên `matchAnswer` (kiểu `pinyin`) của bộ chấm chung, rồi nới đúng ba
 * chỗ mà một câu dài hay vấp dù người học không sai:
 *
 * 1. 一 / 不 biến điệu. Dữ liệu ghi cách đọc thật (yìqǐ, bú tài); gõ thanh gốc
 *    (yi1qi3, bu4 tai4) cũng đúng — bản thanh gốc được dựng tự động, không
 *    chép tay vào dữ liệu.
 * 2. Thanh nhẹ. Âm tiết dữ liệu để trống thanh (de, le, ge, péngyou…) gõ thanh
 *    nào cũng được: từ điển và sách ghi lệch nhau ở đúng những âm này.
 * 3. Tuỳ chọn bỏ qua thanh điệu, cho lúc chỉ muốn luyện âm.
 */
import { matchAnswer, normalizePinyin, tonesEqual } from '../../lib/answer-matcher/index.ts';
import type { MatchDiffPart } from '../../lib/answer-matcher/index.ts';
import { formatPinyin, parsePinyin } from '../../lib/pinyin/index.ts';
import type { AnswerVerdict } from '../../types/study.ts';
import type { FixedTypingSentence } from './types.ts';

const HAN = /\p{Script=Han}/u;

/** Thanh gốc của hai chữ biến điệu. */
const BASE_TONE: Readonly<Record<string, 1 | 4>> = { 一: 1, 不: 4 };

/** Số âm tiết người học phải gõ: mỗi chữ Hán một âm tiết. */
export function syllableCount(sentence: FixedTypingSentence): number {
  return [...sentence.hanzi].filter((ch) => HAN.test(ch)).length;
}

/**
 * Pinyin của câu với 一 / 不 trả về thanh gốc (yīqǐ, bù tài), hoặc `null` khi
 * câu không có chỗ biến điệu nào — hay khi số âm tiết không khớp số chữ, vì
 * khi đó không biết âm tiết nào thuộc chữ nào.
 */
export function sandhiFreePinyin(sentence: FixedTypingSentence): string | null {
  const chars = [...sentence.hanzi].filter((ch) => HAN.test(ch));
  const syllables = parsePinyin(sentence.pinyin);
  if (syllables === null || syllables.length !== chars.length) return null;
  let changed = false;
  const restored = syllables.map((syllable, i) => {
    const base = BASE_TONE[chars[i]];
    if (base === undefined || syllable.tone === base) return syllable;
    changed = true;
    return { ...syllable, tone: base };
  });
  return changed ? formatPinyin(restored) : null;
}

export interface TypingCheck {
  verdict: AnswerVerdict;
  /** Câu người học gõ, tách theo âm tiết và đánh dấu chỗ sai. */
  diff: MatchDiffPart[];
  explanation: string;
}

export interface TypingCheckOptions {
  /** `false` thì chỉ chấm âm, không chấm thanh điệu. */
  tones: boolean;
}

/** Vị trí (đếm từ 1) các âm tiết sai thanh, bỏ qua âm tiết thanh nhẹ trong đáp án. */
function toneErrors(expected: string, input: string): number[] | null {
  const a = normalizePinyin(expected);
  const b = normalizePinyin(input);
  if (a === null || b === null || a.bases.length !== b.bases.length) return null;
  if (a.bases.some((base, i) => base !== b.bases[i])) return null;
  const errors: number[] = [];
  a.syllables.forEach((syllable, i) => {
    const neutral = syllable.tone === null || syllable.tone === 5;
    if (!neutral && !tonesEqual(syllable.tone, b.syllables[i].tone)) errors.push(i + 1);
  });
  return errors;
}

export function checkTyping(
  input: string,
  sentence: FixedTypingSentence,
  options: TypingCheckOptions,
): TypingCheck {
  const alt = sandhiFreePinyin(sentence);
  const answers = alt === null ? [sentence.pinyin] : [sentence.pinyin, alt];
  const result = matchAnswer(input, {
    kind: 'pinyin',
    expected: [sentence.pinyin],
    aliases: alt === null ? [] : [alt],
  });

  if (result.verdict === 'correct') {
    return { verdict: 'correct', diff: result.diff, explanation: 'Đúng rồi.' };
  }
  if (result.reason !== 'tone-wrong' && result.reason !== 'tone-missing') {
    return { verdict: result.verdict, diff: result.diff, explanation: result.explanation };
  }

  // Đúng hết âm, chỉ lệch thanh: xét lại thanh theo hai điều nới ở đầu tệp.
  if (!options.tones) {
    return {
      verdict: 'correct',
      diff: [{ text: input.trim(), status: 'ok' }],
      explanation: 'Đúng âm (đang bỏ qua thanh điệu).',
    };
  }
  const given = normalizePinyin(input);
  let best: number[] | null = null;
  for (const answer of answers) {
    const errors = toneErrors(answer, input);
    if (errors !== null && (best === null || errors.length < best.length)) best = errors;
  }
  if (best === null || given === null) {
    return { verdict: result.verdict, diff: result.diff, explanation: result.explanation };
  }
  if (best.length === 0) {
    return { verdict: 'correct', diff: [{ text: input.trim(), status: 'ok' }], explanation: 'Đúng rồi.' };
  }

  const wrong = new Set(best);
  const diff: MatchDiffPart[] = [];
  given.display.forEach((text, i) => {
    const status: MatchDiffPart['status'] = wrong.has(i + 1) ? 'wrong' : 'ok';
    const last = diff[diff.length - 1];
    if (last !== undefined && last.status === status) last.text += ` ${text}`;
    else diff.push({ text, status });
  });
  const explanation = !given.hasTone
    ? 'Đúng âm nhưng thiếu dấu thanh.'
    : best.length === 1
      ? `Sai thanh điệu ở âm tiết thứ ${best[0]}.`
      : `Sai thanh điệu ở ${best.length} âm tiết: thứ ${best.join(', ')}.`;
  return { verdict: 'close', diff, explanation };
}
