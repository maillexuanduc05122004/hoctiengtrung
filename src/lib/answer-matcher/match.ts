import type { AnswerKind, AnswerVerdict } from '../../types/study.ts';
import type { AlignOp } from './distance.ts';
import { alignSequences, damerauLevenshteinSeq } from './distance.ts';
import {
  englishForms,
  hanziChars,
  isBlankAnswer,
  normalizePinyin,
  normalizeVi,
  pinyinFallbackKey,
  stripVietnameseDiacritics,
  tonesEqual,
} from './normalize.ts';

export type MatchReason =
  | 'exact'
  | 'alias'
  | 'variant'
  | 'tone-missing'
  | 'tone-wrong'
  | 'diacritics-missing'
  | 'typo'
  | 'partial'
  | 'empty'
  | 'no-match';

export interface MatchDiffPart {
  text: string;
  status: 'ok' | 'wrong' | 'missing' | 'extra';
}

export interface MatchResult {
  verdict: AnswerVerdict;
  reason: MatchReason;
  /** Đáp án khớp gần nhất, null khi không có. */
  matchedAnswer: string | null;
  /** Độ tương đồng 0..1 với đáp án gần nhất. */
  similarity: number;
  /** Chi tiết đúng/sai theo ký tự (hanzi, vi, en) hoặc theo âm tiết (pinyin). */
  diff: MatchDiffPart[];
  usedHint: boolean;
  /** Giải thích ngắn bằng tiếng Việt cho người học. */
  explanation: string;
}

export interface MatchOptions {
  kind: AnswerKind;
  /** Các đáp án chính, ít nhất một. */
  expected: string[];
  /** Đáp án phụ cũng được tính là đúng (aliases, writtenVariants). */
  aliases?: string[];
  usedHint?: boolean;
}

/** Kết quả chấm với một đáp án cụ thể, chưa xét đây là đáp án chính hay phụ. */
interface Evaluation {
  verdict: AnswerVerdict;
  reason: MatchReason;
  similarity: number;
  diff: MatchDiffPart[];
  /** Vị trí âm tiết sai thanh, đếm từ 1; chỉ dùng cho pinyin. */
  toneErrorAt: number[];
  /** Số chữ sai, chỉ dùng cho chữ Hán. */
  charErrors: number;
}

// Ngưỡng so khớp mờ. Từ ngắn không được nới lỏng vì có quá nhiều cặp chỉ khác
// nhau một chữ cái mà nghĩa hoàn toàn khác ("ba" và "bo", "shi" và "shu").
const FUZZY_MIN_LENGTH = 4;
const FUZZY_SHORT_MAX_LENGTH = 5;
const FUZZY_SHORT_MAX_DISTANCE = 1;
const FUZZY_MIN_SIMILARITY = 0.85;

/** Sai dấu (thanh điệu, dấu tiếng Việt) chỉ bị trừ nửa điểm vì phần chữ vẫn đúng. */
const MARK_ERROR_WEIGHT = 0.5;

interface FuzzyOutcome {
  close: boolean;
  similarity: number;
  distance: number;
}

function fuzzyOutcome(expected: string, given: string): FuzzyOutcome {
  const a = [...expected];
  const b = [...given];
  const distance = damerauLevenshteinSeq(a, b);
  const longest = Math.max(a.length, b.length);
  const similarity = longest === 0 ? 1 : 1 - distance / longest;
  // Hai chuỗi trùng khớp hoàn toàn thì luôn là gần đúng, nếu không kết quả "sai"
  // lại đi kèm độ tương đồng 1 và giao diện sẽ nói ngược nhau.
  if (distance === 0) return { close: true, similarity, distance };
  if (a.length < FUZZY_MIN_LENGTH) return { close: false, similarity, distance };
  if (a.length <= FUZZY_SHORT_MAX_LENGTH) {
    return { close: distance <= FUZZY_SHORT_MAX_DISTANCE, similarity, distance };
  }
  return { close: similarity >= FUZZY_MIN_SIMILARITY, similarity, distance };
}

function makeDiff(
  ops: readonly AlignOp[],
  expectedText: readonly string[],
  givenText: readonly string[],
  joiner: string,
): MatchDiffPart[] {
  const parts: MatchDiffPart[] = [];
  for (const op of ops) {
    let status: MatchDiffPart['status'];
    let text: string;
    switch (op.kind) {
      case 'equal':
        status = 'ok';
        text = givenText[op.givenIndex];
        break;
      case 'substitute':
        status = 'wrong';
        text = givenText[op.givenIndex];
        break;
      case 'delete':
        status = 'missing';
        text = expectedText[op.expectedIndex];
        break;
      case 'insert':
        status = 'extra';
        text = givenText[op.givenIndex];
        break;
    }
    const last = parts[parts.length - 1];
    // Gộp các phần liền nhau cùng trạng thái để giao diện không phải nối lại.
    if (last && last.status === status) last.text += joiner + text;
    else parts.push({ text, status });
  }
  return parts;
}

function okDiff(given: string): MatchDiffPart[] {
  return [{ text: given.trim(), status: 'ok' }];
}

function evaluation(
  verdict: AnswerVerdict,
  reason: MatchReason,
  similarity: number,
  diff: MatchDiffPart[],
  extra: Partial<Pick<Evaluation, 'toneErrorAt' | 'charErrors'>> = {},
): Evaluation {
  return {
    verdict,
    reason,
    similarity: Math.min(1, Math.max(0, similarity)),
    diff,
    toneErrorAt: extra.toneErrorAt ?? [],
    charErrors: extra.charErrors ?? 0,
  };
}

function fuzzyEvaluation(outcome: FuzzyOutcome, diff: MatchDiffPart[]): Evaluation {
  return outcome.close
    ? evaluation('close', 'typo', outcome.similarity, diff)
    : evaluation('wrong', 'no-match', outcome.similarity, diff);
}

function charDiff(expected: string, given: string): MatchDiffPart[] {
  const a = [...expected];
  const b = [...given];
  return makeDiff(alignSequences(a, b), a, b, '');
}

function evaluateHanzi(expected: string, given: string): Evaluation {
  const a = hanziChars(expected);
  const b = hanziChars(given);
  const distance = damerauLevenshteinSeq(a, b);
  const longest = Math.max(a.length, b.length);
  const similarity = longest === 0 ? 1 : 1 - distance / longest;
  if (distance === 0) return evaluation('correct', 'exact', 1, okDiff(given));

  const diff = makeDiff(alignSequences(a, b), a, b, '');
  // Từ một hoặc hai chữ quá ngắn: sai một chữ là đổi hẳn nghĩa nên vẫn tính sai.
  if (distance === 1 && a.length >= 3) {
    return evaluation('close', 'partial', similarity, diff, { charErrors: 1 });
  }
  return evaluation('wrong', 'no-match', similarity, diff, { charErrors: distance });
}

function evaluateVi(expected: string, given: string): Evaluation {
  const a = normalizeVi(expected);
  const b = normalizeVi(given);
  if (a === b) return evaluation('correct', 'exact', 1, okDiff(given));

  const diff = charDiff(a, b);
  const aPlain = stripVietnameseDiacritics(a);
  const bPlain = stripVietnameseDiacritics(b);
  if (aPlain === bPlain) {
    const distance = damerauLevenshteinSeq([...a], [...b]);
    const longest = Math.max(1, a.length, b.length);
    return evaluation(
      'close',
      'diacritics-missing',
      1 - MARK_ERROR_WEIGHT * (distance / longest),
      diff,
    );
  }
  return fuzzyEvaluation(fuzzyOutcome(aPlain, bPlain), diff);
}

function evaluateEn(expected: string, given: string): Evaluation {
  const aForms = englishForms(expected);
  const bForms = englishForms(given);
  if (aForms.length === 0 || bForms.length === 0) {
    return evaluation('wrong', 'no-match', 0, charDiff(expected, given));
  }
  if (aForms[0] === bForms[0]) return evaluation('correct', 'exact', 1, okDiff(given));
  // Khớp một vế của chuỗi nhiều nghĩa ngăn bởi dấu ";" cũng được tính là đúng,
  // kể cả khi vế đó nằm ở phía người học nhập.
  if (bForms.some((form) => aForms.includes(form))) {
    return evaluation('correct', 'variant', 1, okDiff(given));
  }

  let best: { outcome: FuzzyOutcome; a: string; b: string } | null = null;
  for (const a of aForms) {
    for (const b of bForms) {
      const outcome = fuzzyOutcome(a, b);
      if (!best || outcome.similarity > best.outcome.similarity) best = { outcome, a, b };
    }
  }
  if (!best) return evaluation('wrong', 'no-match', 0, charDiff(expected, given));
  return fuzzyEvaluation(best.outcome, charDiff(best.a, best.b));
}

function evaluatePinyin(expected: string, given: string): Evaluation {
  const a = normalizePinyin(expected);
  const b = normalizePinyin(given);
  if (!a || !b) {
    // Không tách được âm tiết hợp lệ thì chỉ còn cách so khớp mờ trên chữ cái.
    const aKey = pinyinFallbackKey(expected);
    const bKey = pinyinFallbackKey(given);
    if (aKey !== '' && aKey === bKey) return evaluation('correct', 'exact', 1, okDiff(given));
    // Một bên không còn chữ cái nào (đáp án hỏng, hoặc người học gõ chữ Hán) thì
    // không có gì để so, phải cho điểm 0 chứ không phải "giống hệt chuỗi rỗng".
    if (aKey === '' || bKey === '') {
      return evaluation('wrong', 'no-match', 0, charDiff(aKey, bKey));
    }
    return fuzzyEvaluation(fuzzyOutcome(aKey, bKey), charDiff(aKey, bKey));
  }

  const sameSyllables =
    a.bases.length === b.bases.length && a.bases.every((base, i) => base === b.bases[i]);
  if (sameSyllables) {
    const toneErrorAt: number[] = [];
    const diff: MatchDiffPart[] = b.display.map((text, i) => {
      const ok = tonesEqual(a.syllables[i].tone, b.syllables[i].tone);
      if (!ok) toneErrorAt.push(i + 1);
      return { text, status: ok ? 'ok' : 'wrong' };
    });
    if (toneErrorAt.length === 0) return evaluation('correct', 'exact', 1, okDiff(given));

    // Không nhập dấu thanh nào là quên đánh dấu, khác hẳn với đánh sai dấu.
    const reason: MatchReason = b.hasTone ? 'tone-wrong' : 'tone-missing';
    const similarity = 1 - MARK_ERROR_WEIGHT * (toneErrorAt.length / b.display.length);
    return evaluation('close', reason, similarity, diff, { toneErrorAt });
  }

  // Khác dãy âm tiết: chấm mờ trên chuỗi âm không thanh, diff ghép theo âm tiết.
  const diff = makeDiff(alignSequences(a.bases, b.bases), a.display, b.display, ' ');
  return fuzzyEvaluation(fuzzyOutcome(a.plainKey, b.plainKey), diff);
}

function evaluate(kind: AnswerKind, expected: string, given: string): Evaluation {
  switch (kind) {
    case 'hanzi':
      return evaluateHanzi(expected, given);
    case 'pinyin':
      return evaluatePinyin(expected, given);
    case 'vi':
      return evaluateVi(expected, given);
    case 'en':
      return evaluateEn(expected, given);
  }
}

function explain(result: Evaluation): string {
  switch (result.reason) {
    case 'exact':
      return 'Đúng rồi.';
    case 'alias':
      return 'Đúng rồi, đây cũng là một đáp án được chấp nhận.';
    case 'variant':
      return 'Đúng rồi, đây là một cách diễn đạt được chấp nhận.';
    case 'tone-missing':
      return 'Đúng âm nhưng thiếu dấu thanh.';
    case 'tone-wrong':
      return result.toneErrorAt.length === 1
        ? 'Sai thanh điệu ở âm tiết thứ ' + String(result.toneErrorAt[0]) + '.'
        : 'Sai thanh điệu ở các âm tiết thứ ' + result.toneErrorAt.join(', ') + '.';
    case 'diacritics-missing':
      return 'Thiếu dấu tiếng Việt.';
    case 'typo':
      return 'Gần đúng, chỉ sai vài ký tự.';
    case 'partial':
      return 'Sai ' + String(result.charErrors) + ' chữ.';
    case 'empty':
      return 'Bạn chưa nhập đáp án.';
    case 'no-match':
      return 'Chưa đúng.';
  }
}

const VERDICT_RANK: Record<AnswerVerdict, number> = { correct: 2, close: 1, wrong: 0 };
const REASON_RANK: Partial<Record<MatchReason, number>> = { exact: 3, alias: 2, variant: 1 };

/** Điểm xếp hạng: kết luận quan trọng nhất, rồi tới loại khớp, cuối cùng là độ giống. */
function rank(result: Evaluation): number {
  const reasonRank = REASON_RANK[result.reason] ?? 0;
  return VERDICT_RANK[result.verdict] * 100 + reasonRank * 10 + result.similarity;
}

/**
 * Chấm một câu trả lời. Module chỉ so khớp và giải thích; không tự hạ kết quả khi
 * người học đã dùng gợi ý, việc đó thuộc về phần tính điểm ôn tập.
 */
export function matchAnswer(input: string, options: MatchOptions): MatchResult {
  const usedHint = options.usedHint ?? false;

  if (isBlankAnswer(input)) {
    return {
      verdict: 'wrong',
      reason: 'empty',
      matchedAnswer: null,
      similarity: 0,
      diff: [],
      usedHint,
      explanation: 'Bạn chưa nhập đáp án.',
    };
  }

  const candidates: { answer: string; isAlias: boolean }[] = [];
  for (const answer of options.expected) {
    if (answer.trim() !== '') candidates.push({ answer, isAlias: false });
  }
  for (const answer of options.aliases ?? []) {
    if (answer.trim() !== '') candidates.push({ answer, isAlias: true });
  }
  if (candidates.length === 0) {
    return {
      verdict: 'wrong',
      reason: 'no-match',
      matchedAnswer: null,
      similarity: 0,
      diff: [],
      usedHint,
      explanation: 'Chưa đúng.',
    };
  }

  let best: Evaluation | null = null;
  let bestAnswer = candidates[0].answer;
  for (const candidate of candidates) {
    const current = evaluate(options.kind, candidate.answer, input);
    // Đáp án phụ vẫn là đúng, nhưng ghi rõ lý do để giao diện nói được điều đó.
    if (candidate.isAlias && current.verdict === 'correct') current.reason = 'alias';
    if (!best || rank(current) > rank(best)) {
      best = current;
      bestAnswer = candidate.answer;
    }
  }
  const chosen = best ?? evaluation('wrong', 'no-match', 0, []);

  return {
    verdict: chosen.verdict,
    reason: chosen.reason,
    matchedAnswer: bestAnswer,
    similarity: chosen.similarity,
    diff: chosen.diff,
    usedHint,
    explanation: explain(chosen),
  };
}
