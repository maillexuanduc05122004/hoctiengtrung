import { IconButton } from '../../components/ui/Button.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';

export interface SpeakerButtonProps {
  text: string;
  lang?: 'zh-CN' | 'vi-VN' | 'en-US';
  label?: string;
  rate?: number;
  /** Đọc chậm để nghe rõ từng thanh điệu. */
  slow?: boolean;
  /** Cỡ biểu tượng tính bằng rem. */
  size?: number;
}

/** Tốc độ dành cho nút nghe chậm, khớp với mức chậm nhất trong cài đặt. */
const SLOW_RATE = 0.7;

/**
 * Nút nghe phát âm.
 *
 * Chỉ phát khi người dùng bấm, không bao giờ tự phát. Bấm lần nữa trong lúc đang
 * đọc thì dừng lại, vì trên điện thoại người học hay bấm nhầm và không có cách
 * nào khác để tắt tiếng.
 */
export function SpeakerButton({
  text,
  lang = 'zh-CN',
  label,
  rate,
  slow = false,
  size = 1.125,
}: SpeakerButtonProps) {
  const { supported, speaking, speak, cancel } = useSpeech();

  const content = text.trim();
  if (content === '') return null;

  const baseLabel = label ?? (slow ? 'Nghe chậm hơn' : 'Nghe phát âm');
  const handleClick = (): void => {
    if (speaking) {
      cancel();
      return;
    }
    // `speak` không bao giờ reject nên chỉ cần thả trôi lời hứa.
    void speak(content, lang, slow ? SLOW_RATE : rate);
  };

  return (
    <IconButton
      icon={speaking ? 'stop' : slow ? 'volume-slow' : 'volume'}
      label={
        supported
          ? speaking
            ? 'Dừng đọc'
            : baseLabel
          : `${baseLabel} — thiết bị này không đọc được`
      }
      iconSize={size}
      disabled={!supported}
      onClick={handleClick}
    />
  );
}
