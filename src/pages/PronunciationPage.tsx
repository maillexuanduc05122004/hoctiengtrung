/**
 * Trang "Luyện phát âm": đưa một câu dài (từ 10 chữ trở lên), người học đọc
 * theo, AI nghe giọng và chỉ ra âm tiết nào đọc sai, sai ra sao.
 *
 * Câu lấy từ kho các bài nghe cố định, chỉ giữ câu dài và câu có pinyin thẳng
 * hàng từng chữ (để chấm và tô màu được đúng từng chữ). Phần đọc và chấm nằm
 * trong <PronunciationDrill>.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/Feedback.tsx';
import {
  PronunciationDrill,
  type PronounceSentence,
} from '../features/pronunciation/PronunciationDrill.tsx';
import { expectedSyllables } from '../features/pronunciation/syllables.ts';
import {
  PRACTICE_SENTENCES,
  RoundSettings,
  filterPool,
  hanziLength,
  lessonsInPool,
  loadOptions,
  loadSeen,
  pickRound,
  rememberSeen,
  saveOptions,
  useTutorStatus,
  type RoundOptions,
} from '../features/sentence-practice/index.ts';

const STORE_KEY = 'phat-am';
const DEFAULT_OPTIONS: RoundOptions = { lesson: 'all', length: 'all', size: 5 };
const SIZES = [5, 10] as const;
/** Người học muốn câu dài chừng mười từ trở lên. */
const MIN_CHARS = 10;

/** Kho câu đọc: câu đủ dài và ghép được từng chữ với âm tiết. */
const POOL: readonly PronounceSentence[] = PRACTICE_SENTENCES.flatMap((sentence) => {
  if (hanziLength(sentence.hanzi) < MIN_CHARS) return [];
  const syllables = expectedSyllables(sentence.hanzi, sentence.pinyin);
  return syllables === null ? [] : [{ ...sentence, syllables }];
});

interface Round {
  key: number;
  sentences: PronounceSentence[];
}

function newRound(options: RoundOptions, key: number): Round {
  const pool = filterPool(POOL, { lesson: options.lesson, length: 'all' });
  return { key, sentences: pickRound(pool, options.size, loadSeen(STORE_KEY)) };
}

export function PronunciationPage() {
  const [options, setOptions] = useState<RoundOptions>(() => {
    const saved = loadOptions(STORE_KEY, DEFAULT_OPTIONS);
    const known = saved.lesson === 'all' || POOL.some((s) => s.lessonId === saved.lesson);
    return known ? saved : { ...saved, lesson: 'all' };
  });
  const [round, setRound] = useState<Round>(() => newRound(options, 0));
  const tutor = useTutorStatus();
  const lessons = useMemo(() => lessonsInPool(POOL), []);

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

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <h1
        className="text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Luyện phát âm
      </h1>
      <p
        className="mt-1 mb-4 text-[0.9375rem] text-ink-soft"
      >
        Nghe mẫu, rồi bấm ghi âm và đọc to cả câu. AI nghe giọng bạn, chỉ ra chữ nào sai thanh, sai
        phụ âm hay sai vần, kèm cách sửa.
      </p>

      <RoundSettings
        lessons={lessons}
        total={POOL.length}
        value={options}
        onChange={changeOptions}
        sizes={SIZES}
        showLength={false}
      />

      {round.sentences.length === 0 ? (
        <EmptyState
          icon="mic"
          title="Không có câu dài nào khớp lựa chọn này"
          description="Thử chọn tất cả bài."
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
        <PronunciationDrill
          key={round.key}
          sentences={round.sentences}
          tutor={tutor}
          onNewRound={() => setRound(newRound(options, round.key + 1))}
        />
      )}
    </div>
  );
}

export default PronunciationPage;
