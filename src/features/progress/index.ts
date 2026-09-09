/** Phần theo dõi tiến độ: dùng chung cho trang chủ và trang Tiến độ. */

export { DataSafety } from './DataSafety.tsx';
export type { DataSafetyProps } from './DataSafety.tsx';

export { ProgressOverview } from './ProgressOverview.tsx';
export type { ProgressOverviewProps } from './ProgressOverview.tsx';

export { TroubleWords } from './TroubleWords.tsx';
export type { TroubleWordsProps } from './TroubleWords.tsx';

export { WeeklyChart } from './WeeklyChart.tsx';
export type { WeeklyChartProps } from './WeeklyChart.tsx';

export {
  useModeBreakdown,
  useProgressSummary,
  useSuggestedLesson,
} from './useProgressSummary.ts';
export type {
  ModeBreakdownState,
  ModeStat,
  ProgressSummaryState,
  SuggestedLesson,
  SuggestedLessonState,
} from './useProgressSummary.ts';
