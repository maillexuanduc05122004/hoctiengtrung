import type { ReactNode } from 'react';
import { Chip } from '../../components/ui/Controls.tsx';
import { Icon, type IconName } from '../../components/ui/Icon.tsx';
import type { AnswerVerdict } from '../../types/study.ts';
import { containsHanzi } from './hanzi.ts';

export interface VerdictBannerProps {
  verdict: AnswerVerdict;
  usedHint?: boolean;
  explanation?: string;
  expected?: string;
  children?: ReactNode;
}

interface VerdictTone {
  title: string;
  icon: IconName;
  box: string;
  accent: string;
}

const TONES: Record<AnswerVerdict, VerdictTone> = {
  correct: {
    title: 'Đúng',
    icon: 'check',
    box: 'border-teal/40 bg-teal-soft',
    accent: 'text-teal-ink',
  },
  close: {
    title: 'Gần đúng',
    icon: 'info',
    box: 'border-partial/45 bg-partial-soft',
    accent: 'text-partial',
  },
  wrong: {
    title: 'Chưa đúng',
    icon: 'close',
    box: 'border-cinnabar/40 bg-cinnabar-soft',
    accent: 'text-cinnabar-ink',
  },
};

/**
 * Dải kết quả sau mỗi câu trả lời.
 *
 * Đọc lên bằng aria-live để người dùng trình đọc màn hình biết kết quả ngay mà
 * không phải đi tìm. Khi có dùng gợi ý thì nói thẳng là câu này không tính là tự
 * trả lời, tránh việc người học tưởng mình đã nhớ được từ.
 */
export function VerdictBanner({
  verdict,
  usedHint = false,
  explanation,
  expected,
  children,
}: VerdictBannerProps) {
  const tone = TONES[verdict];
  const answer = expected?.trim() ?? '';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`border px-4 py-3 rounded-[0.375rem] ${tone.box}`}
    >
      <div
        className="flex min-w-0 items-center"
      >
        <span
          className={`shrink-0 ${tone.accent}`}
        >
          <Icon
            name={tone.icon}
            size={1.125}
          />
        </span>
        <p
          className={`ml-2 min-w-0 text-[1rem] font-semibold ${tone.accent}`}
        >
          {tone.title}
        </p>
        {usedHint ? (
          <span
            className="ml-auto pl-2"
          >
            <Chip tone="warn">Đã dùng gợi ý</Chip>
          </span>
        ) : null}
      </div>

      {explanation !== undefined && explanation.trim() !== '' ? (
        <p
          className="mt-1.5 min-w-0 leading-relaxed break-words text-[0.875rem] text-ink-soft"
        >
          {explanation}
        </p>
      ) : null}

      {answer !== '' ? (
        <p
          className="mt-2 flex min-w-0 flex-wrap items-baseline text-[0.875rem] text-ink-soft"
        >
          <span
            className="mr-2 shrink-0"
          >
            Đáp án:
          </span>
          <span
            className={[
              'min-w-0 font-semibold break-words text-ink',
              containsHanzi(answer) ? 'han text-[1.375rem]' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {answer}
          </span>
        </p>
      ) : null}

      {usedHint ? (
        <p
          className="mt-1.5 text-[0.8125rem] text-ink-faint"
        >
          Câu này không tính là tự trả lời.
        </p>
      ) : null}

      {children !== undefined && children !== null ? (
        <div
          className="mt-3 border-t border-line pt-3"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
