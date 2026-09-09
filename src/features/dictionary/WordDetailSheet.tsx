/**
 * Trang chi tiết một từ, mở ra từ danh sách kết quả tra cứu.
 *
 * Dữ liệu có sẵn câu ví dụ và nghĩa đầy đủ, nhưng một dòng trong danh sách chỉ
 * đủ chỗ cho nghĩa gọn; đây là nơi xem hết. Trạng thái đánh dấu sao đọc bằng
 * liveQuery nên bấm sao ở đây thì trang buổi học mở sau đó cũng đã đúng.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { IconButton } from '../../components/ui/Button.tsx';
import { BottomSheet } from '../../components/ui/BottomSheet.tsx';
import { Chip } from '../../components/ui/Controls.tsx';
import { getCard, toggleStar } from '../../db/index.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import { ExampleBlock } from '../shared/ExampleBlock.tsx';
import { MeaningList } from '../shared/MeaningList.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import type { VocabularyWord } from '../../types/vocabulary.ts';

/** Nhiều hơn từng này thì tấm trượt phải cuộn quá dài, mà câu sau cũng ít ai đọc. */
const MAX_EXAMPLES = 3;

export interface WordDetailSheetProps {
  word: VocabularyWord | null;
  onClose: () => void;
}

export function WordDetailSheet({ word, onClose }: WordDetailSheetProps) {
  const { settings } = useSettings();
  const wordId = word?.id ?? null;
  const card = useLiveQuery(
    async () => (wordId === null ? undefined : await getCard(wordId)),
    [wordId],
  );

  if (word === null) return null;

  const starred = card?.starred ?? false;
  // Rất nhiều từ HSK 1-3 có phồn thể trùng giản thể; lặp lại chỉ làm rối đầu trang.
  const traditional =
    word.traditional !== undefined && word.traditional !== word.simplified
      ? word.traditional
      : null;
  const examples = word.examples.slice(0, MAX_EXAMPLES);

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Chi tiết từ"
      description="Nghĩa đầy đủ, cách đọc và câu ví dụ."
    >
      <div
        className="min-w-0"
      >
        <div
          className="flex min-w-0 items-start justify-between"
        >
          <div
            className="min-w-0 pr-2"
          >
            <p
              lang="zh-Hans"
              className="han min-w-0 text-[2.25rem] leading-tight break-words text-ink"
            >
              {word.simplified}
            </p>
            {traditional !== null ? (
              <p
                lang="zh-Hant"
                className="mt-0.5 min-w-0 text-[0.8125rem] break-words text-ink-faint"
              >
                <span
                  className="mr-1"
                >
                  Phồn thể
                </span>
                <span
                  className="han text-[1.0625rem] text-ink-soft"
                >
                  {traditional}
                </span>
              </p>
            ) : null}
            <p
              lang="zh-Latn-pinyin"
              className="mt-1 min-w-0 text-[1.0625rem] tracking-wide break-words text-ink-soft"
            >
              {word.pinyin}
            </p>
          </div>

          <div
            className="flex shrink-0 items-center space-x-0.5"
          >
            <SpeakerButton
              text={word.simplified}
              label={`Nghe phát âm từ ${word.simplified}`}
            />
            <SpeakerButton
              text={word.simplified}
              label="Nghe chậm hơn"
              slow
            />
            <IconButton
              icon={starred ? 'star-filled' : 'star'}
              label={starred ? `Bỏ lưu từ ${word.simplified}` : `Lưu từ ${word.simplified}`}
              pressed={starred}
              pressedVariant="saved"
              onClick={() => void toggleStar(word.id)}
            />
          </div>
        </div>

        <div
          className="mt-1.5 flex min-w-0 flex-wrap items-center"
        >
          <Chip
            tone="teal"
            className="mt-1.5 mr-1.5"
          >
            {`HSK ${word.hskLevel}`}
          </Chip>
          {(word.partOfSpeech ?? []).map((part) => (
            <Chip
              key={part}
              className="mt-1.5 mr-1.5"
            >
              {part}
            </Chip>
          ))}
          {word.translationStatus === 'machine' ? (
            <Chip
              tone="warn"
              className="mt-1.5 mr-1.5"
            >
              Nghĩa do máy dịch
            </Chip>
          ) : null}
        </div>

        <div
          className="mt-4 min-w-0 border-t border-line pt-4"
        >
          <MeaningList
            word={word}
            displayMode={settings.displayMode}
          />
        </div>

        {examples.length > 0 ? (
          <div
            className="mt-4 min-w-0 border-t border-line pt-4"
          >
            <p
              className="mb-2 text-[0.8125rem] font-medium text-ink-soft"
            >
              {examples.length === 1 ? 'Câu ví dụ' : `${examples.length} câu ví dụ`}
            </p>
            <ul
              className="min-w-0 space-y-3"
            >
              {examples.map((example, position) => (
                <li
                  key={`${position}-${example.zh}`}
                  className={[
                    'min-w-0',
                    position > 0 ? 'border-t border-line pt-3' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <ExampleBlock
                    example={example}
                    displayMode={settings.displayMode}
                    showPinyin={!settings.hidePinyin}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {word.lessonId !== undefined ? (
          <div
            className="mt-4 min-w-0 border-t border-line pt-4"
          >
            <Link
              to={`/buoi-hoc/${word.lessonId}`}
              onClick={onClose}
              className="text-[0.875rem] text-teal-ink underline underline-offset-2"
            >
              Mở buổi học có từ này
            </Link>
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
