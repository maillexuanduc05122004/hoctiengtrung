export { matchAnswer } from './match.ts';
export type { MatchDiffPart, MatchOptions, MatchReason, MatchResult } from './match.ts';

export {
  alignSequences,
  damerauLevenshtein,
  damerauLevenshteinSeq,
  similarity,
  similaritySeq,
} from './distance.ts';
export type { AlignOp, AlignOpKind } from './distance.ts';

export {
  englishForms,
  hanziChars,
  isBlankAnswer,
  normalizeBasic,
  normalizeEn,
  normalizeHanzi,
  normalizePinyin,
  normalizeVi,
  normalizeViPlain,
  pinyinFallbackKey,
  stripVietnameseDiacritics,
  tonesEqual,
} from './normalize.ts';
export type { NormalizedPinyin } from './normalize.ts';
