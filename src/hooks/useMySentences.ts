/**
 * Kho câu của người học trên máy chủ: câu có sẵn, câu tự dán và câu AI viết.
 *
 * Mọi thao tác ghi (`add`, `remove`, `removeBySource`, `generate`) đều cập nhật
 * danh sách tại chỗ bằng đúng dữ liệu máy chủ trả về, không nạp lại cả kho —
 * vừa đỡ một lượt mạng, vừa để bộ câu đang nghe không bị rút lại chỉ vì xoá
 * một câu. Lỗi được ném ra nguyên vẹn để nơi gọi tự quyết định nói gì với
 * người học; hook này không nuốt lỗi.
 *
 * Luôn có câu để nghe ngay: bản chụp lần nạp trước (`snapshot.ts`), hoặc chưa
 * có bản chụp thì bộ 90 câu đóng gói sẵn (`fallback.ts`). `origin` cho biết
 * đang hiện nguồn nào; bộ dự phòng mang mã giả nên trang giấu nút xoá cho tới
 * khi máy chủ trả lời. Lượt nạp thật tự thử lại trong lúc máy chủ thức dậy
 * (`retry.ts`); mọi thao tác ghi cũng cập nhật bản chụp cho khớp danh sách
 * đang hiện.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FALLBACK_SENTENCES } from '../features/sentences/fallback.ts';
import { describeApiError } from '../lib/api/client.ts';
import {
  addSentences,
  deleteSentence,
  deleteSentencesBySource,
  generateSentences,
  listSentences,
} from '../lib/api/endpoints.ts';
import { withRetry } from '../lib/api/retry.ts';
import type {
  BulkSentenceResponse,
  GenerateSentencesRequest,
  GenerateSentencesResponse,
  Sentence,
  SentenceInput,
  SentenceSource,
} from '../lib/api/types.ts';
import { readSnapshot, writeSnapshot, type DataOrigin } from '../lib/storage/snapshot.ts';

/** Tên bản chụp trong localStorage. */
export const MY_SENTENCES_SNAPSHOT = 'my-sentences';

export interface UseMySentencesResult {
  sentences: Sentence[];
  /** Dữ liệu đang hiện đến từ đâu; `server` nghĩa là máy chủ đã trả lời trong phiên này. */
  origin: DataOrigin;
  /** Đang có một lượt nạp chờ máy chủ (kể cả nạp lại và các lần tự thử lại). */
  loading: boolean;
  /** Lượt nạp gần nhất thất bại hẳn (đã hết lượt thử lại, hoặc lỗi không tạm thời). */
  error: string | null;
  reload: () => void;
  add: (inputs: SentenceInput[]) => Promise<BulkSentenceResponse>;
  remove: (id: number) => Promise<void>;
  removeBySource: (source: SentenceSource) => Promise<{ message: string }>;
  generate: (request: GenerateSentencesRequest) => Promise<GenerateSentencesResponse>;
}

interface Loaded {
  /** `-1` cho bản chụp hay bộ dự phòng: có câu để nghe nhưng chưa khớp lần thử nào. */
  attempt: number;
  origin: DataOrigin;
  sentences: Sentence[];
}

function initialLoaded(): Loaded {
  const cached = readSnapshot<Sentence[]>(MY_SENTENCES_SNAPSHOT);
  return Array.isArray(cached)
    ? { attempt: -1, origin: 'snapshot', sentences: cached }
    : { attempt: -1, origin: 'builtin', sentences: [...FALLBACK_SENTENCES] };
}

/** Gộp câu mới vào danh sách, bỏ câu đã có cùng mã (máy chủ có thể trả lại câu cũ). */
function merge(current: readonly Sentence[], incoming: readonly Sentence[]): Sentence[] {
  const known = new Set(current.map((sentence) => sentence.id));
  const fresh = incoming.filter((sentence) => !known.has(sentence.id));
  return fresh.length === 0 ? [...current] : [...current, ...fresh];
}

export function useMySentences(): UseMySentencesResult {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>(initialLoaded);
  const [failure, setFailure] = useState<{ attempt: number; message: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    withRetry((signal) => listSentences(signal), { signal: controller.signal })
      .then((sentences) => {
        if (controller.signal.aborted) return;
        writeSnapshot(MY_SENTENCES_SNAPSHOT, sentences);
        setLoaded({ attempt, origin: 'server', sentences });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setFailure({ attempt, message: describeApiError(cause) });
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  /**
   * Sửa danh sách đang có mà không đụng tới lần thử hay nguồn — dùng sau mỗi
   * thao tác ghi. Lần nạp đang chờ (nếu có) sẽ mang về đúng sự thật.
   */
  const patch = useCallback((update: (current: readonly Sentence[]) => Sentence[]) => {
    setLoaded((previous) => {
      const sentences = update(previous.sentences);
      writeSnapshot(MY_SENTENCES_SNAPSHOT, sentences);
      return { ...previous, sentences };
    });
  }, []);

  const add = useCallback(
    async (inputs: SentenceInput[]) => {
      const result = await addSentences(inputs);
      if (result.sentences.length > 0) patch((current) => merge(current, result.sentences));
      return result;
    },
    [patch],
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteSentence(id);
      patch((current) => current.filter((sentence) => sentence.id !== id));
    },
    [patch],
  );

  const removeBySource = useCallback(
    async (source: SentenceSource) => {
      const result = await deleteSentencesBySource(source);
      patch((current) => current.filter((sentence) => sentence.source !== source));
      return result;
    },
    [patch],
  );

  const generate = useCallback(
    async (request: GenerateSentencesRequest) => {
      const result = await generateSentences(request);
      if (result.sentences.length > 0) patch((current) => merge(current, result.sentences));
      return result;
    },
    [patch],
  );

  return useMemo(() => {
    const current = loaded.attempt === attempt;
    const failed = failure?.attempt === attempt;
    return {
      sentences: loaded.sentences,
      origin: loaded.origin,
      loading: !current && !failed,
      error: failed ? failure.message : null,
      reload,
      add,
      remove,
      removeBySource,
      generate,
    };
  }, [add, attempt, failure, generate, loaded, reload, remove, removeBySource]);
}
