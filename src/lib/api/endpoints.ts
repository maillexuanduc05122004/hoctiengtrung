/**
 * Các hàm gọi API có kiểu. Phần giao diện chỉ gọi qua đây, không gọi `apiFetch`
 * với đường dẫn viết tay rải rác — đổi một đường dẫn thì chỉ sửa một chỗ, và
 * kiểm thử giả lập được cả tệp này bằng `vi.mock`.
 */
import { apiFetch } from './client.ts';
import type {
  AiStatus,
  BulkSentenceResponse,
  DictionaryEntry,
  GenerateSentencesRequest,
  GenerateSentencesResponse,
  ImportAiResponse,
  ImportConfirmResponse,
  ImportConfirmRow,
  ImportPreviewResponse,
  ImportRowInput,
  MessageResponse,
  PageResponse,
  Sentence,
  SentenceInput,
  SentenceSource,
  UserWord,
  UserWordStats,
  UserWordStatus,
} from './types.ts';

type QueryValue = string | number | boolean | undefined | null;

/** Ghép chuỗi truy vấn, bỏ qua tham số trống để máy chủ dùng giá trị mặc định. */
function query(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded === '' ? '' : `?${encoded}`;
}

function json(body: unknown): string {
  return JSON.stringify(body);
}

// ---- Sổ từ đã học ----

export interface ListMyWordsParams {
  status?: UserWordStatus;
  hskLevel?: number;
  q?: string;
  page?: number;
  size?: number;
}

export function listMyWords(
  params: ListMyWordsParams = {},
  signal?: AbortSignal,
): Promise<PageResponse<UserWord>> {
  const path = `/me/words${query({
    status: params.status,
    hskLevel: params.hskLevel,
    q: params.q,
    page: params.page,
    size: params.size,
  })}`;
  return apiFetch<PageResponse<UserWord>>(path, { signal });
}

export function myWordStats(signal?: AbortSignal): Promise<UserWordStats> {
  return apiFetch<UserWordStats>('/me/words/stats', { signal });
}

export function upsertMyWord(
  wordId: number,
  body: { status: UserWordStatus; note?: string },
): Promise<UserWord> {
  return apiFetch<UserWord>(`/me/words/${wordId}`, { method: 'PUT', body: json(body) });
}

export function deleteMyWord(wordId: number): Promise<void> {
  return apiFetch<void>(`/me/words/${wordId}`, { method: 'DELETE' });
}

// ---- Nhập từ có duyệt vào sổ từ của mình ----

export function previewImport(body: {
  defaultHskLevel: number;
  defaultTopicIds?: number[];
  rows: ImportRowInput[];
}): Promise<ImportPreviewResponse> {
  return apiFetch<ImportPreviewResponse>('/me/words/import/preview', {
    method: 'POST',
    body: json(body),
  });
}

/** AI điền phần còn thiếu cho nội dung thô rồi trả về bảng duyệt như `previewImport`. */
export function completeImportWithAi(body: {
  text: string;
  defaultHskLevel: number;
}): Promise<ImportAiResponse> {
  return apiFetch<ImportAiResponse>('/me/words/import/ai', {
    method: 'POST',
    body: json(body),
  });
}

export function confirmImport(body: {
  markAsLearned: boolean;
  rows: ImportConfirmRow[];
}): Promise<ImportConfirmResponse> {
  return apiFetch<ImportConfirmResponse>('/me/words/import/confirm', {
    method: 'POST',
    body: json(body),
  });
}

// ---- Từ điển CC-CEDICT ----

export function lookupDictionary(q: string, signal?: AbortSignal): Promise<DictionaryEntry[]> {
  return apiFetch<DictionaryEntry[]>(`/dictionary/lookup${query({ q })}`, { signal });
}

export function reverseLookup(
  pinyin: string,
  limit?: number,
  signal?: AbortSignal,
): Promise<DictionaryEntry[]> {
  return apiFetch<DictionaryEntry[]>(`/dictionary/reverse${query({ pinyin, limit })}`, { signal });
}

/** Tìm theo nghĩa tiếng Anh hoặc chữ Hán bắt đầu bằng `q` (tối đa 50 mục). */
export function searchDictionary(
  q: string,
  limit?: number,
  signal?: AbortSignal,
): Promise<DictionaryEntry[]> {
  return apiFetch<DictionaryEntry[]>(`/dictionary/search${query({ q, limit })}`, { signal });
}

// ---- Câu của tôi ----

export function listSentences(signal?: AbortSignal): Promise<Sentence[]> {
  return apiFetch<Sentence[]>('/me/sentences', { signal });
}

export function addSentences(sentences: SentenceInput[]): Promise<BulkSentenceResponse> {
  return apiFetch<BulkSentenceResponse>('/me/sentences/bulk', {
    method: 'POST',
    body: json({ sentences }),
  });
}

export function deleteSentence(id: number): Promise<void> {
  return apiFetch<void>(`/me/sentences/${id}`, { method: 'DELETE' });
}

export function deleteSentencesBySource(source: SentenceSource): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/me/sentences${query({ source })}`, { method: 'DELETE' });
}

export function generateSentences(
  body: GenerateSentencesRequest,
): Promise<GenerateSentencesResponse> {
  return apiFetch<GenerateSentencesResponse>('/me/sentences/generate', {
    method: 'POST',
    body: json(body),
  });
}

// ---- AI ----

export function aiStatus(signal?: AbortSignal): Promise<AiStatus> {
  return apiFetch<AiStatus>('/ai/status', { signal });
}
