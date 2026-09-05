/**
 * Trang luyện nói.
 *
 * Tham số trên địa chỉ quyết định phiên học: `level` (ví dụ `1,2`), `pool` và `lesson`.
 * Nhờ vậy trang chủ và trang buổi học chỉ cần trỏ tới một đường dẫn là mở đúng phiên,
 * và người học chia sẻ hay lưu lại đường dẫn thì mở ra vẫn đúng phiên đó.
 */
import { useCallback, useMemo, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button, IconButton } from '../components/ui/Button.tsx';
import { EmptyState, Notice, Spinner } from '../components/ui/Feedback.tsx';
import { SpeakingRound } from '../features/speaking/index.ts';
import { SessionSummary } from '../features/shared/SessionSummary.tsx';
import { StudyHeader } from '../features/shared/StudyHeader.tsx';
import { StudyOptions, type StudyOptionsValue } from '../features/shared/StudyOptions.tsx';
import { useSettings } from '../hooks/settings-context.ts';
import { useVocabulary } from '../hooks/vocabulary-context.ts';
import {
  useStudySession,
  type PoolKind,
  type SubmitInput,
} from '../hooks/useStudySession.ts';
import type { HskLevel } from '../types/vocabulary.ts';

/** Một phiên nói ngắn hơn phiên gõ: đọc thành tiếng mệt hơn gõ phím nhiều. */
const SESSION_LIMIT = 12;

const POOL_VALUES: readonly PoolKind[] = ['due', 'new', 'starred', 'mixed', 'lesson'];

/** Lời giải thích khi hàng đợi rỗng, viết riêng cho từng nguồn từ. */
const EMPTY_HINTS: Record<PoolKind, string> = {
  due: 'Chưa có từ nào tới hạn ôn. Chọn “Từ mới” để học thêm từ chưa gặp bao giờ.',
  new: 'Các cấp đang chọn đã hết từ mới. Chọn “Cần ôn” hoặc thêm một cấp HSK khác.',
  starred: 'Bạn chưa đánh dấu từ nào ở các cấp đang chọn.',
  mixed: 'Không còn từ nào để ôn hay học mới ở các cấp đang chọn.',
  lesson: 'Buổi học này chưa có từ nào.',
};

function isHskLevel(value: number): value is HskLevel {
  return value === 1 || value === 2 || value === 3;
}

/**
 * Đọc danh sách cấp từ địa chỉ, ví dụ `?level=1,2`.
 * Tham số hỏng hay thiếu thì lấy các cấp đang bật trong cài đặt.
 */
function parseLevels(raw: string, fallback: string): HskLevel[] {
  const read = (text: string): HskLevel[] => {
    const found = text
      .split(',')
      .map((part) => Number.parseInt(part.trim(), 10))
      .filter((value): value is HskLevel => isHskLevel(value));
    return [...new Set(found)].sort((a, b) => a - b);
  };
  const wanted = read(raw);
  if (wanted.length > 0) return wanted;
  const backup = read(fallback);
  return backup.length > 0 ? backup : [1];
}

function parsePool(raw: string | null): PoolKind {
  const found = POOL_VALUES.find((value) => value === raw);
  // Mặc định là "trộn": người mở thẳng đường dẫn thường muốn học tiếp, không muốn chọn.
  return found ?? 'mixed';
}

export function SpeakingPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { index } = useVocabulary();

  const lessonId = (params.get('lesson') ?? '').trim();
  const levelParam = params.get('level') ?? '';
  const activeLevelKey = settings.activeLevels.join(',');
  const levels = useMemo(
    () => parseLevels(levelParam, activeLevelKey),
    [levelParam, activeLevelKey],
  );
  // Có buổi học thì nguồn từ luôn là buổi đó, kể cả khi dữ liệu chưa nạp xong.
  const pool: PoolKind = lessonId === '' ? parsePool(params.get('pool')) : 'lesson';

  const lesson = lessonId === '' ? undefined : index.byLesson.get(lessonId);
  const lessonLabel = lesson ? `HSK ${lesson.level} · Buổi ${lesson.index}` : undefined;

  const session = useStudySession({
    mode: 'speaking',
    levels,
    pool,
    lessonId: lessonId === '' ? undefined : lessonId,
    limit: SESSION_LIMIT,
  });

  const { submit, skip } = session;

  const applyOptions = useCallback(
    (next: StudyOptionsValue) => {
      const nextParams = new URLSearchParams(params);
      nextParams.set('level', next.levels.join(','));
      nextParams.set('pool', next.pool);
      // Thay vì đẩy thêm một mục vào lịch sử: đổi tuỳ chọn không phải là "sang trang mới".
      setParams(nextParams, { replace: true });
    },
    [params, setParams],
  );

  const handleSubmit = useCallback(
    (input: SubmitInput) => {
      // `submit` tự bắt lỗi bên trong nên chỉ cần thả trôi lời hứa.
      void submit(input);
    },
    [submit],
  );

  const current = session.current;
  const starred = current !== null && session.starred.has(current.id);

  const optionsValue: StudyOptionsValue = { levels, pool };

  const body = (): ReactNode => {
    if (session.loading) {
      return <Spinner label="Đang dựng danh sách từ" />;
    }
    if (session.error !== null) {
      return (
        <Notice
          tone="error"
          title="Không mở được phiên học"
        >
          {session.error}
        </Notice>
      );
    }
    if (session.queue.length === 0) {
      return (
        <EmptyState
          icon="mic"
          title="Chưa có từ nào cho phiên nói này"
          description={EMPTY_HINTS[pool]}
          action={
            pool === 'lesson' ? (
              <Button
                variant="secondary"
                icon="book"
                onClick={() => void navigate('/buoi-hoc')}
              >
                Chọn buổi học khác
              </Button>
            ) : (
              <Button
                variant="primary"
                icon="plus"
                onClick={() => applyOptions({ levels, pool: 'new' })}
              >
                Lấy từ mới
              </Button>
            )
          }
        />
      );
    }
    if (session.finished) {
      return (
        <SessionSummary
          stats={session.stats}
          onRestart={session.restart}
          extra={
            <Button
              variant="secondary"
              size="lg"
              icon="ear"
              block
              onClick={() => void navigate('/nghe')}
            >
              Sang chế độ nghe chép
            </Button>
          }
        />
      );
    }
    if (current === null) return null;
    return (
      <SpeakingRound
        key={`${session.index}-${current.id}`}
        word={current}
        displayMode={settings.displayMode}
        hidePinyin={settings.hidePinyin}
        showTraditional={settings.showTraditional}
        onSubmit={handleSubmit}
        onSkip={skip}
      />
    );
  };

  return (
    <div
      className="mx-auto w-full max-w-[34rem] min-w-0"
    >
      <StudyHeader
        title="Luyện nói"
        done={session.stats.done}
        total={session.stats.total}
        subtitle={lessonLabel ?? 'Đọc thành tiếng rồi để hệ thống nghe lại'}
        right={
          current === null ? null : (
            <IconButton
              icon={starred ? 'star-filled' : 'star'}
              label={starred ? 'Bỏ đánh dấu từ này' : 'Đánh dấu từ này'}
              pressed={starred}
              onClick={() => void session.toggleStar(current.id)}
            />
          )
        }
      />

      <details
        className="mt-3 border-b border-line pb-3"
      >
        <summary
          className="tap cursor-pointer py-2 text-[0.875rem] font-medium text-ink-soft"
        >
          Tuỳ chọn phiên học
        </summary>
        <div
          className="pt-2"
        >
          <StudyOptions
            value={optionsValue}
            onChange={applyOptions}
            lessonLabel={lessonLabel}
          />
        </div>
      </details>

      <div
        className="mt-5 min-w-0"
      >
        {body()}
      </div>
    </div>
  );
}

export default SpeakingPage;
