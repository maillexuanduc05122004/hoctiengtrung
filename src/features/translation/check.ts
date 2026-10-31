/**
 * Chấm tại máy một câu người học tự dịch từ tiếng Việt sang tiếng Trung.
 *
 * Chỉ so được với MỘT đáp án mẫu, mà một câu tiếng Việt có nhiều cách dịch
 * đúng. Vì vậy kết quả ở đây chỉ là "giống đáp án mẫu tới đâu": trùng khớp
 * thì chắc chắn đúng; lệch thì để AI xét lại (nếu máy chủ có AI) hoặc để chính
 * người học tự đánh giá sau khi xem đáp án.
 *
 * Người học viết bằng chữ Hán (bộ gõ tiếng Trung) hay bằng pinyin đều được:
 * có chữ Hán thì so theo từng chữ, không có thì so pinyin theo từng âm tiết.
 */
import { matchAnswer, type MatchDiffPart } from '../../lib/answer-matcher/index.ts';
import type { AnswerVerdict } from '../../types/study.ts';
import { checkTyping } from '../fixed-listening/typing-check.ts';
import { containsHanzi } from '../shared/hanzi.ts';

export interface LocalTranslationCheck {
  /** Viết bằng chữ Hán hay pinyin. */
  script: 'hanzi' | 'pinyin';
  verdict: AnswerVerdict;
  diff: MatchDiffPart[];
  explanation: string;
}

export function checkTranslationLocally(
  input: string,
  expected: { hanzi: string; pinyin: string; vi: string },
): LocalTranslationCheck {
  if (containsHanzi(input)) {
    const result = matchAnswer(input, { kind: 'hanzi', expected: [expected.hanzi] });
    return {
      script: 'hanzi',
      verdict: result.verdict,
      diff: result.diff,
      explanation:
        result.verdict === 'correct'
          ? 'Trùng với đáp án mẫu.'
          : `So với đáp án mẫu: ${result.explanation.charAt(0).toLowerCase()}${result.explanation.slice(1)}`,
    };
  }
  const result = checkTyping(input, expected, { tones: true });
  return {
    script: 'pinyin',
    verdict: result.verdict,
    diff: result.diff,
    explanation:
      result.verdict === 'correct'
        ? 'Pinyin trùng với đáp án mẫu.'
        : `So pinyin với đáp án mẫu: ${result.explanation.charAt(0).toLowerCase()}${result.explanation.slice(1)}`,
  };
}
