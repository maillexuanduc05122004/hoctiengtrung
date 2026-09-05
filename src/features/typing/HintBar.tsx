import { useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { DictionarySheet } from '../dictionary/DictionarySheet.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { hintUnits, type TypingChallenge } from './prompt.ts';

export interface HintBarProps {
  word: VocabularyWord;
  challenge: TypingChallenge;
  /** Đánh dấu câu đang làm là đã dùng gợi ý. */
  onUseHint: () => void;
  /** Đưa chữ chọn được trong hộp tra từ vào ô nhập. */
  onInsert: (text: string) => void;
}

interface RevealedRow {
  key: string;
  label: string;
  value: string;
  /** Ngôn ngữ của nội dung, để trình đọc màn hình đọc đúng giọng. */
  lang?: string;
  han?: boolean;
}

/** Ô trống cho phần đáp án chưa mở; dùng gạch dưới toàn rộng để thẳng hàng với chữ Hán. */
const BLANK = '＿';

/**
 * Thanh trợ giúp của chế độ gõ.
 *
 * Nằm ngay trên ô nhập chứ không nằm ở đầu trang: trên điện thoại, bàn phím ảo
 * chiếm nửa dưới màn hình nên mọi thứ người học cần trong lúc gõ phải ở sát ô
 * nhập, nếu không họ phải cuộn lên rồi mất tiêu điểm.
 *
 * Trạng thái gợi ý thuộc về riêng một câu hỏi, nên nơi gọi truyền `key` theo từ
 * hiện tại; sang câu mới là thành phần này được dựng lại và mọi gợi ý đóng lại.
 *
 * Chỉ nút "Nghe phát âm" là không tính gợi ý: nghe phát âm là một phần của việc
 * học từ chứ không phải xem trước đáp án. Vì vậy nhãn của nút cũng không được ghi
 * chữ Hán ra: nhãn đi thẳng vào `title` và `aria-label`, rê chuột lên hay nghe
 * bằng trình đọc màn hình là thấy nguyên đáp án mà lượt đó vẫn tính là tự trả lời.
 */
export function HintBar({ word, challenge, onUseHint, onInsert }: HintBarProps) {
  const [revealed, setRevealed] = useState(0);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showVi, setShowVi] = useState(false);
  const [showEn, setShowEn] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

  const units = hintUnits(challenge);
  const hanziAnswer = challenge.answerKind === 'hanzi';
  const unitNoun = hanziAnswer ? 'chữ' : challenge.answerKind === 'pinyin' ? 'âm tiết' : 'tiếng';

  const vi = word.meanings.vi.filter((item) => item.trim() !== '');
  const en = word.meanings.en.filter((item) => item.trim() !== '');

  const reveal = (count: number): void => {
    setRevealed(Math.min(units.length, count));
    onUseHint();
  };

  const rows: RevealedRow[] = [];
  if (revealed > 0) {
    const shown = units.map((unit, index) => (index < revealed ? unit : BLANK));
    rows.push({
      key: 'units',
      label: `Đáp án (${String(units.length)} ${unitNoun})`,
      value: shown.join(hanziAnswer ? '' : ' '),
      han: hanziAnswer,
    });
  }
  if (showPinyin) {
    rows.push({ key: 'pinyin', label: 'Pinyin', value: word.pinyin, lang: 'zh-Latn-pinyin' });
  }
  if (showVi && vi.length > 0) {
    rows.push({ key: 'vi', label: 'Nghĩa Việt', value: vi.join('; '), lang: 'vi' });
  }
  if (showEn && en.length > 0) {
    rows.push({ key: 'en', label: 'Nghĩa Anh', value: en.join('; '), lang: 'en' });
  }

  return (
    <div
      className="min-w-0"
    >
      {rows.length > 0 ? (
        <dl
          aria-live="polite"
          className="mb-2 min-w-0 border-b border-line pb-2"
        >
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex min-w-0 items-baseline py-0.5"
            >
              <dt
                className="mr-2 w-[5.5rem] shrink-0 text-[0.6875rem] tracking-wide text-ink-faint"
              >
                {row.label}
              </dt>
              <dd
                lang={row.lang}
                className={[
                  'min-w-0 flex-1 break-words text-ink',
                  row.han ? 'han text-[1.25rem]' : 'text-[0.875rem]',
                ].join(' ')}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* Bảy nút không vừa bề ngang 20rem nên hàng này cuộn ngang được. */}
      <div
        className="flex min-w-0 items-center overflow-x-auto py-1"
      >
        <div
          className="shrink-0"
        >
          {/* Nhãn chung chung là cố ý, xem lời giải thích ở đầu tệp. */}
          <SpeakerButton
            text={word.simplified}
            label="Nghe phát âm"
          />
        </div>
        <span
          aria-hidden="true"
          className="mx-2 h-[1.5rem] w-[0.0625rem] shrink-0 bg-line"
        />
        <div
          className="flex shrink-0 items-center space-x-2"
        >
          <Button
            variant="secondary"
            className="shrink-0 px-3 text-[0.8125rem] whitespace-nowrap"
            aria-pressed={showPinyin}
            disabled={word.pinyin.trim() === ''}
            onClick={() => {
              setShowPinyin(true);
              onUseHint();
            }}
          >
            Hiện pinyin
          </Button>
          <Button
            variant="secondary"
            className="shrink-0 px-3 text-[0.8125rem] whitespace-nowrap"
            disabled={units.length === 0 || revealed > 0}
            onClick={() => reveal(1)}
          >
            {`Hiện ${unitNoun} đầu tiên`}
          </Button>
          <Button
            variant="secondary"
            className="shrink-0 px-3 text-[0.8125rem] whitespace-nowrap"
            disabled={revealed === 0 || revealed >= units.length}
            onClick={() => reveal(revealed + 1)}
          >
            {`Hiện thêm một ${unitNoun}`}
          </Button>
          <Button
            variant="secondary"
            className="shrink-0 px-3 text-[0.8125rem] whitespace-nowrap"
            aria-pressed={showVi}
            disabled={vi.length === 0}
            onClick={() => {
              setShowVi(true);
              onUseHint();
            }}
          >
            Nghĩa Việt
          </Button>
          <Button
            variant="secondary"
            className="shrink-0 px-3 text-[0.8125rem] whitespace-nowrap"
            aria-pressed={showEn}
            disabled={en.length === 0}
            onClick={() => {
              setShowEn(true);
              onUseHint();
            }}
          >
            Nghĩa Anh
          </Button>
          <Button
            variant="secondary"
            icon="search"
            className="shrink-0 px-3 text-[0.8125rem] whitespace-nowrap"
            onClick={() => {
              setDictionaryOpen(true);
              onUseHint();
            }}
          >
            Tra từ
          </Button>
        </div>
      </div>

      <DictionarySheet
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        onInsert={onInsert}
      />
    </div>
  );
}
