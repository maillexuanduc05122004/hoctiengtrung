/**
 * Trang "Dịch câu": máy đưa câu tiếng Việt, người học tự suy ra câu tiếng
 * Trung rồi viết ra.
 *
 * Câu lấy từ kho các bài nghe cố định (chỉ dùng chữ đã học). Mỗi lượt rút
 * ngẫu nhiên, ưu tiên câu chưa ra lần nào, nên lượt nào cũng là câu mới tới
 * khi đi hết kho. Phần làm bài nằm trong <TranslationDrill>; trang chỉ lo chọn
 * câu và dựng lượt mới.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState, Notice } from '../components/ui/Feedback.tsx';
import {
  PRACTICE_SENTENCES,
  RoundSettings,
  filterPool,
  lessonsInPool,
  loadOptions,
  loadSeen,
  pickRound,
  rememberSeen,
  saveOptions,
  useTutorStatus,
  type PracticeSentence,
  type RoundOptions,
} from '../features/sentence-practice/index.ts';
import { TranslationDrill } from '../features/translation/TranslationDrill.tsx';

const STORE_KEY = 'dich-cau';
const DEFAULT_OPTIONS: RoundOptions = { lesson: 'all', length: 'all', size: 10 };
const SIZES = [10, 20] as const;

interface Round {
  key: number;
  sentences: PracticeSentence[];
}

function newRound(options: RoundOptions, key: number): Round {
  const pool = filterPool(PRACTICE_SENTENCES, options);
  return { key, sentences: pickRound(pool, options.size, loadSeen(STORE_KEY)) };
}

export function TranslationPage() {
  const [options, setOptions] = useState<RoundOptions>(() => {
    const saved = loadOptions(STORE_KEY, DEFAULT_OPTIONS);
    // Bài đã chọn lần trước có thể không còn trong kho.
    const known = saved.lesson === 'all' || PRACTICE_SENTENCES.some((s) => s.lessonId === saved.lesson);
    return known ? saved : { ...saved, lesson: 'all' };
  });
  const [round, setRound] = useState<Round>(() => newRound(options, 0));
  const tutor = useTutorStatus();
  const lessons = useMemo(() => lessonsInPool(PRACTICE_SENTENCES), []);

  // Câu đã ra ghi nhớ sau khi lượt hiện lên, để lượt sau ưu tiên câu khác.
  useEffect(() => {
    rememberSeen(
      STORE_KEY,
      round.sentences.map((sentence) => sentence.id),
    );
  }, [round]);

  const changeOptions = (value: RoundOptions): void => {
    setOptions(value);
    saveOptions(STORE_KEY, value);
    setRound(newRound(value, round.key + 1));
  };

  const startNewRound = (): void => {
    setRound(newRound(options, round.key + 1));
  };

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <h1
        className="text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Dịch câu
      </h1>
      <p
        className="mt-1 mb-4 text-[0.9375rem] text-ink-soft"
      >
        Đọc câu tiếng Việt, tự suy ra câu tiếng Trung rồi viết ra. Câu chỉ dùng những từ bạn đã học
        trong các bài nghe cố định; mỗi lượt ưu tiên câu chưa gặp.
      </p>

      <RoundSettings
        lessons={lessons}
        total={PRACTICE_SENTENCES.length}
        value={options}
        onChange={changeOptions}
        sizes={SIZES}
      />

      {tutor.state === 'off' ? (
        <div
          className="mb-4"
        >
          <Notice
            tone="info"
            title="Đang chấm bằng đáp án mẫu"
          >
            {`AI chấm bản dịch chưa dùng được (${tutor.reason}). Máy vẫn so câu của bạn với đáp án mẫu; dịch khác cách mà vẫn đúng thì bấm "Tôi dịch đúng".`}
          </Notice>
        </div>
      ) : null}

      {round.sentences.length === 0 ? (
        <EmptyState
          icon="text"
          title="Không có câu nào khớp lựa chọn này"
          description="Thử chọn tất cả bài hoặc độ dài khác."
          action={
            <Button
              variant="primary"
              onClick={() => changeOptions(DEFAULT_OPTIONS)}
            >
              Về lựa chọn mặc định
            </Button>
          }
        />
      ) : (
        <TranslationDrill
          key={round.key}
          sentences={round.sentences}
          tutor={tutor}
          onNewRound={startNewRound}
        />
      )}
    </div>
  );
}

export default TranslationPage;
