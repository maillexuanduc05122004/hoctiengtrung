/**
 * Ô nhập của phần tra từ, dùng chung cho hộp trượt và trang Tra từ.
 *
 * Biểu tượng kính lúp và nút xoá đặt tuyệt đối ở hai mép nên ô nhập vẫn là một
 * hình chữ nhật liền: viền tiêu điểm bao trọn ô thay vì lồng thêm một khung nữa
 * bên ngoài.
 */
import { useId, type RefObject } from 'react';
import { Icon } from '../../components/ui/Icon.tsx';
import { IconButton } from '../../components/ui/Button.tsx';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Nhãn cho trình đọc màn hình, vì ô nhập không có nhãn nhìn thấy được. */
  label: string;
  placeholder?: string;
  /** Cho nơi gọi giành lại tiêu điểm sau khi tấm trượt đã mở xong. */
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
}

export function SearchField({
  value,
  onChange,
  label,
  placeholder = 'Chữ Hán, pinyin, tiếng Việt hoặc tiếng Anh',
  inputRef,
  autoFocus = false,
}: SearchFieldProps) {
  const id = useId();

  return (
    <div
      role="search"
      className="relative min-w-0"
    >
      <label
        htmlFor={id}
        className="sr-only"
      >
        {label}
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 left-3 flex items-center text-ink-faint"
      >
        <Icon name="search" size={1.125} />
      </span>
      <input
        id={id}
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // Ô này tìm ngay trong lúc gõ nên Enter không có việc gì để làm. Phải
          // chặn hẳn: hộp tra từ được mở giữa lúc làm bài nên có khi nằm trong
          // form gõ đáp án, để nguyên thì Enter (phím "tìm kiếm" của bàn phím
          // ảo) chấm luôn câu đang làm rồi hộp tra từ biến mất. Đang gõ dở bằng
          // bộ gõ tiếng Trung thì Enter là để chốt chữ, không đụng vào.
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            return;
          }
          // Phím Esc xoá nhanh ô tìm kiếm. Trong hộp trượt, phím này đã bị tấm
          // trượt bắt trước để đóng lại nên ở đây chỉ có tác dụng trên trang.
          if (event.key === 'Escape' && value !== '') onChange('');
        }}
        className="tap w-full min-w-0 rounded-[0.375rem] border border-line-strong bg-surface py-2.5 pr-12 pl-10 text-ink placeholder:text-ink-faint [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value !== '' ? (
        <span
          className="absolute top-0 right-1 bottom-0 flex items-center"
        >
          <IconButton
            icon="close"
            label="Xoá nội dung tìm"
            iconSize={1.0625}
            onClick={() => onChange('')}
          />
        </span>
      ) : null}
    </div>
  );
}
