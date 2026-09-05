/**
 * Phần tra từ đầy đủ của trang Tra từ: ô nhập, bộ lọc cấp và danh sách kết quả.
 *
 * Không có nút "Tìm" vì người học thường chỉ mở trang này để kiểm tra nhanh một
 * chữ; kết quả chạy ngay khi gõ, có hoãn một nhịp ngắn ở lớp hook.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { EmptyState, Notice, Spinner } from '../../components/ui/Feedback.tsx';
import { WordRow } from '../shared/WordRow.tsx';
import { useSettings } from '../../hooks/settings-context.ts';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import { SearchField } from './SearchField.tsx';
import { useDictionarySearch, useSuggestedWords, type LevelFilter } from './useDictionarySearch.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

/** Số kết quả tối đa hiện trên trang; nhiều hơn thì cuộn mãi cũng không ai đọc. */
const RESULT_LIMIT = 40;

/** Đổi giá trị của nhóm nút thành bộ lọc cấp mà không cần ép kiểu. */
function toLevelFilter(value: string): LevelFilter {
  switch (value) {
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    default:
      return 'all';
  }
}

export interface DictionarySearchProps {
  autoFocus?: boolean;
  onSelect?: (word: VocabularyWord) => void;
}

export function DictionarySearch({ autoFocus = false, onSelect }: DictionarySearchProps) {
  const { settings } = useSettings();
  const { index, loading, error, reload } = useVocabulary();
  const [level, setLevel] = useState<LevelFilter>('all');
  const { query, setQuery, hits, pending } = useDictionarySearch({ level, limit: RESULT_LIMIT });
  const suggestions = useSuggestedWords(8);

  const levelOptions = useMemo<SegmentedOption<string>[]>(
    () => [
      { value: 'all', label: 'Tất cả', srLabel: 'Tất cả các cấp' },
      ...index.levels.map((value) => ({ value: String(value), label: `HSK ${value}` })),
    ],
    [index.levels],
  );

  const trimmed = query.trim();
  let body: ReactNode;

  if (error !== null) {
    body = (
      <Notice
        tone="error"
        title="Chưa tải được bộ từ"
      >
        <p
          className="break-words"
        >
          {error}
        </p>
        <div
          className="mt-2.5"
        >
          <Button
            variant="secondary"
            icon="refresh"
            onClick={reload}
          >
            Thử lại
          </Button>
        </div>
      </Notice>
    );
  } else if (loading) {
    body = <Spinner label="Đang tải bộ từ" />;
  } else if (trimmed === '') {
    body =
      suggestions.length > 0 ? (
        <div
          className="min-w-0"
        >
          <p
            className="mb-1 text-[0.8125rem] font-medium text-ink-soft"
          >
            Từ trong cấp bạn đang học
          </p>
          <ul
            className="min-w-0 border-t border-line"
          >
            {suggestions.map((word) => (
              <li
                key={word.id}
                className="min-w-0 border-b border-line"
              >
                <WordRow
                  word={word}
                  displayMode={settings.displayMode}
                  hidePinyin={settings.hidePinyin}
                  onSelect={onSelect}
                  showLevel
                  showTraditional={settings.showTraditional}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="Gõ để bắt đầu tra từ"
          description="Tìm được theo chữ Hán, pinyin có dấu hoặc không dấu, nghĩa tiếng Việt có dấu hoặc không dấu, và tiếng Anh."
        />
      );
  } else if (hits.length === 0) {
    body = pending ? (
      <p
        role="status"
        className="px-2 py-8 text-center text-[0.875rem] text-ink-faint"
      >
        Đang tìm…
      </p>
    ) : (
      <EmptyState
        icon="search"
        title="Không tìm thấy từ nào"
        description="Thử bỏ dấu, gõ ít chữ hơn, hoặc chuyển bộ lọc cấp về Tất cả."
      />
    );
  } else {
    body = (
      <div
        className="min-w-0"
      >
        <p
          role="status"
          className="mb-1 text-[0.8125rem] text-ink-faint"
        >
          {hits.length >= RESULT_LIMIT
            ? `Hiện ${RESULT_LIMIT} kết quả sát nhất`
            : `${hits.length} kết quả`}
        </p>
        <ul
          className="min-w-0 border-t border-line"
        >
          {hits.map((hit) => (
            <li
              key={hit.word.id}
              className="min-w-0 border-b border-line"
            >
              <WordRow
                word={hit.word}
                displayMode={settings.displayMode}
                hidePinyin={settings.hidePinyin}
                onSelect={onSelect}
                showLevel
                showTraditional={settings.showTraditional}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section
      aria-label="Tra từ"
      className="min-w-0"
    >
      <SearchField
        value={query}
        onChange={setQuery}
        label="Tìm từ trong bộ HSK"
        autoFocus={autoFocus}
      />
      <p
        className="mt-2 text-[0.8125rem] text-ink-faint"
      >
        Gõ chữ Hán, pinyin (có dấu hay không đều được), nghĩa tiếng Việt hoặc tiếng Anh.
      </p>

      {levelOptions.length > 2 ? (
        <div
          className="mt-3"
        >
          <Segmented
            legend="Lọc theo cấp"
            options={levelOptions}
            value={level === 'all' ? 'all' : String(level)}
            onChange={(next) => setLevel(toLevelFilter(next))}
          />
        </div>
      ) : null}

      <div
        className="mt-4 min-w-0"
      >
        {body}
      </div>
    </section>
  );
}
