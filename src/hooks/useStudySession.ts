import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  countByMode,
  dayKey,
  getCard,
  getCards,
  getDueCards,
  getNewWordIds,
  getStarredCards,
  recordReview,
  saveCard,
  toggleStar as toggleStarInDb,
} from '../db/index.ts';
import { applyReview, createInitialCard, ratingFromAnswer } from '../lib/srs/index.ts';
import { useVocabulary } from './vocabulary-context.ts';
import { useSettings } from './settings-context.ts';
import type { AnswerVerdict, CardState, StudyMode } from '../types/study.ts';
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
  /**
   * Số thẻ đã bỏ qua.
   *
   * Đếm riêng vì thanh tiến độ phải chạy theo `done + skipped`: bỏ qua ba thẻ mà
   * thanh vẫn đứng im thì màn hình nói "2/20" trong khi người học đang ở thẻ
   * thứ sáu, rồi phiên kết thúc đột ngột ở mức 60%.
   */
  skipped: number;
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
  /** Thẻ ghi nhớ của từ đang hiện, để giao diện xem trước hạn ôn kế tiếp. */
  currentCard: CardState | null;
  /** Mốc đọc kho, dùng làm "bây giờ" khi tính hạn ôn để hiển thị. */
  readAt: number;
  index: number;
  stats: SessionStats;
  /**
   * Tổng số từ nguồn này đang có, trước khi cắt còn `limit`.
   *
   * Giao diện phải nói ra con số này: lưu 63 từ mà mỗi phiên chỉ gặp 20 thì
   * người học cần biết mình đang ở đâu trong số đó, thay vì tưởng sổ tay chỉ
   * có 20 từ.
   */
  poolTotal: number;
  finished: boolean;
  submit: (input: SubmitInput) => Promise<void>;
  skip: () => void;
  /** Dựng lại hàng đợi từ kho: một phiên mới cùng nguồn từ. */
  restart: () => void;
  /** Phát lại đúng những từ vừa học, không đụng tới kho. */
  replay: () => void;
  /** Phát lại riêng những từ đã trả lời chưa đúng trong phiên này. */
  replayMissed: () => void;
  /** Các từ đã trả lời sai hoặc gần đúng trong phiên này. */
  missed: VocabularyWord[];
  starred: ReadonlySet<string>;
  toggleStar: (wordId: string) => Promise<boolean>;
}

const MODES: readonly StudyMode[] = ['flashcards', 'typing', 'listening', 'speaking'];

const EMPTY_STATS: SessionStats = {
  total: 0,
  done: 0,
  correct: 0,
  close: 0,
  wrong: 0,
  hinted: 0,
  skipped: 0,
};
const EMPTY_QUEUE: VocabularyWord[] = [];
const EMPTY_STARRED: ReadonlySet<string> = new Set<string>();
const EMPTY_CARDS: ReadonlyMap<string, CardState> = new Map<string, CardState>();

/** Kết quả của một lần dựng hàng đợi, gắn với khoá yêu cầu đã sinh ra nó. */
interface LoadedSession {
  key: string;
  queue: VocabularyWord[];
  /** Số từ nguồn này có, trước khi cắt còn `limit`. */
  total: number;
  starred: ReadonlySet<string>;
  cards: ReadonlyMap<string, CardState>;
  /**
   * Mốc của lần đọc kho, dùng làm "bây giờ" cho phần xem trước hạn ôn.
   *
   * Chốt ở đây chứ không đọc đồng hồ giữa lúc vẽ: gọi `Date.now()` trong thân
   * thành phần thì mỗi lượt vẽ lại cho một con số khác, mà khoảng "3 ngày" trên
   * nút chấm không cần chính xác tới từng lượt vẽ.
   */
  at: number;
}

/** Một hàng đợi do chính người học yêu cầu phát lại, không đọc lại kho. */
interface ReplayQueue {
  /** Tăng sau mỗi lần yêu cầu, để phát lại hai lần liên tiếp vẫn khởi động lại. */
  token: number;
  words: VocabularyWord[];
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
  const [replayed, setReplayed] = useState<ReplayQueue | null>(null);
  // Ghi theo mã từ chứ không theo đối tượng: một từ trả lời sai hai lần trong
  // cùng phiên vẫn chỉ là một từ cần xem lại.
  const [missedIds, setMissedIds] = useState<readonly string[]>([]);

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

    /** Trả về cả hàng đợi đã cắt lẫn tổng số từ nguồn này đang có. */
    const build = async (): Promise<{ words: VocabularyWord[]; total: number }> => {
      if (pool === 'starred') {
        /*
          Sổ tay là danh sách cá nhân, không phải một lát cắt của bộ từ, nên KHÔNG
          lọc theo cấp đang chọn: lưu một từ HSK 3 rồi quay về học HSK 1 mà từ đó
          biến mất thì chẳng khác gì mất dữ liệu.

          Thứ tự là "lâu chưa ôn nhất trước", không phải "lưu lâu nhất trước" và
          cũng không xáo trộn. Lý do: khoá sắp xếp phải là thứ THAY ĐỔI sau mỗi
          lượt học, nếu không thì phiên nào cũng cắt ra đúng 20 từ đầu danh sách
          và từ thứ 21 trở đi không bao giờ tới lượt. `lastReviewedAt` được ghi
          lại sau mỗi lượt ôn nên nhóm vừa học tự tụt xuống cuối, phiên sau lấy
          sang nhóm kế tiếp và cả sổ tay đi hết được một vòng.

          Từ chưa ôn lần nào có `lastReviewedAt` là null nên tự đứng đầu — đúng
          thứ tự người học mong: những từ mới lưu vì thấy khó được gặp trước.
        */
        const saved = await getStarredCards();
        saved.sort(
          (a, b) =>
            (a.lastReviewedAt ?? 0) - (b.lastReviewedAt ?? 0) ||
            (a.starredAt ?? 0) - (b.starredAt ?? 0) ||
            a.wordId.localeCompare(b.wordId),
        );
        const words = saved
          .map((card) => vocabulary.byId.get(card.wordId))
          .filter((word): word is VocabularyWord => word !== undefined);
        return { words: words.slice(0, limit), total: words.length };
      }

      const ids = candidates.map((w) => w.id);
      if (ids.length === 0) return { words: [], total: 0 };
      const byId = new Map(candidates.map((w) => [w.id, w]));
      const pick = (list: readonly string[]): VocabularyWord[] =>
        list.map((id) => byId.get(id)).filter((w): w is VocabularyWord => w !== undefined);

      if (pool === 'new') {
        const all = pick(await getNewWordIds(ids, ids.length));
        return { words: all.slice(0, limit), total: all.length };
      }
      if (pool === 'due') {
        const due = await getDueCards(ids, Date.now(), ids.length);
        const all = pick(due.map((card) => card.wordId));
        return { words: all.slice(0, limit), total: all.length };
      }
      if (pool === 'lesson') {
        // Buổi học giữ nguyên thứ tự trong danh sách gốc để người học đi tuần tự,
        // và học cả buổi chứ không cắt theo `limit`.
        return { words: [...candidates], total: candidates.length };
      }

      // 'mixed': ưu tiên từ tới hạn ôn rồi bù thêm từ mới cho đủ số lượng.
      const due = await getDueCards(ids, Date.now(), limit);
      const dueWords = pick(due.map((card) => card.wordId));
      const remaining = limit - dueWords.length;
      if (remaining <= 0) return { words: dueWords, total: dueWords.length };
      const fresh = pick(await getNewWordIds(ids, Math.min(remaining, settings.newPerDay)));
      const words = [...dueWords, ...fresh];
      return { words, total: words.length };
    };

    build()
      .then(async ({ words, total }) => {
        if (!active) return;
        const cards = await getCards(words.map((w) => w.id));
        if (!active) return;
        setLoaded({
          key: requestKey,
          queue: words,
          total,
          cards,
          at: Date.now(),
          starred: new Set([...cards.values()].filter((c) => c.starred).map((c) => c.wordId)),
        });
        setCursor(0);
        setReplayed(null);
        setMissedIds([]);
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
  }, [candidates, pool, limit, settings.newPerDay, vocabularyLoading, requestKey, vocabulary.byId]);

  const ready = loaded?.key === requestKey;
  const failed = failure?.key === requestKey;
  const loading = vocabularyLoading || (!ready && !failed);
  // Hàng đợi phát lại đứng trước hàng đợi dựng từ kho: đó là lựa chọn người học
  // vừa bấm, còn hàng đợi kia là kết quả của lần dựng trước đó.
  const built = ready ? loaded.queue : EMPTY_QUEUE;
  const queue = replayed !== null ? replayed.words : built;
  const starred = ready ? loaded.starred : EMPTY_STARRED;
  const cards = ready ? loaded.cards : EMPTY_CARDS;
  const current = queue[cursor] ?? null;
  const currentCard = current === null ? null : (cards.get(current.id) ?? null);

  const missed = useMemo(
    () =>
      missedIds
        .map((id) => vocabulary.byId.get(id))
        .filter((word): word is VocabularyWord => word !== undefined),
    [missedIds, vocabulary.byId],
  );

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
      if (input.verdict !== 'correct') {
        setMissedIds((prev) => (prev.includes(word.id) ? prev : [...prev, word.id]));
      }
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

  const skip = useCallback(() => {
    setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    setCursor((n) => n + 1);
  }, []);

  /** Phiên mới cùng nguồn từ: dựng lại hàng đợi từ kho. */
  const restart = useCallback(() => {
    setReplayed(null);
    setAttempt((n) => n + 1);
  }, []);

  /**
   * Phát lại đúng những từ vừa học.
   *
   * Khác hẳn `restart`: dựng lại từ kho sau khi vừa học xong 20 từ mới thì đúng
   * 20 từ đó đã có thẻ nên bị loại khỏi nguồn "từ mới", và hạn ôn cũng vừa bị
   * đẩy sang tương lai nên nguồn "cần ôn" cũng rỗng. Nút nổi bật nhất cuối phiên
   * mà dẫn thẳng vào màn hình trống thì thà không có.
   */
  const replayWords = useCallback((words: readonly VocabularyWord[]) => {
    if (words.length === 0) return;
    setReplayed((prev) => ({ token: (prev?.token ?? 0) + 1, words: [...words] }));
    setCursor(0);
    setMissedIds([]);
    setStats({ ...EMPTY_STATS, total: words.length });
  }, []);

  const replay = useCallback(() => replayWords(queue), [replayWords, queue]);
  const replayMissed = useCallback(() => replayWords(missed), [replayWords, missed]);

  const toggleStar = useCallback(async (wordId: string): Promise<boolean> => {
    const next = await toggleStarInDb(wordId);
    setLoaded((prev) => {
      if (!prev) return prev;
      const copy = new Set(prev.starred);
      if (next) copy.add(wordId);
      else copy.delete(wordId);
      return { ...prev, starred: copy };
    });
    return next;
  }, []);

  return {
    loading,
    error: failed ? failure.message : null,
    queue,
    current,
    currentCard,
    readAt: ready ? loaded.at : 0,
    index: cursor,
    stats,
    poolTotal: ready ? loaded.total : 0,
    finished: (ready || replayed !== null) && queue.length > 0 && cursor >= queue.length,
    submit,
    skip,
    restart,
    replay,
    replayMissed,
    missed,
    starred,
    toggleStar,
  };
}
