/**
 * Danh sách buổi học.
 *
 * Đây là màn hình người học quay lại nhiều nhất, và cũng là màn hình dài nhất:
 * HSK 3 có 97 buổi. Vì vậy trang được dựng quanh đúng một câu hỏi — "vào buổi
 * nào bây giờ" — với ba đường trả lời, xếp theo mức thường dùng:
 *
 * 1. Thẻ "Học tiếp" ở ngay đầu trang, cho việc đi tiếp mạch học.
 * 2. Bộ lọc trạng thái, cho việc tìm nhóm buổi (còn buổi nào cần ôn?).
 * 3. Ô nhảy tới buổi số N, cho khi đã biết chính xác mình cần buổi nào.
 *
 * Cấp đang xem, bộ lọc và neo cuộn đều nằm trên địa chỉ, nên quay lại từ một
 * buổi học vẫn rơi đúng chỗ cũ thay vì bật lên đầu danh sách.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../components/ui/Controls.tsx';
import { EmptyState, Notice, ProgressBar, Spinner } from '../components/ui/Feedback.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { LiveMessage } from '../components/ui/LiveMessage.tsx';
import {
  LessonList,
  lessonStatus,
  pickNextLesson,
  useLessonProgress,
  useSavedLessonIds,
} from '../features/lessons/index.ts';
import { useLiveMessage } from '../hooks/useLiveMessage.ts';
import { useSettings } from '../hooks/settings-context.ts';
import { useLessons, useVocabulary } from '../hooks/vocabulary-context.ts';
import type { HskLevel, Lesson } from '../types/vocabulary.ts';

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
/** Bộ lọc cũng nằm trên địa chỉ, vì cùng lý do. */
const FILTER_PARAM = 'loc';

type FilterKey = 'tat-ca' | 'can-on' | 'dang-hoc' | 'chua-hoc' | 'da-luu';

const FILTER_KEYS: readonly FilterKey[] = ['tat-ca', 'can-on', 'dang-hoc', 'chua-hoc', 'da-luu'];

const FILTER_LABEL: Record<FilterKey, string> = {
  'tat-ca': 'Tất cả',
  'can-on': 'Cần ôn',
  'dang-hoc': 'Đang học',
  'chua-hoc': 'Chưa học',
  'da-luu': 'Đã lưu',
};

export function LessonsPage() {
  const { index, loading, error } = useVocabulary();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { message, token, announce } = useLiveMessage();

  const jumpId = useId();
  const jumpErrorId = `${jumpId}-loi`;
  const [jump, setJump] = useState('');
  const [jumpError, setJumpError] = useState('');

  /*
    Cấp mở ra theo thứ tự lùi: địa chỉ → cấp của buổi vừa mở → cấp đang chọn
    trong cài đặt → HSK 1. Nhánh giữa là điều khiến người đang ở HSK 2 không
    phải bấm sang HSK 2 mỗi lần mở lại trang.
  */
  const lastLesson = settings.lastLessonId
    ? (index.byLesson.get(settings.lastLessonId) ?? null)
    : null;
  const fallbackLevel: HskLevel =
    lastLesson?.level ?? (settings.activeLevels.length > 0 ? settings.activeLevels[0] : 1);
  const rawLevel = params.get(LEVEL_PARAM);
  const levelKey: LevelKey =
    rawLevel === '1' || rawLevel === '2' || rawLevel === '3'
      ? rawLevel
      : KEY_BY_LEVEL[fallbackLevel];
  const level = LEVEL_BY_KEY[levelKey];

  const rawFilter = params.get(FILTER_PARAM);
  const filterKey: FilterKey =
    FILTER_KEYS.find((key) => key === rawFilter) ?? 'tat-ca';

  const lessons = useLessons(level);
  // Đọc tiến độ trên TOÀN BỘ buổi của cấp chứ không trên danh sách đã lọc: khoá
  // đọc kho là chuỗi ghép các mã từ, nên lọc trước sẽ bắt đọc lại IndexedDB mỗi
  // lần đổi bộ lọc, mà số đếm trên nhãn bộ lọc cũng sai theo.
  const { progress, cards, loading: progressLoading } = useLessonProgress(lessons);
  const { ids: savedIds, toggle: toggleSaved } = useSavedLessonIds();

  const counts = useMemo(() => {
    let done = 0;
    let doing = 0;
    let fresh = 0;
    // Đếm riêng "có từ tới hạn": một buổi đang học dở cũng có thể đã tới hẹn ôn,
    // nên con số này chồng lên các con số kia chứ không loại trừ nhau.
    let due = 0;
    for (const lesson of lessons) {
      const item = progress.get(lesson.id);
      const status = lessonStatus(item);
      if (status === 'done') done += 1;
      else if (status === 'doing') doing += 1;
      else if (status === 'new') fresh += 1;
      if ((item?.due ?? 0) > 0) due += 1;
    }
    return { done, doing, fresh, due };
  }, [lessons, progress]);

  // Danh sách chỉ hiện buổi của một cấp, nên nhãn bộ lọc cũng phải đếm trong
  // cấp đó — nếu không thì "Đã lưu 3" mà lọc ra danh sách rỗng.
  const savedInLevel = useMemo(
    () => lessons.reduce((count, lesson) => (savedIds.has(lesson.id) ? count + 1 : count), 0),
    [lessons, savedIds],
  );

  const learnedWords = useMemo(() => {
    let learned = 0;
    let total = 0;
    for (const lesson of lessons) {
      const item = progress.get(lesson.id);
      learned += item?.learned ?? 0;
      total += item?.total ?? lesson.wordIds.length;
    }
    return { learned, total };
  }, [lessons, progress]);

  // Cùng một quy tắc với trang chủ, nên hai nơi luôn mời vào cùng một buổi.
  const resume = useMemo(() => pickNextLesson(lessons, cards), [lessons, cards]);

  const matches = useCallback(
    (lesson: Lesson): boolean => {
      const item = progress.get(lesson.id);
      switch (filterKey) {
        case 'can-on':
          return (item?.due ?? 0) > 0;
        case 'dang-hoc':
          return lessonStatus(item) === 'doing';
        case 'chua-hoc':
          return lessonStatus(item) === 'new';
        case 'da-luu':
          return savedIds.has(lesson.id);
        default:
          return true;
      }
    },
    [filterKey, progress, savedIds],
  );

  // Trong lúc tiến độ chưa đọc xong thì mọi buổi đều trông như chưa học, nên bộ
  // lọc sẽ chớp ra một danh sách rỗng. Thà hiện đủ danh sách còn hơn hiện sai.
  const visible = useMemo(
    () => (progressLoading || filterKey === 'tat-ca' ? lessons : lessons.filter(matches)),
    [lessons, matches, filterKey, progressLoading],
  );

  const filterOptions = useMemo<readonly SegmentedOption<FilterKey>[]>(() => {
    const size: Record<FilterKey, number> = {
      'tat-ca': lessons.length,
      'can-on': counts.due,
      'dang-hoc': counts.doing,
      'chua-hoc': counts.fresh,
      'da-luu': savedInLevel,
    };
    return FILTER_KEYS.map((key) => ({
      value: key,
      label: progressLoading ? FILTER_LABEL[key] : `${FILTER_LABEL[key]} ${size[key]}`,
      srLabel: progressLoading
        ? FILTER_LABEL[key]
        : `${FILTER_LABEL[key]}, ${size[key]} buổi`,
    }));
  }, [lessons.length, counts, savedInLevel, progressLoading]);

  const changeLevel = (next: LevelKey): void => {
    const nextParams = new URLSearchParams(params);
    nextParams.set(LEVEL_PARAM, next);
    // `replace` để nút quay lại của trình duyệt không phải đi ngược qua từng
    // lần bấm đổi cấp.
    setParams(nextParams, { replace: true });
  };

  const changeFilter = (next: FilterKey): void => {
    const nextParams = new URLSearchParams(params);
    if (next === 'tat-ca') nextParams.delete(FILTER_PARAM);
    else nextParams.set(FILTER_PARAM, next);
    setParams(nextParams, { replace: true });
  };

  const handleToggleSave = useCallback(
    (lesson: Lesson): void => {
      void toggleSaved(lesson.id).then((saved) => {
        announce(
          saved
            ? `Đã lưu buổi ${lesson.index} vào sổ tay`
            : `Đã bỏ buổi ${lesson.index} khỏi sổ tay`,
        );
      });
    },
    [toggleSaved, announce],
  );

  /*
    Quay lại từ một buổi học mang theo neo `#buoi-42`. Chỉ cuộn sau khi dữ liệu
    đã dựng xong, vì trước đó phần tử chưa tồn tại; các ô ngoài màn hình vẫn có
    kích thước dự trù nhờ `content-visibility` nên nhảy tới đúng chỗ.
  */
  const jumpedTo = useRef<string | null>(null);
  useEffect(() => {
    const hash = location.hash;
    if (loading || hash === '' || jumpedTo.current === hash) return;
    const target = document.getElementById(hash.slice(1));
    if (target === null) return;
    jumpedTo.current = hash;
    target.scrollIntoView({ block: 'center' });
  }, [loading, location.hash, visible.length]);

  const submitJump = (event: FormEvent): void => {
    event.preventDefault();
    const wanted = Number.parseInt(jump, 10);
    // Tra theo số thứ tự thật chứ không theo vị trí trong mảng: `useLessons`
    // chỉ lọc theo cấp nên thứ tự phần tử phụ thuộc dữ liệu nguồn.
    const target = Number.isNaN(wanted)
      ? undefined
      : lessons.find((lesson) => lesson.index === wanted);
    if (target === undefined) {
      setJumpError(`Cấp này chỉ có ${lessons.length} buổi`);
      return;
    }
    setJumpError('');
    void navigate(`/buoi-hoc/${encodeURIComponent(target.id)}`);
  };

  return (
    <div
      className="mx-auto w-full max-w-[64rem] min-w-0 space-y-5"
    >
      <header
        className="min-w-0"
      >
        <h1
          className="text-[1.375rem] font-semibold tracking-tight text-ink"
        >
          Buổi học
        </h1>
        <p
          className="mt-1 max-w-[36rem] text-[0.875rem] text-ink-soft"
        >
          Mỗi buổi khoảng mười từ, xếp theo thứ tự trong danh sách HSK.
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
          {/* Chặng đường của cả cấp, để biết mình đang ở đâu trên tổng thể. */}
          <section
            aria-label={`Tiến độ HSK ${level}`}
            className="min-w-0 border-y border-line py-3"
          >
            <ProgressBar
              value={learnedWords.learned}
              max={learnedWords.total}
              label={`${lessons.length} buổi · ${learnedWords.total} từ`}
              hint={
                progressLoading
                  ? 'Đang đọc tiến độ'
                  : `đã học ${learnedWords.learned}/${learnedWords.total} từ`
              }
              tone={learnedWords.learned === learnedWords.total ? 'teal' : 'cinnabar'}
            />
          </section>

          {resume !== null ? (
            <Link
              to={`/buoi-hoc/${encodeURIComponent(resume.lesson.id)}`}
              className="tap flex min-w-0 items-center justify-between border border-cinnabar bg-cinnabar-soft px-3.5 py-3 no-underline rounded-[0.375rem] transition-colors duration-150 hover:bg-surface"
            >
              <span
                className="min-w-0 pr-3"
              >
                <span
                  className="block text-[0.6875rem] font-semibold tracking-wide text-cinnabar-ink uppercase"
                >
                  {resume.reason === 'dang-do' ? 'Học tiếp chỗ đang dở' : 'Buổi tiếp theo'}
                </span>
                <span
                  className="mt-0.5 block break-words text-[1rem] font-semibold text-ink"
                >
                  {`Buổi ${resume.lesson.index}`}
                </span>
                <span
                  className="mt-0.5 block text-[0.8125rem] text-ink-soft"
                >
                  {`Đã học ${resume.learned}/${resume.total} từ`}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-cinnabar"
              >
                <Icon name="chevron-right" size={1.25} />
              </span>
            </Link>
          ) : null}

          <div
            className="min-w-0 space-y-3 border-b border-line pb-4"
          >
            <Segmented
              legend="Lọc theo trạng thái"
              options={filterOptions}
              value={filterKey}
              onChange={changeFilter}
            />

            <form
              onSubmit={submitJump}
              className="min-w-0"
            >
              <label
                htmlFor={jumpId}
                className="block text-[0.8125rem] font-medium text-ink-soft"
              >
                {`Tới thẳng buổi số (1–${lessons.length})`}
              </label>
              <div
                className="mt-1.5 flex min-w-0 items-center space-x-2"
              >
                <input
                  id={jumpId}
                  type="number"
                  inputMode="numeric"
                  enterKeyHint="go"
                  step={1}
                  value={jump}
                  /*
                    Không đặt min/max lên chính ô nhập: trình duyệt sẽ chặn luôn
                    việc gửi biểu mẫu và hiện lời nhắc mặc định của nó, nên câu
                    "Cấp này chỉ có 97 buổi" của mình không bao giờ tới được người
                    học. Khoảng hợp lệ đã nói rõ trong nhãn, còn việc kiểm tra thì
                    làm ở đây để nói bằng chữ của mình.
                  */
                  placeholder="1"
                  aria-describedby={jumpError === '' ? undefined : jumpErrorId}
                  onChange={(event) => {
                    setJump(event.target.value);
                    if (jumpError !== '') setJumpError('');
                  }}
                  className="tap w-[6rem] shrink-0 border border-line-strong bg-surface px-3 py-2 tabular-nums text-ink rounded-[0.375rem]"
                />
                <Button type="submit">Tới</Button>
              </div>
              {/* Vùng báo lỗi luôn nằm sẵn trong cây: thêm một vùng aria-live cùng
                  lúc với nội dung của nó thì trình đọc màn hình bỏ qua câu đầu tiên. */}
              <p
                id={jumpErrorId}
                role="status"
                aria-live="polite"
                className="mt-1.5 min-h-[1.25rem] text-[0.8125rem] text-cinnabar-ink"
              >
                {jumpError}
              </p>
            </form>
          </div>

          <LiveMessage message={message} token={token} />

          <LessonList
            lessons={visible}
            progress={progress}
            label={`Các buổi học HSK ${level}`}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            currentId={resume !== null && resume.reason === 'dang-do' ? resume.lesson.id : null}
            listQuery={location.search}
            empty={
              <EmptyState
                icon="book"
                title="Không có buổi nào ở trạng thái này"
                description={
                  filterKey === 'da-luu'
                    ? 'Bấm ngôi sao trên một buổi để lưu buổi đó vào sổ tay.'
                    : 'Thử bỏ bộ lọc để xem lại toàn bộ buổi học của cấp này.'
                }
                action={
                  <Button
                    variant="secondary"
                    onClick={() => changeFilter('tat-ca')}
                  >
                    Bỏ lọc
                  </Button>
                }
              />
            }
          />
        </>
      ) : null}
    </div>
  );
}

export default LessonsPage;
