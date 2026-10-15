export type {
  Passage,
  PassageEntry,
  PassageParagraph,
  PassageSentence,
  PassageWord,
} from './types.ts';

export { LEARNED_WORDS } from './learned-words.ts';

export {
  PASSAGES,
  coverageOf,
  findPassage,
  paragraphText,
  type Coverage,
} from './registry.ts';

export { PassagePlayer } from './PassagePlayer.tsx';
