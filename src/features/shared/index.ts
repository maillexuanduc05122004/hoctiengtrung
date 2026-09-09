/** Các thành phần dùng chung cho bốn chế độ luyện tập và trang tra từ. */

export { containsHanzi } from './hanzi.ts';

export { DiffText } from './DiffText.tsx';
export type { DiffTextProps } from './DiffText.tsx';

export { ExampleBlock } from './ExampleBlock.tsx';
export type { ExampleBlockProps } from './ExampleBlock.tsx';

export { MeaningList } from './MeaningList.tsx';
export type { MeaningListProps } from './MeaningList.tsx';

export { ModeSwitch } from './ModeSwitch.tsx';
export type { ModeSwitchProps } from './ModeSwitch.tsx';

export { SaveWordButton } from './SaveWordButton.tsx';
export type { SaveWordButtonProps } from './SaveWordButton.tsx';

export { saveWordMessage } from './save-word.ts';

export { PinyinLine } from './PinyinLine.tsx';
export type { PinyinLineProps } from './PinyinLine.tsx';

export { SessionSummary } from './SessionSummary.tsx';
export type { SessionSummaryProps } from './SessionSummary.tsx';

export { SpeakerButton } from './SpeakerButton.tsx';
export type { SpeakerButtonProps } from './SpeakerButton.tsx';

export { StudyHeader } from './StudyHeader.tsx';
export type { StudyHeaderProps } from './StudyHeader.tsx';

export { StudyOptions } from './StudyOptions.tsx';
export type { StudyOptionsProps, StudyOptionsValue } from './StudyOptions.tsx';

export { POOL_LABEL, studySessionQuery, studySourceLabel } from './study-source.ts';
export type { StudySourceOptions } from './study-source.ts';

export { usePoolCounts } from './usePoolCounts.ts';
export type { PoolCounts, PoolCountsState } from './usePoolCounts.ts';

export { VerdictBanner } from './VerdictBanner.tsx';
export type { VerdictBannerProps } from './VerdictBanner.tsx';

export { WordFace } from './WordFace.tsx';
export type { WordFaceProps, WordFaceSize } from './WordFace.tsx';

export { WordRow } from './WordRow.tsx';
export type { WordRowProps } from './WordRow.tsx';

export { WordStatusChip } from './WordStatusChip.tsx';

export { wordStatus, WORD_STATUS_LABEL } from './word-status.ts';
export type { WordStatus } from './word-status.ts';
