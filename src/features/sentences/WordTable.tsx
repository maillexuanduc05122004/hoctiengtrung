/**
 * Phần 1: bảng vốn từ, chia đúng các nhóm người học đã tự chia.
 *
 * Mỗi từ có nút nghe riêng vì người học nói rõ là "nghe nó theo từng từ". Mỗi
 * nhóm còn có nút nghe cả nhóm, đọc lần lượt từ đầu đến cuối — buổi sáng vừa
 * pha trà vừa nghe thì không bấm từng nút được.
 *
 * Bảng dùng `<table>` thật chứ không phải lưới div: đây là dữ liệu ba cột, và
 * trình đọc màn hình cần biết ô nào thuộc cột nào.
 */
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { matchesQuery } from './batch.ts';
import { BORROWED_CHARS, MY_WORDS, WORD_GROUPS } from './corpus.ts';
import type { MyWord, WordGroup } from './corpus.ts';

export interface WordTableProps {
  /** Tốc độ đọc của cả trang, do người học chọn ở thanh trên cùng. */
  rate: number;
  /** Chuỗi trong ô tìm; rỗng thì hiện đủ mọi nhóm. */
  query: string;
}

export function WordTable({ rate, query }: WordTableProps) {
  const searching = query.trim() !== '';

  const byGroup = useMemo(() => {
    const map = new Map<WordGroup, MyWord[]>();
    for (const word of MY_WORDS) {
      if (!matchesQuery(word, query)) continue;
      const bucket = map.get(word.group);
      if (bucket) bucket.push(word);
      else map.set(word.group, [word]);
    }
    return map;
  }, [query]);

  const shown = [...byGroup.values()].reduce((sum, words) => sum + words.length, 0);

  return (
    <div>
      {searching ? (
        <p
          className="mb-4 text-[0.9375rem] text-ink-soft"
        >
          {shown === 0 ? 'Không có từ nào khớp.' : `${shown} từ khớp.`}
        </p>
      ) : (
        <p
          className="mb-5 max-w-[42rem] text-[0.9375rem] leading-relaxed text-ink-soft"
        >
          {MY_WORDS.length} từ, gộp từ bảng bạn tự liệt kê và tệp PDF. Bấm loa để nghe một từ,
          hoặc nghe cả nhóm để chạy lần lượt từ đầu đến cuối.
        </p>
      )}

      {WORD_GROUPS.map((group) => {
        const words = byGroup.get(group.id) ?? [];
        if (words.length === 0) return null;
        return (
          <GroupTable
            key={group.id}
            title={group.title}
            note={group.note}
            words={words}
            rate={rate}
          />
        );
      })}

      {searching ? null : <BorrowedNote />}
    </div>
  );
}

interface GroupTableProps {
  title: string;
  note?: string;
  words: readonly MyWord[];
  rate: number;
}

function GroupTable({ title, note, words, rate }: GroupTableProps) {
  const { supported, speaking, speakParts, cancel } = useSpeech();

  const handleGroup = (): void => {
    if (speaking) {
      cancel();
      return;
    }
    void speakParts(
      words.map((word) => word.hanzi),
      'zh-CN',
      rate,
    );
  };

  return (
    <section
      className="mb-8"
    >
      <div
        className="mb-2 flex flex-wrap items-baseline justify-between"
      >
        <div
          className="min-w-0 pr-3"
        >
          <h2
            className="text-[1rem] font-semibold tracking-tight text-ink"
          >
            {title}
            <span
              className="ml-2 text-[0.8125rem] font-normal text-ink-faint"
            >
              {words.length} từ
            </span>
          </h2>
          {note ? (
            <p
              className="mt-0.5 text-[0.8125rem] text-ink-faint"
            >
              {note}
            </p>
          ) : null}
        </div>

        <Button
          variant="quiet"
          icon={speaking ? 'stop' : 'volume'}
          disabled={!supported}
          onClick={handleGroup}
        >
          {speaking ? 'Dừng' : 'Nghe cả nhóm'}
        </Button>
      </div>

      {/* Bảng ba cột trên màn hình hẹp vẫn phải trượt ngang được chứ không co chữ Hán lại. */}
      <div
        className="overflow-x-auto border border-line rounded-[0.375rem] bg-surface"
      >
        <table
          className="w-full border-collapse text-left"
        >
          <thead>
            <tr
              className="border-b border-line"
            >
              <th
                scope="col"
                className="px-3 py-2 text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
              >
                Tiếng Trung
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
              >
                Pinyin
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
              >
                Nghĩa
              </th>
              <th
                scope="col"
                className="px-3 py-2"
              >
                <span
                  className="sr-only"
                >
                  Nghe
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {words.map((word) => (
              <tr
                key={word.hanzi}
                className="border-t border-line"
              >
                <td
                  className="px-3 py-2"
                >
                  <span
                    className="han text-[1.375rem] leading-snug text-ink"
                  >
                    {word.hanzi}
                  </span>
                </td>
                <td
                  className="px-3 py-2 text-[0.9375rem] whitespace-nowrap text-ink-soft"
                >
                  {word.pinyin}
                </td>
                <td
                  className="px-3 py-2 text-[0.9375rem] text-ink"
                >
                  {word.vi}
                </td>
                <td
                  className="px-3 py-2 text-right"
                >
                  <SpeakerButton
                    text={word.hanzi}
                    rate={rate}
                    label={`Nghe ${word.hanzi}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Hai chữ tách ra từ từ ghép đã học. Nói ra để người học không tưởng mình quên
 * mất một từ nào đó khi gặp `去` hay `车` đứng một mình trong câu.
 */
function BorrowedNote() {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="border border-line rounded-[0.375rem] bg-sunken px-3 py-2.5"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="tap w-full text-left text-[0.875rem] font-medium text-ink-soft"
      >
        Trong phần câu có hai chữ đứng riêng mà bảng trên không có
      </button>
      {open ? (
        <ul
          className="mt-2 space-y-1.5"
        >
          {BORROWED_CHARS.map((item) => (
            <li
              key={item.char}
              className="text-[0.875rem] text-ink-soft"
            >
              <span
                className="han text-[1.125rem] text-ink"
              >
                {item.char}
              </span>
              <span
                className="ml-2"
              >
                {item.vi} — tách từ{' '}
                <span
                  className="han text-ink"
                >
                  {item.from}
                </span>{' '}
                bạn đã học. Không phải từ mới.
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
