/**
 * Còn bao nhiêu từ trong mỗi nguồn.
 *
 * Bảng chọn nguồn từ trước đây chỉ có bốn nhãn trần, nên cách duy nhất để biết
 * một nguồn có rỗng hay không là chọn nó rồi vấp vào màn hình trống. Hook này
 * đếm sẵn để bảng chọn nói trước, và để nguồn rỗng bị khoá thay vì mời bấm.
 *
 * Hook chỉ chạy khi bảng chọn thật sự được gắn vào cây — mọi nơi gọi đều vẽ có
 * điều kiện. Đây là bốn lượt quét kho, không đáng chạy nền suốt phiên học chỉ
 * để phòng khi người học mở bảng.
 */
import { useEffect, useState } from 'react';
import {
  countStarred,
  getDueCards,
  getNewWordIds,
} from '../../db/index.ts';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import type { PoolKind } from '../../hooks/useStudySession.ts';
import type { HskLevel } from '../../types/vocabulary.ts';

export type PoolCounts = Record<PoolKind, number>;

export interface PoolCountsState {
  counts: PoolCounts | null;
  loading: boolean;
}

const EMPTY_COUNTS: PoolCounts = { due: 0, new: 0, starred: 0, mixed: 0, lesson: 0 };

export function usePoolCounts(
  levels: readonly HskLevel[],
  lessonId: string | undefined,
): PoolCountsState {
  const { index, loading: vocabularyLoading } = useVocabulary();
  const [loaded, setLoaded] = useState<{ key: string; counts: PoolCounts } | null>(null);

  const levelKey = [...levels].sort((a, b) => a - b).join(',');
  const requestKey = `${levelKey}|${lessonId ?? ''}|${index.words.length}`;

  useEffect(() => {
    if (vocabularyLoading) return undefined;
    let active = true;

    const wanted = new Set(levelKey.split(',').filter((part) => part !== ''));
    const ids = index.words
      .filter((word) => wanted.has(String(word.hskLevel)))
      .map((word) => word.id);

    const count = async (): Promise<PoolCounts> => {
      const now = Date.now();
      const [due, fresh, starred] = await Promise.all([
        getDueCards(ids, now, ids.length),
        getNewWordIds(ids, ids.length),
        // Sổ tay đếm trên cả kho, không theo cấp: đó là danh sách cá nhân.
        countStarred(),
      ]);
      const lesson = lessonId ? index.byLesson.get(lessonId) : undefined;
      return {
        due: due.length,
        new: fresh.length,
        starred,
        // 'mixed' lấy từ cần ôn rồi bù từ mới, nên tổng của nó là tổng hai nguồn.
        mixed: due.length + fresh.length,
        lesson: lesson?.wordIds.length ?? 0,
      };
    };

    count().then(
      (counts) => {
        if (active) setLoaded({ key: requestKey, counts });
      },
      () => {
        // Không đếm được thì bảng chọn quay về bốn nhãn trần, vẫn dùng được.
        if (active) setLoaded({ key: requestKey, counts: EMPTY_COUNTS });
      },
    );

    return () => {
      active = false;
    };
  }, [vocabularyLoading, levelKey, lessonId, requestKey, index.words, index.byLesson]);

  const ready = loaded?.key === requestKey;
  return { counts: ready ? loaded.counts : null, loading: !ready };
}
