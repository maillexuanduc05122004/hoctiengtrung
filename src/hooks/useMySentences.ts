/**
 * Kho câu của người học trên máy chủ: câu có sẵn, câu tự dán và câu AI viết.
 *
 * Mọi thao tác ghi (`add`, `remove`, `removeBySource`, `generate`) đều cập nhật
 * danh sách tại chỗ bằng đúng dữ liệu máy chủ trả về, không nạp lại cả kho —
 * vừa đỡ một lượt mạng, vừa để bộ câu đang nghe không bị rút lại chỉ vì xoá
 * một câu. Lỗi được ném ra nguyên vẹn để nơi gọi tự quyết định nói gì với
 * người học; hook này không nuốt lỗi.
 *
 * Lần nạp gần nhất được chụp lại (`snapshot.ts`) để mở trang lần sau có câu để
 * nghe ngay trong lúc máy chủ thức dậy; mọi thao tác ghi cũng cập nhật bản chụp
 * cho khớp với danh sách đang hiện.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeApiError } from '../lib/api/client.ts';
import {
  addSentences,
  deleteSentence,
  deleteSentencesBySource,
  generateSentences,
  listSentences,
} from '../lib/api/endpoints.ts';
import type {
  BulkSentenceResponse,
  GenerateSentencesRequest,
  GenerateSentencesResponse,
  Sentence,
  SentenceInput,
  SentenceSource,
} from '../lib/api/types.ts';
import { readSnapshot, writeSnapshot } from '../lib/storage/snapshot.ts';

/** Tên bản chụp trong localStorage. */
export const MY_SENTENCES_SNAPSHOT = 'my-sentences';

export interface UseMySentencesResult {
  sentences: Sentence[];
  /** Đang có một lượt nạp chờ máy chủ (kể cả nạp lại). */
  loading: boolean;
  /** Đã nạp thành công ít nhất một lần; nạp lại thất bại vẫn giữ `true`. */
  ready: boolean;
  error: string | null;
  reload: () => void;
  add: (inputs: SentenceInput[]) => Promise<BulkSentenceResponse>;
  remove: (id: number) => Promise<void>;
  removeBySource: (source: SentenceSource) => Promise<{ message: string }>;
  generate: (request: GenerateSentencesRequest) => Promise<GenerateSentencesResponse>;
}

const EMPTY: Sentence[] = [];

/** Gộp câu mới vào danh sách, bỏ câu đã có cùng mã (máy chủ có thể trả lại câu cũ). */
function merge(current: readonly Sentence[], incoming: readonly Sentence[]): Sentence[] {
  const known = new Set(current.map((sentence) => sentence.id));
  const fresh = incoming.filter((sentence) => !known.has(sentence.id));
  return fresh.length === 0 ? [...current] : [...current, ...fresh];
}

export function useMySentences(): UseMySentencesResult {
  const [attempt, setAttempt] = useState(0);
  // Bản chụp mang attempt -1: có câu để nghe ngay nhưng `loading` vẫn đúng tới khi máy chủ trả lời.
  const [loaded, setLoaded] = useState<{ attempt: number; sentences: Sentence[] } | null>(() => {
    const cached = readSnapshot<Sentence[]>(MY_SENTENCES_SNAPSHOT);
    return Array.isArray(cached) ? { attempt: -1, sentences: cached } : null;
  });
  const [failure, setFailure] = useState<{ attempt: number; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    listSentences()
      .then((sentences) => {
        writeSnapshot(MY_SENTENCES_SNAPSHOT, sentences);
        if (active) setLoaded({ attempt, sentences });
      })
      .catch((cause: unknown) => {
        if (active) setFailure({ attempt, message: describeApiError(cause) });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  /**
   * Sửa danh sách đang có mà không đụng tới lần thử — dùng sau mỗi thao tác ghi.
   * Chưa nạp xong lần nào thì không có gì để sửa; lần nạp đang chờ sẽ mang về
   * đúng sự thật.
   */
  const patch = useCallback((update: (current: readonly Sentence[]) => Sentence[]) => {
    setLoaded((previous) => {
      if (previous === null) return previous;
      const sentences = update(previous.sentences);
      writeSnapshot(MY_SENTENCES_SNAPSHOT, sentences);
      return { attempt: previous.attempt, sentences };
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
    const current = loaded?.attempt === attempt;
    const failed = failure?.attempt === attempt;
    return {
      sentences: current ? loaded.sentences : (loaded?.sentences ?? EMPTY),
      loading: !current && !failed,
      ready: loaded !== null,
      error: failed ? failure.message : null,
      reload,
      add,
      remove,
      removeBySource,
      generate,
    };
  }, [add, attempt, failure, generate, loaded, reload, remove, removeBySource]);
}
