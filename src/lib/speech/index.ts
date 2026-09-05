export type {
  SpeechRecognitionAlternativeLike,
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  SpeechRecognitionResultLike,
  SpeechRecognitionResultListLike,
} from './types.ts';

export type { SpeakOptions, SpeechLang, TtsAdapter } from './tts.ts';
export { createTtsAdapter } from './tts.ts';

export type { RecognitionHandlers, RecognitionUpdate, SpeechRecognizer } from './recognition.ts';
export { createSpeechRecognizer } from './recognition.ts';

export type {
  PronunciationAssessment,
  PronunciationInput,
  PronunciationProvider,
} from './pronunciation.ts';
export {
  createRemotePronunciationProvider,
  createWebSpeechProvider,
  REMOTE_PROVIDER_ID,
  WEB_SPEECH_PROVIDER_ID,
} from './pronunciation.ts';
