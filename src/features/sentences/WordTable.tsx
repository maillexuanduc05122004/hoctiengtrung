/**
 * Phần 1: bảng vốn từ đã học, lấy từ máy chủ.
 *
 * Nhóm đầu là mười từ học gần nhất — đúng nhóm mà AI được dặn lặp nhiều nhất
 * khi viết câu — rồi đến từng cấp HSK. Một từ chỉ nằm ở một nhóm: đã ở nhóm
 * mới nhất thì không lặp lại ở nhóm cấp, nếu không đếm tổng sẽ sai.
 *
 * Mỗi từ có nút nghe riêng vì người học nói rõ là "nghe nó theo từng từ". Mỗi
 * nhóm còn có nút nghe cả nhóm, đọc lần lượt từ đầu đến cuối — buổi sáng vừa
 * pha trà vừa nghe thì không bấm từng nút được.
 *
 * Bảng dùng `<table>` thật chứ không phải lưới div: đây là dữ liệu ba cột, và
 * trình đọc màn hình cần biết ô nào thuộc cột nào.
 */
import { useMemo } from 'react';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import type { UserWord } from '../../lib/api/types.ts';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { groupWords, matchesWord } from './words.ts';

export interface WordTableProps {
  words: readonly UserWord[];
  /** Tốc độ đọc của cả trang, do người học chọn ở thanh trên cùng. */
  rate: number;
  /** Chuỗi trong ô tìm; rỗng thì hiện đủ mọi nhóm. */
  query: string;
  /** Bỏ một từ khỏi danh sách đã học. Không truyền thì không hiện nút. */
  onRemove?: (wordId: number) => void;
}

export function WordTable({ words, rate, query, onRemove }: WordTableProps) {
  const searching = query.trim() !== '';

  const groups = useMemo(
    () => groupWords(words.filter((word) => matchesWord(word, query))),
    [query, words],
  );

  const shown = groups.reduce((sum, group) => sum + group.words.length, 0);

  if (words.length === 0) {
    return (
      <p
        className="text-[0.9375rem] text-ink-soft"
      >
        Chưa có từ nào. Sang thẻ <strong>Thêm từ &amp; câu</strong> để dán những từ bạn đã học.
      </p>
    );
  }

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
          {words.length} từ bạn đã đánh dấu là đã học. Bấm loa để nghe một từ, hoặc nghe cả nhóm
          để chạy lần lượt từ đầu đến cuối.
        </p>
      )}

      {groups.map((group) => (
        <GroupTable
          key={group.key}
          title={group.title}
          note={group.note}
          words={group.words}
          rate={rate}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface GroupTableProps {
  title: string;
  note?: string;
  words: readonly UserWord[];
  rate: number;
  onRemove?: (wordId: number) => void;
}

function GroupTable({ title, note, words, rate, onRemove }: GroupTableProps) {
  const { supported, speaking, speakParts, cancel } = useSpeech();

  const handleGroup = (): void => {
    if (speaking) {
      cancel();
      return;
    }
    void speakParts(
      words.map((word) => word.simplified),
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
                  Thao tác
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {words.map((word) => (
              <tr
                key={word.id}
                className="border-t border-line"
              >
                <td
                  className="px-3 py-2"
                >
                  <span
                    lang="zh-CN"
                    className="han text-[1.375rem] leading-snug text-ink"
                  >
                    {word.simplified}
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
                  {word.meaningVi}
                </td>
                <td
                  className="px-3 py-2 text-right whitespace-nowrap"
                >
                  <SpeakerButton
                    text={word.simplified}
                    rate={rate}
                    label={`Nghe ${word.simplified}`}
                  />
                  {onRemove ? (
                    <IconButton
                      icon="close"
                      label="Bỏ khỏi danh sách đã học"
                      iconSize={1}
                      onClick={() => onRemove(word.wordId)}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
