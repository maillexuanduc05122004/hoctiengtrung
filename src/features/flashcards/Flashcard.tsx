/**
 * Một tấm thẻ học.
 *
 * Thẻ được vẽ như một tấm thẻ giấy thật: viền mảnh, nền sáng hơn nền trang một
 * chút, chữ Hán chiếm gần hết mặt trước. Toàn bộ mặt thẻ là một nút lật phủ lên
 * trên, còn các khối có nút bấm riêng (nghe nghĩa, nghe câu ví dụ) được nâng lên
 * bằng `relative z-10` để vẫn bấm được — cách này giữ nút lật là một thẻ button
 * thật, không phải một khối div lồng nút bên trong.
 */
import { Chip } from '../../components/ui/Controls.tsx';
import { ExampleBlock } from '../shared/ExampleBlock.tsx';
import { MeaningList } from '../shared/MeaningList.tsx';
import { PinyinLine } from '../shared/PinyinLine.tsx';
import { WordFace } from '../shared/WordFace.tsx';
import type { DisplayMode } from '../../types/settings.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

export interface FlashcardProps {
  word: VocabularyWord;
  /** Đang mở mặt sau hay không. */
  flipped: boolean;
  onFlip: () => void;
  displayMode: DisplayMode;
  /** Ẩn pinyin ở mặt trước theo cài đặt của người học. */
  hidePinyin?: boolean;
  showTraditional?: boolean;
  /** Độ lệch khi đang vuốt, tính bằng rem. */
  offsetRem?: number;
  /** Ngón tay đang giữ thẻ: tắt chuyển động để thẻ bám tay. */
  dragging?: boolean;
  /** Nhãn nhỏ ở góc thẻ, ví dụ khi đang xem lại thẻ cũ. */
  note?: string;
}

/** Mã từ loại trong bộ dữ liệu HSK, đổi sang tên tiếng Việt. */
const PART_OF_SPEECH_VI: Record<string, string> = {
  N: 'danh từ',
  V: 'động từ',
  Adj: 'tính từ',
  Adv: 'phó từ',
  Num: 'số từ',
  M: 'lượng từ',
  Pron: 'đại từ',
  Prep: 'giới từ',
  Conj: 'liên từ',
  Aux: 'trợ từ',
  Prefix: 'tiền tố',
  Suffix: 'hậu tố',
  Pr: 'danh từ riêng',
};

export function Flashcard({
  word,
  flipped,
  onFlip,
  displayMode,
  hidePinyin = false,
  showTraditional = false,
  offsetRem = 0,
  dragging = false,
  note,
}: FlashcardProps) {
  // Đổi khoá là dựng lại khối nội dung, nhờ đó `starting:` (tức @starting-style)
  // chạy được một chuyển động vào rất ngắn mà không cần state hay bộ đếm nào.
  // Trình duyệt chưa hỗ trợ thì nội dung hiện ngay, vẫn đúng.
  const faceKey = `${word.id}-${flipped ? 'sau' : 'truoc'}`;
  const example = word.examples.length > 0 ? word.examples[0] : null;
  const partsOfSpeech = (word.partOfSpeech ?? []).map((code) => PART_OF_SPEECH_VI[code] ?? code);

  return (
    <div
      style={{ transform: `translateX(${offsetRem.toFixed(3)}rem) rotate(${(offsetRem * 0.3).toFixed(3)}deg)` }}
      className={[
        'relative min-w-0 border border-line-strong bg-surface rounded-[0.375rem]',
        'shadow-[0_0.0625rem_0.1875rem_rgba(32,29,24,0.08)]',
        dragging ? 'transition-none' : 'transition-transform duration-200',
      ].join(' ')}
    >
      {/* Nút lật phủ kín mặt thẻ: bấm chuột hay bấm phím cách, phím Enter đều lật. */}
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={
          flipped
            ? `Mặt sau của thẻ ${word.simplified}. Bấm để xem lại mặt trước.`
            : `Mặt trước của thẻ ${word.simplified}. Bấm để xem nghĩa.`
        }
        onClick={onFlip}
        className="absolute top-0 right-0 bottom-0 left-0 rounded-[0.375rem]"
      />

      <div
        className="flex min-h-[19rem] min-w-0 flex-col px-5 py-4 xsm:min-h-[16rem] xsm:px-4"
      >
        <div
          className="flex min-w-0 items-center justify-between"
        >
          <Chip>{`HSK ${word.hskLevel}`}</Chip>
          {note !== undefined && note !== '' ? <Chip tone="warn">{note}</Chip> : null}
        </div>

        <div
          aria-live="polite"
          className="mt-3 flex min-w-0 flex-1 flex-col"
        >
          <div
            key={faceKey}
            className="flex min-w-0 flex-1 translate-y-0 flex-col opacity-100 transition duration-200 starting:translate-y-[0.375rem] starting:opacity-0"
          >
            {flipped ? (
              <div
                className="min-w-0 flex-1"
              >
                <WordFace
                  word={word}
                  size="md"
                  showTraditional={showTraditional}
                />
                <div
                  className="mt-1.5"
                >
                  <PinyinLine pinyin={word.pinyin} />
                </div>
                {partsOfSpeech.length > 0 ? (
                  <p
                    className="mt-1 min-w-0 break-words text-[0.75rem] text-ink-faint"
                  >
                    {partsOfSpeech.join(' · ')}
                  </p>
                ) : null}

                <div
                  className="relative z-10 mt-4 border-t border-line pt-4"
                >
                  <MeaningList
                    word={word}
                    displayMode={displayMode}
                  />
                </div>

                {example !== null ? (
                  <div
                    className="relative z-10 mt-4 border-t border-line pt-4"
                  >
                    <p
                      className="mb-1.5 text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
                    >
                      Ví dụ
                    </p>
                    <ExampleBlock
                      example={example}
                      displayMode={displayMode}
                    />
                  </div>
                ) : null}

                <p
                  className="mt-5 text-[0.75rem] text-ink-faint"
                >
                  Chạm vào vùng trống của thẻ để quay lại mặt trước.
                </p>
              </div>
            ) : (
              <div
                className="flex min-w-0 flex-1 flex-col items-center justify-center py-4 text-center"
              >
                <WordFace
                  word={word}
                  size="xl"
                  showTraditional={showTraditional}
                  className="text-center"
                />
                <div
                  className="mt-5 flex min-w-0 justify-center"
                >
                  <PinyinLine
                    pinyin={word.pinyin}
                    hidden={hidePinyin}
                  />
                </div>
                <p
                  className="mt-6 min-w-0 break-words text-[0.75rem] text-ink-faint"
                >
                  Chạm vào thẻ để xem nghĩa.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
