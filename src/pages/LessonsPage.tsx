import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Segmented, type SegmentedOption } from '../components/ui/Controls.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { Notice, Spinner } from '../components/ui/Feedback.tsx';
import { LessonList, lessonStatus, useLessonProgress } from '../features/lessons/index.ts';
import { useSettings } from '../hooks/settings-context.ts';
import { useLessons, useVocabulary } from '../hooks/vocabulary-context.ts';
import type { HskLevel } from '../types/vocabulary.ts';

type LevelKey = '1' | '2' | '3';

const LEVEL_OPTIONS: readonly SegmentedOption<LevelKey>[] = [
  { value: '1', label: 'HSK 1' },
  { value: '2', label: 'HSK 2' },
  { value: '3', label: 'HSK 3' },
];

const LEVEL_BY_KEY: Record<LevelKey, HskLevel> = { '1': 1, '2': 2, '3': 3 };
const KEY_BY_LEVEL: Record<HskLevel, LevelKey> = { 1: '1', 2: '2', 3: '3' };

/** Cấp đang xem nằm trong địa chỉ nên quay lại từ một buổi học vẫn đúng cấp cũ. */
const LEVEL_PARAM = 'cap';

export function LessonsPage() {
  const { loading, error } = useVocabulary();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();

  const fallbackLevel: HskLevel = settings.activeLevels.length > 0 ? settings.activeLevels[0] : 1;
  const raw = params.get(LEVEL_PARAM);
  const levelKey: LevelKey =
    raw === '1' || raw === '2' || raw === '3' ? raw : KEY_BY_LEVEL[fallbackLevel];
  const level = LEVEL_BY_KEY[levelKey];

  const lessons = useLessons(level);
  const { progress, loading: progressLoading } = useLessonProgress(lessons);

  const counts = useMemo(() => {
    let done = 0;
    let doing = 0;
    for (const lesson of lessons) {
      const status = lessonStatus(progress.get(lesson.id));
      if (status === 'done') done += 1;
      else if (status === 'doing') doing += 1;
    }
    return { done, doing };
  }, [lessons, progress]);

  // Buổi dở dang gần đầu danh sách nhất chính là chỗ người học rời đi lần trước.
  const resume = useMemo(
    () => lessons.find((lesson) => lessonStatus(progress.get(lesson.id)) === 'doing') ?? null,
    [lessons, progress],
  );

  const changeLevel = (next: LevelKey): void => {
    // `replace` để nút quay lại của trình duyệt không phải đi ngược qua từng
    // lần bấm đổi cấp.
    setParams({ [LEVEL_PARAM]: next }, { replace: true });
  };

  return (
    <div
      className="min-w-0 space-y-5"
    >
      <header
        className="min-w-0 border-b border-line pb-4"
      >
        <h1
          className="text-[1.375rem] font-semibold tracking-tight text-ink"
        >
          Buổi học
        </h1>
        <p
          className="mt-1 max-w-[36rem] text-[0.875rem] text-ink-soft"
        >
          Mỗi buổi khoảng mười từ, xếp theo thứ tự trong danh sách HSK. Học xong một buổi rồi
          hãy sang buổi kế tiếp.
        </p>
      </header>

      <Segmented
        legend="Cấp HSK"
        options={LEVEL_OPTIONS}
        value={levelKey}
        onChange={changeLevel}
      />

      {loading ? <Spinner label="Đang tải danh sách buổi học" /> : null}

      {error !== null ? (
        <Notice
          tone="error"
          title="Không tải được dữ liệu từ vựng"
        >
          {error}
        </Notice>
      ) : null}

      {!loading && error === null ? (
        <>
          <p
            className="text-[0.8125rem] text-ink-faint"
          >
            {progressLoading
              ? `${lessons.length} buổi`
              : `${lessons.length} buổi · đã xong ${counts.done} · đang học ${counts.doing}`}
          </p>

          {resume !== null ? (
            <Link
              to={`/buoi-hoc/${encodeURIComponent(resume.id)}`}
              className="tap flex min-w-0 items-center justify-between border-y border-line px-1 py-3 no-underline transition-colors duration-150 hover:bg-sunken"
            >
              <span
                className="min-w-0 pr-3"
              >
                <span
                  className="block text-[0.75rem] font-semibold tracking-wide text-cinnabar uppercase"
                >
                  Đang học dở
                </span>
                <span
                  className="mt-0.5 block break-words text-[0.9375rem] font-medium text-ink"
                >
                  {`Buổi ${resume.index} · `}
                  <span
                    lang="zh-Hans"
                    className="han"
                  >
                    {`${resume.range.from} → ${resume.range.to}`}
                  </span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-ink-faint"
              >
                <Icon name="chevron-right" size={1.125} />
              </span>
            </Link>
          ) : null}

          <LessonList
            lessons={lessons}
            progress={progress}
            label={`Các buổi học HSK ${level}`}
          />
        </>
      ) : null}
    </div>
  );
}

export default LessonsPage;
