/** Chế độ gõ đáp án: đề bài, thanh gợi ý và vòng hỏi đáp. */

export { HintBar } from './HintBar.tsx';
export type { HintBarProps } from './HintBar.tsx';

export { TypingRound } from './TypingRound.tsx';
export type { TypingRoundProps } from './TypingRound.tsx';

export {
  buildChallenge,
  gradeChallenge,
  hintUnits,
  makeChallenge,
  seededRandom,
} from './prompt.ts';
export type { TypingAnswerSet, TypingChallenge, TypingPromptKind } from './prompt.ts';

export { checkLive } from './live.ts';
export type { LiveCheck, LivePart, LiveStatus } from './live.ts';
