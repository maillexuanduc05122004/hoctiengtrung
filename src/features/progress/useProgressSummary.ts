/**
 * Lớp dữ liệu của phần theo dõi tiến độ.
 *
 * Mọi con số ở đây đều đọc thẳng từ IndexedDB rồi ghép với bộ từ vựng đang nạp.
 * Người mới chưa học gì sẽ nhận đúng số 0 chứ không có số liệu dựng sẵn nào.
 *
 * Trạng thái "đang đọc" được suy ra bằng cách so khoá yêu cầu hiện tại với khoá
 * của kết quả đã nạp, giống cách useStudySession làm, để effect không phải gọi
 * setState hai lần cho mỗi lần đổi lựa chọn.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  countLearnedByWordIds,
  countSavedLessons,
  countStarred,
  dayKey,
  getCards,
  getDueCards,
  getNewWordIds,
  getRecentDays,
  getStreak,
} from '../../db/index.ts';
import { pickNextLesson, type NextLesson } from '../lessons/next-lesson.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import type { ProgressSummary, StudyMode } from '../../types/study.ts';
import type { HskLevel } from '../../types/vocabulary.ts';

const LEVELS: readonly HskLevel[] = [1, 2, 3];
const MODES: readonly StudyMode[] = ['flashcards', 'typing', 'listening', 'speaking'];

/** Số ngày vẽ trên biểu đồ, cũng là số ngày ProgressSummary hứa trả về. */
const RECENT_DAYS = 7;

/**
 * Danh sách cấp được rút thành chuỗi để làm phụ thuộc của useMemo và useEffect:
 * mảng trong cài đặt tạo tham chiếu mới sau mỗi lần lưu, còn chuỗi thì không.
 */
function levelKeyOf(levels: readonly HskLevel[]): string {
  return [...levels].sort((a, b) => a - b).join(',');
}

function idsOfLevels(words: readonly { id: string; hskLevel: HskLevel }[], key: string): string[] {
  const wanted = new Set(key.split(',').filter((part) => part !== ''));
  return words.filter((word) => wanted.has(String(word.hskLevel))).map((word) => word.id);
}

export interface ProgressSummaryState {
  summary: ProgressSummary | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Số liệu tổng hợp cho trang chủ và trang tiến độ.
 *
 * Số từ cần ôn và số từ mới tính trên các cấp người học đang chọn, vì đó chính
 * là tập từ mà nút "Học tiếp" sẽ đưa vào phiên học. Còn tiến độ theo cấp tính
 * trên toàn bộ HSK 1 đến 3 để người học luôn thấy chặng đường còn lại.
 */
export function useProgressSummary(): ProgressSummaryState {
  const { index, loading: vocabularyLoading } = useVocabulary();
  const { settings, loading: settingsLoading } = useSettings();
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; summary: ProgressSummary | null } | null>(
    null,
  );

  const activeKey = levelKeyOf(settings.activeLevels);
  const requestKey = `${activeKey}|${index.words.length}|${settings.dailyGoal}|${attempt}`;

  const activeIds = useMemo(() => idsOfLevels(index.words, activeKey), [index.words, activeKey]);

  const idsByLevel = useMemo(() => {
    const map = new Map<HskLevel, string[]>();
    for (const level of LEVELS) {
      map.set(level, []);
    }
    for (const word of index.words) {
      map.get(word.hskLevel)?.push(word.id);
    }
    return map;
  }, [index.words]);

  useEffect(() => {
    if (vocabularyLoading || settingsLoading) return undefined;
    let active = true;

    const build = async (): Promise<ProgressSummary> => {
      const now = Date.now();
      const today = dayKey(now);
      // Giới hạn bằng chính số từ ứng viên: cần đếm hết chứ không cắt bớt như hàng đợi học.
      const [due, fresh, streak, lastSevenDays, starredTotal, savedLessonsTotal] =
        await Promise.all([
          getDueCards(activeIds, now, activeIds.length),
          getNewWordIds(activeIds, activeIds.length),
          getStreak(today),
          getRecentDays(today, RECENT_DAYS),
          // Sổ tay đếm trên cả kho: người học lưu một từ HSK 3 rồi quay về học
          // HSK 1 thì từ đó vẫn còn trong sổ tay, không được biến mất khỏi số đếm.
          countStarred(),
          countSavedLessons(),
        ]);

      const perLevel = await Promise.all(
        LEVELS.filter((level) => (idsByLevel.get(level) ?? []).length > 0).map(async (level) => {
          const ids = idsByLevel.get(level) ?? [];
          return { level, learned: await countLearnedByWordIds(ids), total: ids.length };
        }),
      );

      // getRecentDays trả về cũ trước mới sau nên phần tử cuối luôn là hôm nay.
      const todayReviews = lastSevenDays[lastSevenDays.length - 1]?.reviews ?? 0;

      return {
        dueToday: due.length,
        newAvailable: fresh.length,
        learnedTotal: perLevel.reduce((sum, item) => sum + item.learned, 0),
        perLevel,
        streak,
        lastSevenDays,
        todayReviews,
        todayGoalReached: settings.dailyGoal > 0 && todayReviews >= settings.dailyGoal,
        starredTotal,
        savedLessonsTotal,
      };
    };

    build()
      .then((summary) => {
        if (active) setLoaded({ key: requestKey, summary });
      })
      .catch(() => {
        // Đọc hỏng thì để summary rỗng cho trang hiện lời báo, tuyệt đối không
        // trả về số 0 giả vì người học sẽ tưởng mình mất hết tiến độ.
        if (active) setLoaded({ key: requestKey, summary: null });
      });

    return () => {
      active = false;
    };
  }, [
    activeIds,
    idsByLevel,
    requestKey,
    settings.dailyGoal,
    settingsLoading,
    vocabularyLoading,
  ]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const ready = loaded?.key === requestKey;

  return {
    summary: ready ? loaded.summary : null,
    loading: vocabularyLoading || settingsLoading || !ready,
    reload,
  };
}

export type SuggestedLesson = NextLesson;

export interface SuggestedLessonState {
  suggestion: SuggestedLesson | null;
  loading: boolean;
}

/**
 * Buổi học nên vào tiếp. Quy tắc chọn nằm ở `pickNextLesson` để trang chủ và
 * trang danh sách buổi học không bao giờ mời vào hai buổi khác nhau.
 *
 * Đọc một lần toàn bộ thẻ của các buổi ứng viên rồi tự đếm, thay vì gọi
 * countLearnedByWordIds cho từng buổi: một cấp có tới năm chục buổi nên cách kia
 * là năm chục lượt truy vấn cho mỗi lần mở trang chủ.
 */
export function useSuggestedLesson(
  levels: readonly HskLevel[],
  refreshToken = 0,
): SuggestedLessonState {
  const { index, loading: vocabularyLoading } = useVocabulary();
  const [loaded, setLoaded] = useState<{ key: string; suggestion: SuggestedLesson | null } | null>(
    null,
  );

  const levelKey = levelKeyOf(levels);
  const requestKey = `${levelKey}|${index.lessons.length}|${refreshToken}`;

  const ordered = useMemo(() => {
    const wanted = new Set(levelKey.split(',').filter((part) => part !== ''));
    return index.lessons
      .filter((lesson) => wanted.has(String(lesson.level)))
      .slice()
      .sort((a, b) => a.level - b.level || a.index - b.index);
  }, [index.lessons, levelKey]);

  useEffect(() => {
    if (vocabularyLoading) return undefined;
    let active = true;

    const find = async (): Promise<SuggestedLesson | null> => {
      if (ordered.length === 0) return null;
      const cards = await getCards(ordered.flatMap((lesson) => lesson.wordIds));
      return pickNextLesson(ordered, cards);
    };

    find()
      .then((suggestion) => {
        if (active) setLoaded({ key: requestKey, suggestion });
      })
      .catch(() => {
        if (active) setLoaded({ key: requestKey, suggestion: null });
      });

    return () => {
      active = false;
    };
  }, [ordered, requestKey, vocabularyLoading]);

  const ready = loaded?.key === requestKey;
  return {
    suggestion: ready ? loaded.suggestion : null,
    loading: vocabularyLoading || !ready,
  };
}

export interface ModeStat {
  mode: StudyMode;
  /** Số từ mà chế độ này đang là chỗ hay sai nhất. */
  words: number;
}

export interface ModeBreakdownState {
  stats: ModeStat[];
  /** Tổng số từ có ít nhất một lần sai, dùng làm mốc cho thanh so sánh. */
  total: number;
  loading: boolean;
}

/**
 * Chế độ nào đang làm người học vấp nhiều nhất.
 *
 * Mỗi thẻ chỉ giữ một `weakestMode` là chế độ mà từ đó bị sai nhiều lần nhất,
 * nên con số ở đây là "số từ đang vướng ở chế độ đó", không phải tổng số lượt
 * ôn. Giao diện phải nói đúng như vậy để không biến nó thành một chỉ số bịa.
 */
export function useModeBreakdown(refreshToken = 0): ModeBreakdownState {
  const { index, loading: vocabularyLoading } = useVocabulary();
  const [loaded, setLoaded] = useState<{ key: string; stats: ModeStat[] } | null>(null);

  const requestKey = `${index.words.length}|${refreshToken}`;
  const allIds = useMemo(() => index.words.map((word) => word.id), [index.words]);

  useEffect(() => {
    if (vocabularyLoading) return undefined;
    let active = true;

    getCards(allIds)
      .then((cards) => {
        if (!active) return;
        const counts = new Map<StudyMode, number>(MODES.map((mode) => [mode, 0]));
        for (const card of cards.values()) {
          if (card.weakestMode === null) continue;
          counts.set(card.weakestMode, (counts.get(card.weakestMode) ?? 0) + 1);
        }
        setLoaded({
          key: requestKey,
          stats: MODES.map((mode) => ({ mode, words: counts.get(mode) ?? 0 })),
        });
      })
      .catch(() => {
        if (active) setLoaded({ key: requestKey, stats: [] });
      });

    return () => {
      active = false;
    };
  }, [allIds, requestKey, vocabularyLoading]);

  const ready = loaded?.key === requestKey;
  const stats = ready ? loaded.stats : [];
  return {
    stats,
    total: stats.reduce((sum, item) => sum + item.words, 0),
    loading: vocabularyLoading || !ready,
  };
}
