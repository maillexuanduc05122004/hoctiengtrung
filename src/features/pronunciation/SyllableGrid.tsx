/**
 * Câu mẫu vẽ thành từng ô "pinyin trên, chữ Hán dưới", tô màu theo kết quả
 * chấm của từng âm tiết. Màu không đủ cho người dùng trình đọc màn hình nên ô
 * sai nào cũng có lời chú ẩn nói sai gì.
 */
import type { ExpectedSyllable, SyllableIssue } from '../../lib/api/types.ts';

export type SyllableStatus = SyllableIssue | 'pending' | 'wrong';

export interface GridSyllable extends ExpectedSyllable {
  status: SyllableStatus;
  /** Âm nghe được, chỉ hiện khi khác âm mẫu. */
  heard?: string;
}

const BOX: Record<SyllableStatus, string> = {
  pending: 'text-ink',
  none: 'text-ink',
  tone: 'bg-partial-soft text-partial',
  initial: 'bg-cinnabar-soft text-cinnabar-ink',
  final: 'bg-cinnabar-soft text-cinnabar-ink',
  wrong: 'bg-cinnabar-soft text-cinnabar-ink',
  missing: 'text-ink-faint line-through',
  unclear: 'text-ink-faint',
};

const NOTE: Record<SyllableStatus, string> = {
  pending: '',
  none: '',
  tone: 'sai thanh',
  initial: 'sai phụ âm đầu',
  final: 'sai vần',
  wrong: 'máy nghe ra chữ khác',
  missing: 'bị bỏ sót',
  unclear: 'nghe không rõ',
};

export const ISSUE_LABEL = NOTE;

export interface SyllableGridProps {
  syllables: readonly GridSyllable[];
  showPinyin: boolean;
}

export function SyllableGrid({ syllables, showPinyin }: SyllableGridProps) {
  return (
    <p
      lang="zh-CN"
      className="flex min-w-0 flex-wrap"
    >
      {syllables.map((syllable, index) => {
        const note = NOTE[syllable.status];
        const heard = syllable.heard?.trim() ?? '';
        const showHeard = heard !== '' && heard !== syllable.pinyin && syllable.status !== 'none';
        return (
          <span
            key={`${index}-${syllable.hanzi}`}
            className={`mr-0.5 mb-1 inline-flex flex-col items-center rounded-[0.25rem] px-0.5 ${BOX[syllable.status]}`}
          >
            {showPinyin ? (
              <span
                className="text-[0.75rem] leading-tight"
              >
                {syllable.pinyin}
              </span>
            ) : null}
            <span
              className="han text-[1.75rem] leading-snug"
            >
              {syllable.hanzi}
            </span>
            {note !== '' ? (
              <span
                className="sr-only"
              >
                {` (${note}${showHeard ? `, nghe thành ${heard}` : ''})`}
              </span>
            ) : null}
            {showHeard ? (
              <span
                aria-hidden="true"
                className="text-[0.75rem] leading-tight font-semibold"
              >
                {heard}
              </span>
            ) : null}
          </span>
        );
      })}
    </p>
  );
}
