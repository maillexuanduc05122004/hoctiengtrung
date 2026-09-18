/**
 * Kiểu dữ liệu trao đổi với máy chủ.
 *
 * Tên trường y hệt các record DTO phía Java; đổi tên ở đây là sai dữ liệu chứ
 * không phải chuyện thẩm mỹ. Trường máy chủ có thể bỏ trống được đánh `?`;
 * khi đó giá trị nhận về có thể là `null` nên phải so sánh bằng `== null`.
 */

// ---- Phân trang và thông điệp chung ----

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface MessageResponse {
  message: string;
}

// ---- Xác thực ----

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  nativeLanguage?: string | null;
  currentHskLevel?: number | null;
  status?: string;
  roles?: string[] | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

// ---- Từ điển CC-CEDICT ----

export interface DictionaryEntry {
  traditional: string;
  simplified: string;
  pinyinNumbered: string;
  pinyinMarked: string;
  definitions: string[];
}

// ---- Sổ từ đã học ----

export type UserWordStatus = 'LEARNING' | 'LEARNED' | 'MASTERED';

export interface UserWord {
  id: number;
  wordId: number;
  simplified: string;
  traditional?: string;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string;
  hskLevel: number;
  partOfSpeech?: string;
  status: UserWordStatus;
  note?: string;
  learnedAt: string;
}

export interface UserWordStats {
  total: number;
  byStatus: Partial<Record<UserWordStatus, number>>;
  byHskLevel: Record<string, number>;
  learnedThisWeek: number;
}

// ---- Nhập từ có duyệt ----

export interface ImportRowInput {
  simplified?: string;
  pinyin?: string;
  meaningVi?: string;
  meaningEn?: string;
}

export type ImportRowStatus = 'OK' | 'EXISTS' | 'WARNING' | 'ERROR';

export type ImportAction = 'CREATE' | 'UPDATE' | 'LINK' | 'SKIP' | 'NEEDS_INPUT';

export type DictionarySense = DictionaryEntry;

export interface ImportCandidate {
  simplified: string;
  traditional: string;
  pinyinMarked: string;
  meaningEn?: string;
  inSystem: boolean;
}

export interface ExistingWordBrief {
  id: number;
  simplified: string;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string;
  hskLevel: number;
  alreadyLearned: boolean;
}

export interface ImportPreviewRow {
  index: number;
  input: ImportRowInput;
  simplified?: string;
  traditional?: string;
  pinyin?: string;
  pinyinNumbered?: string;
  meaningVi?: string;
  meaningEn?: string;
  hskLevel?: number;
  dictionaryFound: boolean;
  pinyinMatchesDictionary?: boolean | null;
  dictionaryPinyin?: string;
  dictionarySenses: DictionarySense[];
  candidates: ImportCandidate[];
  existingWord?: ExistingWordBrief | null;
  status: ImportRowStatus;
  suggestedAction: ImportAction;
  messages: string[];
}

export interface ImportPreviewSummary {
  total: number;
  willCreate: number;
  existing: number;
  needsAttention: number;
  errors: number;
}

export interface ImportPreviewResponse {
  summary: ImportPreviewSummary;
  rows: ImportPreviewRow[];
}

export interface ImportConfirmRow {
  action: ImportAction;
  existingWordId?: number | null;
  simplified?: string;
  traditional?: string;
  pinyin?: string;
  pinyinNumbered?: string;
  meaningVi?: string;
  meaningEn?: string;
  partOfSpeech?: string;
  hskLevel?: number;
  topicIds?: number[];
}

export interface ImportRowError {
  index: number;
  message: string;
}

export interface ImportConfirmResponse {
  created: number;
  updated: number;
  linked: number;
  skipped: number;
  markedLearned: number;
  wordIds: number[];
  errors: ImportRowError[];
}

// ---- Câu của tôi và AI ----

export type SentenceSource = 'BUILTIN' | 'MANUAL' | 'AI';

export type SentenceLevel = 1 | 2 | 3;

export interface Sentence {
  id: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  level: SentenceLevel;
  source: SentenceSource;
  createdAt: string;
}

export interface SentenceInput {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  level?: SentenceLevel;
}

export interface BulkSentenceResponse {
  added: number;
  duplicates: number;
  sentences: Sentence[];
}

export interface GenerateSentencesRequest {
  count: number;
  level?: SentenceLevel;
  focusWords?: string[];
}

export interface GenerateSentencesResponse {
  requested: number;
  generated: number;
  rejected: number;
  duplicates: number;
  sentences: Sentence[];
  rejectedSamples: string[];
  model: string;
}

export interface AiStatus {
  enabled: boolean;
  model: string;
  reason?: string;
}
