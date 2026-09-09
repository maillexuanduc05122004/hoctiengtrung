/**
 * Danh sách các từ vừa tra.
 *
 * Đọc thẳng từ IndexedDB bằng liveQuery của Dexie, nên mọi nơi ghi lịch sử —
 * trang tra từ, hộp trượt giữa giờ học, phần quét đoạn văn, thậm chí một thẻ
 * khác của trình duyệt — đều thấy danh sách đổi ngay mà không phải tự báo cho
 * nhau. Đây cũng là lý do phần này không nhận dữ liệu qua thuộc tính.
 *
 * Từ nào không còn trong bộ từ đang nạp thì bỏ qua chứ không hiện dòng trống:
 * bộ dữ liệu có thể đổi mã từ giữa hai phiên bản.
 */
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { clearLookups, getRecentLookups, removeLookup } from '../../db/index.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import { relativeTime } from '../../lib/text/relative-time.ts';
import { WordRow } from '../shared/WordRow.tsx';
import { useSavedIds } from '../saved/useSavedIds.ts';
import type { LookupEntry } from '../../types/study.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

interface HistoryRow {
  entry: LookupEntry;
  word: VocabularyWord;
}

export interface LookupHistoryProps {
  /** Số dòng nhiều nhất được hiện. */
  limit?: number;
  onSelect?: (word: VocabularyWord) => void;
  onInsert?: (text: string) => void;
  /** Bỏ thời gian và nút xoá từng dòng, dùng trong hộp trượt giữa giờ học. */
  compact?: boolean;
}

export function LookupHistory({
  limit = 8,
  onSelect,
  onInsert,
  compact = false,
}: LookupHistoryProps) {
  const { settings } = useSettings();
  const { index } = useVocabulary();
  // Mốc "bây giờ" chốt ngay lúc đọc kho, không đọc đồng hồ giữa lúc vẽ: gọi
  // Date.now() trong thân thành phần thì mỗi lần vẽ lại cho một con số khác, mà
  // nhãn "5 phút trước" không cần chính xác tới từng lượt vẽ.
  const loaded = useLiveQuery(
    async () => ({ entries: await getRecentLookups(limit), at: Date.now() }),
    [limit],
  );
  const entries = loaded?.entries;
  const now = loaded?.at ?? 0;
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { ids: savedIds, toggle: toggleSaved } = useSavedIds();

  const rows = useMemo<HistoryRow[]>(() => {
    if (entries === undefined) return [];
    return entries.flatMap((entry) => {
      const word = index.byId.get(entry.wordId);
      return word === undefined ? [] : [{ entry, word }];
    });
  }, [entries, index.byId]);

  // Chưa tra gì thì không hiện gì cả: một khung rỗng ở đây chỉ chiếm chỗ của
  // danh sách gợi ý ngay bên dưới.
  if (rows.length === 0) return null;

  return (
    <section
      aria-label="Từ vừa tra"
      className="min-w-0"
    >
      <div
        className="mb-1 flex min-w-0 items-center justify-between"
      >
        <div
          className="min-w-0"
        >
          <p
            className="text-[0.8125rem] font-medium text-ink-soft"
          >
            Vừa tra
          </p>
          {/* Nói rõ đây là thứ máy tự ghi, khác hẳn sổ tay do người học tự
              chọn: hai danh sách trông giống nhau nên rất dễ nhầm, rồi một
              hôm từ biến mất vì lịch sử chỉ giữ 300 dòng gần nhất. */}
          {compact ? null : (
            <p
              className="text-[0.75rem] leading-snug text-ink-faint"
            >
              Máy tự ghi khi bạn mở một từ, chỉ giữ 300 từ gần nhất. Bấm sao để giữ lâu dài.
            </p>
          )}
        </div>
        {compact ? null : (
          <div
            className="flex shrink-0 items-center space-x-1"
          >
            {confirmingClear ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmingClear(false)}
                >
                  Thôi
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setConfirmingClear(false);
                    void clearLookups();
                  }}
                >
                  Xoá thật
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setConfirmingClear(true)}
              >
                Xoá lịch sử
              </Button>
            )}
          </div>
        )}
      </div>

      <ul
        className="min-w-0 border-t border-line"
      >
        {rows.map(({ entry, word }) => (
          <li
            key={entry.wordId}
            className="flex min-w-0 items-center border-b border-line"
          >
            <div
              className="min-w-0 flex-1"
            >
              <WordRow
                word={word}
                displayMode={settings.displayMode}
                hidePinyin={settings.hidePinyin}
                onInsert={onInsert}
                onSelect={onSelect}
                showLevel
                showTraditional={settings.showTraditional}
                saved={savedIds.has(word.id)}
                onToggleSave={() => void toggleSaved(word.id)}
              />
            </div>

            {compact ? null : (
              <div
                className="ml-2 flex shrink-0 items-center space-x-1"
              >
                <span
                  className="text-right text-[0.75rem] text-ink-faint xsm:hidden"
                >
                  {relativeTime(entry.at, now)}
                  {entry.count > 1 ? ` · ${entry.count} lần` : ''}
                </span>
                <IconButton
                  icon="close"
                  label={`Bỏ ${word.simplified} khỏi lịch sử`}
                  iconSize={0.9375}
                  onClick={() => void removeLookup(entry.wordId)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
