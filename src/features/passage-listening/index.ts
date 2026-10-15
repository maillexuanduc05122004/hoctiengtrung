export type {
  Passage,
  PassageEntry,
  PassageParagraph,
  PassageSentence,
  PassageWord,
} from './types.ts';

export { PASSAGES, findPassage, paragraphText } from './registry.ts';

export { PassagePlayer } from './PassagePlayer.tsx';
