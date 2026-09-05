import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  countByMode,
  dayKey,
  getCard,
  getCards,
  getDueCards,
  getNewWordIds,
  getStarredWordIds,
  recordReview,
  saveCard,
  toggleStar as toggleStarInDb,
} from '../db/index.ts';
import { applyReview, createInitialCard, ratingFromAnswer } from '../lib/srs/index.ts';
import { useVocabulary } from './vocabulary-context.ts';
import { useSettings } from './settings-context.ts';
import type { AnswerVerdict, StudyMode } from '../types/study.ts';
import type { HskLevel, VocabularyWord } from '../types/vocabulary.ts';

/** Nguồn từ đưa vào một phiên học. */
export type PoolKind = 'due' | 'new' | 'starred' | 'mixed' | 'lesson';

export interface StudySessionOptions {
  mode: StudyMode;
  levels: readonly HskLevel[];
  pool: PoolKind;
  /** Bắt buộc khi pool là 'lesson'. */
  lessonId?: string;
  limit?: number;
}

export interface SessionStats {
  total: number;
  done: number;
  correct: number;
  close: number;
  wrong: number;
  /** Số câu đã dùng nút trợ giúp. */
  hinted: number;
}

export interface SubmitInput {
  verdict: AnswerVerdict;
  usedHint: boolean;
  /** Nội dung người học đã nhập, để nhắc lại lỗi lần sau. */
  given: string;
  expected: string;
  elapsedMs: number;
}

export interface StudySession {
  loading: boolean;
  error: string | null;
  queue: VocabularyWord[];
  current: VocabularyWord | null;
  index: number;
  stats: SessionStats;
  finished: boolean;
  submit: (input: SubmitInput) => Promise<void>;
  skip: () => void;
  restart: () => void;
  starred: ReadonlySet<string>;
  toggleStar: (wordId: string) => Promise<void>;
}

const MODES: readonly StudyMode[] = ['flashcards', 'typing', 'listening', 'speaking'];

const EMPTY_STATS: SessionStats = { total: 0, done: 0, correct: 0, close: 0, wrong: 0, hinted: 0 };
const EMPTY_QUEUE: VocabularyWord[] = [];
const EMPTY_STARRED: ReadonlySet<string> = new Set<string>();

/** Kết quả của một lần dựng hàng đợi, gắn với khoá yêu cầu đã sinh ra nó. */
interface LoadedSession {
  key: string;
  queue: VocabularyWord[];
  starred: ReadonlySet<string>;
}

/**
 * Chế độ người học hay sai nhất, tính trên cả nhật ký ôn của từ chứ không phải
 * chế độ vừa sai: sai chín lần khi gõ đáp án rồi sai một lần khi lật thẻ thì chỗ
 * yếu vẫn là gõ đáp án. Hoà nhau thì lấy chế độ vừa sai vì đó là bằng chứng mới nhất.
 */
function weakestModeOf(
  counts: Record<StudyMode, { total: number; wrong: number }>,
  latest: StudyMode,
): StudyMode {
  let weakest = latest;
  for (const mode of MODES) {
    if (counts[mode].wrong > counts[weakest].wrong) {
      weakest = mode;
    }
  }
  return weakest;
}

/** Trộn mảng theo Fisher-Yates để thứ tự từ không lặp lại giữa các phiên. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Bộ máy của một phiên luyện tập.
 *
 * Chịu trách nhiệm dựng hàng đợi từ, chấm điểm qua FSRS và ghi lại tiến độ.
 * Phần giao diện của bốn chế độ chỉ việc hiển thị `current` rồi gọi `submit`,
 * nhờ vậy logic lặp lại ngắt quãng nằm ngoài component.
 *
 * Trạng thái "đang tải" được suy ra bằng cách so khoá yêu cầu hiện tại với khoá
 * của kết quả đã nạp, thay vì gọi setState ngay trong thân effect. Cách này
 * tránh một lượt render thừa mỗi khi đổi lựa chọn học.
 */
export function useStudySession(options: StudySessionOptions): StudySession {
  const { mode, levels, pool, lessonId, limit = 20 } = options;
  const { index: vocabulary, loading: vocabularyLoading } = useVocabulary();
  const { settings } = useSettings();

  const [loaded, setLoaded] = useState<LoadedSession | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [cursor, setCursor] = useState(0);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [attempt, setAttempt] = useState(0);

  const levelKey = [...levels].sort().join(',');
  const requestKey = `${pool}|${lessonId ?? ''}|${levelKey}|${limit}|${settings.newPerDay}|${attempt}`;

  // Tập từ ứng viên theo cấp hoặc theo buổi học đang chọn.
  const candidates = useMemo(() => {
    if (pool === 'lesson') {
      const lesson = lessonId ? vocabulary.byLesson.get(lessonId) : undefined;
      if (!lesson) return EMPTY_QUEUE;
      return lesson.wordIds
        .map((id) => vocabulary.byId.get(id))
        .filter((word): word is VocabularyWord => word !== undefined);
    }
    const wanted = new Set(levelKey.split(',').filter((s) => s !== ''));
    return vocabulary.words.filter((word) => wanted.has(String(word.hskLevel)));
  }, [pool, lessonId, vocabulary, levelKey]);

  useEffect(() => {
    if (vocabularyLoading) return undefined;
    let active = true;

    const build = async (): Promise<VocabularyWord[]> => {
      const ids = candidates.map((w) => w.id);
      if (ids.length === 0) return [];
      const byId = new Map(candidates.map((w) => [w.id, w]));
      const pick = (list: readonly string[]): VocabularyWord[] =>
        list.map((id) => byId.get(id)).filter((w): w is VocabularyWord => w !== undefined);

      if (pool === 'starred') {
        return shuffle(pick(await getStarredWordIds(ids))).slice(0, limit);
      }
      if (pool === 'new') {
        return pick(await getNewWordIds(ids, limit));
      }
      if (pool === 'due') {
        const due = await getDueCards(ids, Date.now(), limit);
        return pick(due.map((card) => card.wordId));
      }
      if (pool === 'lesson') {
        // Buổi học giữ nguyên thứ tự trong danh sách gốc để người học đi tuần tự.
        return candidates.slice(0, Math.max(limit, candidates.length));
      }

      // 'mixed': ưu tiên từ tới hạn ôn rồi bù thêm từ mới cho đủ số lượng.
      const due = await getDueCards(ids, Date.now(), limit);
      const dueWords = pick(due.map((card) => card.wordId));
      const remaining = limit - dueWords.length;
      if (remaining <= 0) return dueWords;
      const fresh = pick(await getNewWordIds(ids, Math.min(remaining, settings.newPerDay)));
      return [...dueWords, ...fresh];
    };

    build()
      .then(async (words) => {
        if (!active) return;
        const cards = await getCards(words.map((w) => w.id));
        if (!active) return;
        setLoaded({
          key: requestKey,
          queue: words,
          starred: new Set([...cards.values()].filter((c) => c.starred).map((c) => c.wordId)),
        });
        setCursor(0);
        setStats({ ...EMPTY_STATS, total: words.length });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setFailure({
          key: requestKey,
          message: cause instanceof Error ? cause.message : 'Không dựng được danh sách từ.',
        });
      });

    return () => {
      active = false;
    };
  }, [candidates, pool, limit, settings.newPerDay, vocabularyLoading, requestKey]);

  const ready = loaded?.key === requestKey;
  const failed = failure?.key === requestKey;
  const loading = vocabularyLoading || (!ready && !failed);
  const queue = ready ? loaded.queue : EMPTY_QUEUE;
  const starred = ready ? loaded.starred : EMPTY_STARRED;
  const current = queue[cursor] ?? null;

  const submit = useCallback(
    async (input: SubmitInput) => {
      const word = current;
      if (!word) return;

      setStats((prev) => ({
        ...prev,
        done: prev.done + 1,
        correct: prev.correct + (input.verdict === 'correct' ? 1 : 0),
        close: prev.close + (input.verdict === 'close' ? 1 : 0),
        wrong: prev.wrong + (input.verdict === 'wrong' ? 1 : 0),
        hinted: prev.hinted + (input.usedHint ? 1 : 0),
      }));
      setCursor((n) => n + 1);

      const now = Date.now();
      const rating = ratingFromAnswer(input.verdict, input.usedHint);

      try {
        const existing = (await getCard(word.id)) ?? createInitialCard(word.id);
        const updated = applyReview(existing, rating, now);

        // Chỗ yếu chỉ thay đổi khi có câu sai, nên câu đúng khỏi phải đọc lại nhật ký.
        let weakestMode = updated.weakestMode;
        if (input.verdict === 'wrong') {
          const counts = await countByMode(word.id);
          // Nhật ký chưa có câu vừa trả lời nên phải cộng tay câu này vào chế độ hiện tại.
          counts[mode].wrong += 1;
          weakestMode = weakestModeOf(counts, mode);
        }

        await saveCard({
          ...updated,
          // Hai cột thống kê phải đếm theo kết quả chấm bài, không theo mức FSRS.
          // Mức FSRS còn hạ điểm khi người học bấm gợi ý, nên một câu trả lời đúng
          // nhờ gợi ý chỉ còn là "khó" và không rơi vào cột nào cả. Câu "gần đúng"
          // là mức giữa nên không tính vào cả hai, giống cách thống kê ngày và
          // "chế độ hay sai" vẫn đang lấy mốc theo verdict.
          correctCount: existing.correctCount + (input.verdict === 'correct' ? 1 : 0),
          wrongCount: existing.wrongCount + (input.verdict === 'wrong' ? 1 : 0),
          lastMistake:
            input.verdict === 'correct'
              ? updated.lastMistake
              : {
                  mode,
                  at: now,
                  given: input.given,
                  expected: input.expected,
                  verdict: input.verdict,
                },
          weakestMode,
        });
        await recordReview({
          wordId: word.id,
          mode,
          rating,
          verdict: input.verdict,
          usedHint: input.usedHint,
          at: now,
          day: dayKey(now),
          elapsedMs: input.elapsedMs,
        });
      } catch (cause: unknown) {
        console.error('Không lưu được kết quả ôn tập.', cause);
      }
    },
    [mode, current],
  );

  const skip = useCallback(() => setCursor((n) => n + 1), []);
  const restart = useCallback(() => setAttempt((n) => n + 1), []);

  const toggleStar = useCallback(async (wordId: string) => {
    const next = await toggleStarInDb(wordId);
    setLoaded((prev) => {
      if (!prev) return prev;
      const copy = new Set(prev.starred);
      if (next) copy.add(wordId);
      else copy.delete(wordId);
      return { ...prev, starred: copy };
    });
  }, []);

  return {
    loading,
    error: failed ? failure.message : null,
    queue,
    current,
    index: cursor,
    stats,
    finished: ready && queue.length > 0 && cursor >= queue.length,
    submit,
    skip,
    restart,
    starred,
    toggleStar,
  };
}
