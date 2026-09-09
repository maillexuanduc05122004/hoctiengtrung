import { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState, Notice, Spinner } from '../components/ui/Feedback.tsx';
import { SessionSummary } from '../features/shared/SessionSummary.tsx';
import { StudyOptions, type StudyOptionsValue } from '../features/shared/StudyOptions.tsx';
import { studySessionQuery, studySourceLabel } from '../features/shared/study-source.ts';
import { TypingRound } from '../features/typing/index.ts';
import { useSettings } from '../hooks/settings-context.ts';
import { useStudySession, type PoolKind } from '../hooks/useStudySession.ts';
import { useVocabulary } from '../hooks/vocabulary-context.ts';
import type { HskLevel } from '../types/vocabulary.ts';

/** Số từ tối đa của một phiên gõ; gõ mệt hơn lật thẻ nên phiên ngắn hơn. */
const SESSION_LIMIT = 20;

/** Lời gợi ý khi hàng đợi rỗng, nói đúng nguyên nhân của từng nguồn từ. */
const EMPTY_HINT: Record<PoolKind, string> = {
  due: 'Hôm nay chưa có từ nào tới hạn ôn. Chọn "Từ mới" để học thêm từ chưa gặp.',
  new: 'Bạn đã học hết từ mới của các cấp đang chọn. Thử thêm một cấp khác hoặc chuyển sang "Cần ôn".',
  starred: 'Sổ tay của bạn còn trống. Trong lúc học, bấm hình ngôi sao ở góc trên để lưu một từ.',
  mixed: 'Không còn từ nào trong các cấp đang chọn. Thử thêm một cấp khác.',
  lesson: 'Buổi học này chưa có từ nào.',
};

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

/**
 * Trang chế độ gõ đáp án.
 *
 * Lựa chọn học nằm hết trên thanh địa chỉ (`?level=1,2&pool=due&lesson=L1-B03`)
 * nên một phiên học cụ thể chia sẻ được bằng đường dẫn, và bấm nút quay lại của
 * trình duyệt sẽ trở về đúng lựa chọn cũ.
 */
export function TypingPage() {
  const [params, setParams] = useSearchParams();
  const { settings } = useSettings();
  const { index, loading: vocabularyLoading, error: vocabularyError } = useVocabulary();

  const optionsId = useId();
  const [optionsOpen, setOptionsOpen] = useState(false);

  const lessonKey = (params.get('lesson') ?? '').trim();
  const lessonId = lessonKey === '' ? undefined : lessonKey;
  const lesson = lessonId === undefined ? null : (index.byLesson.get(lessonId) ?? null);

  const pool = parsePool(params.get('pool'), lessonId !== undefined);
  // Học theo buổi thì cấp lấy theo chính buổi đó, không theo lựa chọn trên địa chỉ.
  const levels =
    lesson !== null ? [lesson.level] : parseLevels(params.get('level'), settings.activeLevels);

  const session = useStudySession({
    mode: 'typing',
    levels,
    pool,
    lessonId,
    limit: SESSION_LIMIT,
  });

  const lessonLabel =
    lessonId === undefined
      ? undefined
      : lesson !== null
        ? `HSK ${String(lesson.level)} · Buổi ${String(lesson.index)}`
        : lessonId;
  const source = studySourceLabel({
    pool,
    levels,
    lessonLabel,
    shown: session.queue.length,
    total: session.poolTotal,
  });

  const handleOptions = (next: StudyOptionsValue): void => {
    const updated = new URLSearchParams();
    updated.set('level', next.levels.join(','));
    updated.set('pool', next.pool);
    // Đổi nguồn từ nghĩa là rời khỏi buổi học, nên bỏ tham số lesson đi.
    if (next.pool === 'lesson' && lessonId !== undefined) updated.set('lesson', lessonId);
    // `replace` để mỗi lần đổi lựa chọn không đẻ thêm một mục trong lịch sử.
    setParams(updated, { replace: true });
  };

  // Chỉ gắn vào cây khi thật sự mở: bảng này đếm bốn nguồn từ bằng bốn lượt
  // quét kho, không đáng chạy suốt phiên học chỉ để phòng khi người học mở nó.
  const options = !optionsOpen ? null : (
    <div
      id={optionsId}
      className="mx-auto mt-4 w-full max-w-[38rem] min-w-0 border-t border-line pt-4"
    >
      <StudyOptions
        value={{ levels, pool }}
        onChange={handleOptions}
        lessonLabel={lessonLabel}
        lessonId={lessonId}
      />
    </div>
  );

  const optionsToggle = (
    <div
      className="mx-auto flex w-full max-w-[38rem] min-w-0 items-center justify-between"
    >
      <p
        className="min-w-0 break-words text-[0.8125rem] text-ink-faint"
      >
        {source}
      </p>
      <Button
        variant="quiet"
        aria-expanded={optionsOpen}
        aria-controls={optionsId}
        className="ml-2 shrink-0 px-3 text-[0.8125rem]"
        onClick={() => setOptionsOpen((open) => !open)}
      >
        {optionsOpen ? 'Đóng tuỳ chọn' : 'Tuỳ chọn'}
      </Button>
    </div>
  );

  if (vocabularyError !== null) {
    return (
      <div
        className="mx-auto w-full max-w-[38rem] min-w-0"
      >
        <Notice
          tone="error"
          title="Chưa tải được bộ từ"
        >
          <p
            className="break-words"
          >
            {vocabularyError}
          </p>
        </Notice>
      </div>
    );
  }

  if (vocabularyLoading || session.loading) {
    return <Spinner label="Đang dựng danh sách từ" />;
  }

  if (session.error !== null) {
    return (
      <div
        className="mx-auto w-full max-w-[38rem] min-w-0"
      >
        <Notice
          tone="error"
          title="Chưa mở được phiên học"
        >
          <p
            className="break-words"
          >
            {session.error}
          </p>
        </Notice>
      </div>
    );
  }

  if (session.finished) {
    return (
      <div
        className="min-w-0"
      >
        <SessionSummary
          stats={session.stats}
          onReplay={session.replay}
          onRestart={session.restart}
          onReplayMissed={session.replayMissed}
          missedCount={session.missed.length}
          extra={
            <>
              {lessonId !== undefined ? (
                <Link
                  to={`/buoi-hoc/${encodeURIComponent(lessonId)}`}
                  className="tap flex w-full min-w-0 items-center justify-center border border-line-strong bg-surface px-5 py-3 text-[1rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
                >
                  Về buổi học
                </Link>
              ) : null}
              <Button
                variant="secondary"
                size="lg"
                icon="settings"
                block
                onClick={() => setOptionsOpen(true)}
              >
                Đổi nguồn từ
              </Button>
            </>
          }
        />
        {options}
      </div>
    );
  }

  if (session.current === null) {
    return (
      <div
        className="min-w-0"
      >
        {optionsToggle}
        {lessonId !== undefined && lesson === null ? (
          <div
            className="mx-auto mt-4 w-full max-w-[38rem] min-w-0"
          >
            <Notice
              tone="warn"
              title="Không tìm thấy buổi học"
            >
              <p
                className="break-words"
              >
                {`Mã buổi học "${lessonId}" không có trong bộ dữ liệu.`}
              </p>
            </Notice>
          </div>
        ) : (
          <EmptyState
            icon="keyboard"
            title="Chưa có từ nào để gõ"
            description={EMPTY_HINT[pool]}
            action={
              <Button
                variant="secondary"
                icon="settings"
                onClick={() => setOptionsOpen(true)}
              >
                Đổi nguồn từ
              </Button>
            }
          />
        )}
        {options}
      </div>
    );
  }

  return (
    <div
      className="min-w-0"
    >
      {/* Bảng tuỳ chọn nằm TRONG TypingRound, ngay dưới tiêu đề: để ở ngoài thì
          mở nó ra sẽ đẩy cả đề bài tụt xuống dưới màn hình. */}
      <TypingRound
        session={session}
        word={session.current}
        title="Gõ đáp án"
        source={source}
        onEditSource={() => setOptionsOpen((open) => !open)}
        lessonId={lessonId}
        sessionQuery={studySessionQuery(pool, levels, lessonId)}
        options={options}
      />
    </div>
  );
}

export default TypingPage;
