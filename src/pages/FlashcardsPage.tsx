/**
 * Trang chế độ lật thẻ.
 *
 * Lựa chọn của phiên học nằm trên địa chỉ (level, pool, lesson) chứ không nằm
 * trong state, nhờ vậy người học chia sẻ hay lưu lại được đúng phiên đang mở, và
 * trang buổi học chỉ cần trỏ tới /the?lesson=L1-B03 là chạy đúng.
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { FlashcardDeck } from '../features/flashcards/FlashcardDeck.tsx';
import type { StudyOptionsValue } from '../features/shared/StudyOptions.tsx';
import { useSettings } from '../hooks/settings-context.ts';
import { useVocabulary } from '../hooks/vocabulary-context.ts';
import type { PoolKind } from '../hooks/useStudySession.ts';
import type { HskLevel } from '../types/vocabulary.ts';

const POOLS: readonly PoolKind[] = ['due', 'new', 'starred', 'mixed', 'lesson'];

function isHskLevel(value: number): value is HskLevel {
  return value === 1 || value === 2 || value === 3;
}

/** Đọc "1,2" trên địa chỉ thành danh sách cấp, bỏ qua mọi giá trị lạ. */
function parseLevels(raw: string | null, fallback: readonly HskLevel[]): HskLevel[] {
  const parsed = (raw ?? '')
    .split(',')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter(isHskLevel);
  const unique = [...new Set(parsed)].sort((a, b) => a - b);
  if (unique.length > 0) return unique;
  const safeFallback = [...new Set(fallback)].sort((a, b) => a - b);
  // Không cấp nào hợp lệ thì về HSK 1 để hàng đợi không bao giờ rỗng vì lựa chọn.
  return safeFallback.length > 0 ? safeFallback : [1];
}

function parsePool(raw: string | null, hasLesson: boolean): PoolKind {
  if (hasLesson) return 'lesson';
  const found = POOLS.find((pool) => pool === raw && pool !== 'lesson');
  return found ?? 'due';
}

export function FlashcardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();
  const { index } = useVocabulary();

  const lessonId = (searchParams.get('lesson') ?? '').trim();
  const levelParam = searchParams.get('level');
  const poolParam = searchParams.get('pool');

  const lesson = lessonId === '' ? undefined : index.byLesson.get(lessonId);
  const pool = parsePool(poolParam, lessonId !== '');

  const activeLevels = settings.activeLevels;
  const levels = useMemo(() => {
    // Học theo buổi thì cấp lấy theo chính buổi đó, không theo lựa chọn trên địa chỉ.
    if (lesson) return [lesson.level];
    return parseLevels(levelParam, activeLevels);
  }, [lesson, levelParam, activeLevels]);

  const lessonLabel =
    lessonId === '' ? undefined : lesson ? `HSK ${lesson.level} · Buổi ${lesson.index}` : lessonId;

  const handleOptionsChange = useCallback(
    (next: StudyOptionsValue) => {
      const params = new URLSearchParams();
      params.set('level', next.levels.join(','));
      params.set('pool', next.pool);
      // Đổi nguồn từ nghĩa là rời khỏi buổi học, nên bỏ tham số lesson đi.
      if (next.pool === 'lesson' && lessonId !== '') params.set('lesson', lessonId);
      setSearchParams(params, { replace: true });
    },
    [lessonId, setSearchParams],
  );

  return (
    <div
      className="mx-auto w-full max-w-[44rem] min-w-0"
    >
      <FlashcardDeck
        levels={levels}
        pool={pool}
        lessonId={lessonId === '' ? undefined : lessonId}
        lessonLabel={lessonLabel}
        onOptionsChange={handleOptionsChange}
      />
    </div>
  );
}

export default FlashcardsPage;
