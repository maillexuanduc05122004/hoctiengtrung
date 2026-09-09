/**
 * Trang chế độ Nghe và chép.
 *
 * Cấu hình phiên nằm trong địa chỉ (level, pool, lesson) nên một phiên cụ thể
 * lưu lại hoặc chia sẻ được, và nút quay lại của trình duyệt vẫn đúng. Trang chỉ
 * lo dựng phiên và khung xung quanh; toàn bộ phần nghe, chấm và đối chiếu nằm
 * trong <ListeningRound>.
 */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { IconButton } from '../components/ui/Button.tsx';
import { EmptyState, Notice, Spinner } from '../components/ui/Feedback.tsx';
import { ListeningRound, type ListeningAnswerMode } from '../features/listening/index.ts';
import { SessionSummary } from '../features/shared/SessionSummary.tsx';
import { StudyHeader } from '../features/shared/StudyHeader.tsx';
import { StudyOptions, type StudyOptionsValue } from '../features/shared/StudyOptions.tsx';
import { studySessionQuery, studySourceLabel } from '../features/shared/study-source.ts';
import { saveWordMessage } from '../features/shared/save-word.ts';
import { useLiveMessage } from '../hooks/useLiveMessage.ts';
import { useSettings } from '../hooks/settings-context.ts';
import { useStudySession, type PoolKind } from '../hooks/useStudySession.ts';
import { useVocabulary } from '../hooks/vocabulary-context.ts';
import type { HskLevel } from '../types/vocabulary.ts';

/** Số từ mỗi phiên; nghe lâu hơn gõ nên phiên để ngắn cho vừa sức. */
const SESSION_LIMIT = 15;

const EMPTY_HINTS: Record<PoolKind, string> = {
  due: 'Hôm nay chưa có từ nào tới hạn ôn. Chọn "Từ mới" hoặc "Trộn" để học tiếp.',
  new: 'Bạn đã mở hết từ mới của những cấp đang chọn. Thử thêm một cấp khác.',
  starred: 'Sổ tay của bạn còn trống. Bấm ngôi sao ở đầu trang khi gặp từ khó.',
  mixed: 'Chưa có từ nào cho phiên này. Thử chọn thêm cấp HSK.',
  lesson: 'Buổi học này chưa có từ nào.',
};

/** Đọc danh sách cấp từ địa chỉ; sai định dạng thì lấy cấp đang học trong cài đặt. */
function parseLevels(raw: string | null, fallback: readonly HskLevel[]): HskLevel[] {
  const parsed = (raw ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value): value is HskLevel => value === 1 || value === 2 || value === 3);
  const unique = [...new Set(parsed)].sort((a, b) => a - b);
  if (unique.length > 0) return unique;
  return fallback.length > 0 ? [...fallback] : [1];
}

/** Có tham số buổi học thì nguồn từ luôn là buổi học đó, bỏ qua tham số pool. */
function parsePool(raw: string | null, lessonId: string | null): PoolKind {
  if (lessonId !== null && lessonId.trim() !== '') return 'lesson';
  if (raw === 'due' || raw === 'new' || raw === 'starred' || raw === 'mixed') return raw;
  return 'mixed';
}

export function ListeningPage() {
  const { settings } = useSettings();
  const { index: vocabulary } = useVocabulary();
  const [searchParams, setSearchParams] = useSearchParams();
  const [answerMode, setAnswerMode] = useState<ListeningAnswerMode>('hanzi');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const { message, token, announce } = useLiveMessage();

  const levelParam = searchParams.get('level');
  const poolParam = searchParams.get('pool');
  const lessonParam = searchParams.get('lesson');

  const levels = useMemo(
    () => parseLevels(levelParam, settings.activeLevels),
    [levelParam, settings.activeLevels],
  );
  const pool = parsePool(poolParam, lessonParam);
  const lessonId = pool === 'lesson' && lessonParam !== null ? lessonParam : undefined;

  const session = useStudySession({
    mode: 'listening',
    levels,
    pool,
    lessonId,
    limit: SESSION_LIMIT,
  });

  const lesson = lessonId !== undefined ? vocabulary.byLesson.get(lessonId) : undefined;
  const lessonLabel = lesson ? `HSK ${lesson.level} · Buổi ${lesson.index}` : undefined;

  // Hàng đợi ngắn thì không đủ từ để dựng đáp án nhiễu, khi đó lấy từ cả bộ từ vựng.
  const distractors = session.queue.length >= 8 ? session.queue : vocabulary.words;

  const handleOptionsChange = (next: StudyOptionsValue): void => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        params.set('level', next.levels.join(','));
        params.set('pool', next.pool);
        params.delete('lesson');
        return params;
      },
      { replace: true },
    );
  };

  const current = session.current;
  const starred = current !== null && session.starred.has(current.id);

  const source = studySourceLabel({
    pool,
    levels,
    lessonLabel,
    shown: session.queue.length,
    total: session.poolTotal,
  });

  const headerActions = (
    <>
      {current !== null ? (
        <IconButton
          icon={starred ? 'star-filled' : 'star'}
          // Nhãn không nhắc chữ Hán: IconButton dùng nhãn này làm cả title lẫn
          // aria-label, mà chế độ nghe giấu chữ Hán cho tới khi trả lời xong.
          label={starred ? 'Bỏ lưu từ này' : 'Lưu từ này vào sổ tay'}
          pressed={starred}
          pressedVariant="saved"
          onClick={() => {
            void session.toggleStar(current.id).then(
              (saved) => announce(saveWordMessage(current.simplified, saved)),
              () => announce('Không lưu được vào máy này.'),
            );
          }}
        />
      ) : null}
      <IconButton
        icon="settings"
        label="Tuỳ chọn phiên nghe"
        pressed={optionsOpen}
        onClick={() => setOptionsOpen((open) => !open)}
      />
    </>
  );

  const empty = !session.loading && session.error === null && session.queue.length === 0;
  // Chưa có từ nào hoặc đã xong phiên thì mở sẵn bảng tuỳ chọn cho người học đổi nguồn.
  const showOptions = optionsOpen || empty || session.finished;

  let body;
  if (session.error !== null) {
    body = (
      <Notice
        tone="error"
        title="Không dựng được phiên học"
      >
        <p
          className="min-w-0 break-words"
        >
          {session.error}
        </p>
      </Notice>
    );
  } else if (session.loading) {
    body = <Spinner label="Đang dựng danh sách từ" />;
  } else if (session.finished) {
    body = (
      <SessionSummary
        stats={session.stats}
        onReplay={session.replay}
        onRestart={session.restart}
        onReplayMissed={session.replayMissed}
        missedCount={session.missed.length}
        extra={
          lessonId !== undefined ? (
            <Link
              to={`/buoi-hoc/${encodeURIComponent(lessonId)}`}
              className="tap flex w-full min-w-0 items-center justify-center border border-line-strong bg-surface px-5 py-3 text-[1rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
            >
              Về buổi học
            </Link>
          ) : null
        }
      />
    );
  } else if (current === null) {
    body = (
      <EmptyState
        icon="ear"
        title="Chưa có từ nào để nghe"
        description={EMPTY_HINTS[pool]}
      />
    );
  } else {
    body = (
      <ListeningRound
        key={`${current.id}-${session.index}`}
        word={current}
        distractors={distractors}
        displayMode={settings.displayMode}
        answerMode={answerMode}
        onAnswerModeChange={setAnswerMode}
        showTraditional={settings.showTraditional}
        onSubmit={(input) => {
          void session.submit(input);
        }}
        onSkip={session.skip}
      />
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-[34rem] min-w-0"
    >
      <StudyHeader
        title="Nghe và chép"
        mode="listening"
        source={source}
        onEditSource={() => setOptionsOpen((open) => !open)}
        lessonId={lessonId}
        sessionQuery={studySessionQuery(pool, levels, lessonId)}
        done={session.stats.done + session.stats.skipped}
        total={session.stats.total}
        message={message}
        messageToken={token}
        right={headerActions}
      />

      {showOptions ? (
        <section
          aria-label="Tuỳ chọn phiên"
          className="mt-4 min-w-0 border-b border-line pb-5"
        >
          <StudyOptions
            value={{ levels, pool }}
            onChange={handleOptionsChange}
            lessonLabel={lessonLabel}
            lessonId={lessonId}
          />
        </section>
      ) : null}

      <div
        className="mt-5 min-w-0"
      >
        {body}
      </div>
    </div>
  );
}

export default ListeningPage;
