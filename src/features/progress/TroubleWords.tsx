import { useEffect, useMemo, useState } from 'react';
import { getTroubleWords } from '../../db/index.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import { WordRow } from '../shared/WordRow.tsx';
import type { CardState, StudyMode } from '../../types/study.ts';
import type { HskLevel, VocabularyWord } from '../../types/vocabulary.ts';

export interface TroubleWordsProps {
  /** Số từ tối đa hiển thị. */
  limit?: number;
  /** Chỉ lấy từ trong các cấp này; bỏ trống thì lấy mọi cấp đã nạp. */
  levels?: readonly HskLevel[];
  /** Hiện thêm lỗi gần nhất của từng từ. */
  showLastMistake?: boolean;
  /** Đổi giá trị để buộc đọc lại, dùng sau khi nạp hoặc đặt lại tiến độ. */
  refreshToken?: number;
  emptyMessage?: string;
}

const MODE_LABELS: Record<StudyMode, string> = {
  flashcards: 'Lật thẻ',
  typing: 'Gõ đáp án',
  listening: 'Nghe chép',
  speaking: 'Luyện nói',
};

interface TroubleRow {
  card: CardState;
  word: VocabularyWord;
}

function shortDate(at: number): string {
  const date = new Date(at);
  return Number.isFinite(date.getTime()) ? `${date.getDate()}/${date.getMonth() + 1}` : '';
}

/**
 * Danh sách từ hay trả lời sai.
 *
 * Thứ tự do getTroubleWords quyết định (sai nhiều đứng trước) và chỉ những từ
 * đã sai ít nhất một lần mới có mặt, nên khi chưa học gì danh sách rỗng thật
 * chứ không được đắp thêm từ nào cho đỡ trống.
 */
export function TroubleWords({
  limit = 5,
  levels,
  showLastMistake = false,
  refreshToken = 0,
  emptyMessage = 'Chưa có từ nào bị trả lời sai.',
}: TroubleWordsProps) {
  const { index, loading: vocabularyLoading } = useVocabulary();
  const { settings } = useSettings();
  const [loaded, setLoaded] = useState<{ key: string; cards: CardState[] } | null>(null);

  const levelKey = levels ? [...levels].sort((a, b) => a - b).join(',') : 'all';

  const ids = useMemo(() => {
    if (levelKey === 'all') return index.words.map((word) => word.id);
    const wanted = new Set(levelKey.split(',').filter((part) => part !== ''));
    return index.words
      .filter((word) => wanted.has(String(word.hskLevel)))
      .map((word) => word.id);
  }, [index.words, levelKey]);

  const requestKey = `${levelKey}|${ids.length}|${limit}|${refreshToken}`;

  useEffect(() => {
    if (vocabularyLoading) return undefined;
    let active = true;

    getTroubleWords(ids, limit)
      .then((cards) => {
        if (active) setLoaded({ key: requestKey, cards });
      })
      .catch(() => {
        if (active) setLoaded({ key: requestKey, cards: [] });
      });

    return () => {
      active = false;
    };
  }, [ids, limit, requestKey, vocabularyLoading]);

  const ready = loaded?.key === requestKey;
  const rows: TroubleRow[] = ready
    ? loaded.cards
        .map((card) => ({ card, word: index.byId.get(card.wordId) }))
        .filter((row): row is TroubleRow => row.word !== undefined)
    : [];

  if (!ready) {
    return (
      <p
        aria-live="polite"
        className="py-3 text-[0.875rem] text-ink-faint"
      >
        Đang đọc số liệu…
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p
        className="py-3 text-[0.875rem] text-ink-faint"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className="m-0 list-none p-0"
    >
      {rows.map(({ card, word }) => {
        const mistake = card.lastMistake;
        return (
          <li
            key={card.wordId}
            className="min-w-0 border-t border-line first:border-t-0"
          >
            <WordRow
              word={word}
              displayMode={settings.displayMode}
            />
            <p
              className="-mt-1.5 min-w-0 pb-3 text-[0.75rem] leading-relaxed break-words text-ink-faint"
            >
              {`Sai ${card.wrongCount} lần, đúng ${card.correctCount} lần.`}
              {showLastMistake && mistake !== null
                ? ` Gần nhất ${shortDate(mistake.at)} ở ${MODE_LABELS[mistake.mode]}: bạn trả lời “${
                    mistake.given.trim() === '' ? 'bỏ trống' : mistake.given
                  }”, đáp án “${mistake.expected}”.`
                : ''}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
