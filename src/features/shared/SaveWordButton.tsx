/**
 * Nút lưu một từ vào sổ tay.
 *
 * Trước đây sáu màn hình mỗi nơi tự dựng một `IconButton` với nhãn riêng và màu
 * riêng, nên cùng một hành động lại trông khác nhau tuỳ chỗ bấm. Gom về một
 * thành phần để nhãn, màu và trạng thái bật giống nhau ở mọi nơi.
 */
import { IconButton } from '../../components/ui/Button.tsx';

export interface SaveWordButtonProps {
  /** Chữ Hán của từ, dùng trong nhãn cho trình đọc màn hình. */
  word: string;
  saved: boolean;
  onToggle: () => void;
  disabled?: boolean;
  iconSize?: number;
}

export function SaveWordButton({
  word,
  saved,
  onToggle,
  disabled = false,
  iconSize,
}: SaveWordButtonProps) {
  return (
    <IconButton
      icon={saved ? 'star-filled' : 'star'}
      label={saved ? `Bỏ lưu từ ${word}` : `Lưu từ ${word}`}
      pressed={saved}
      pressedVariant="saved"
      disabled={disabled}
      iconSize={iconSize}
      onClick={onToggle}
    />
  );
}
