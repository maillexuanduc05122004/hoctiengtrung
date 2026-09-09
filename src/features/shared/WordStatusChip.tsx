import { Chip, type ChipProps } from '../../components/ui/Controls.tsx';
import { WORD_STATUS_LABEL, type WordStatus } from './word-status.ts';

/*
  Màu theo đúng quy tắc dùng chung của ứng dụng: đỏ son là việc cần làm ngay,
  vàng đất là đang dở dang, xanh ngọc là đã xong, xám là chưa đụng tới.
*/
const STATUS_TONE: Record<WordStatus, NonNullable<ChipProps['tone']>> = {
  new: 'neutral',
  learning: 'warn',
  due: 'cinnabar',
  known: 'teal',
};

export function WordStatusChip({ status }: { status: WordStatus }) {
  return <Chip tone={STATUS_TONE[status]}>{WORD_STATUS_LABEL[status]}</Chip>;
}
