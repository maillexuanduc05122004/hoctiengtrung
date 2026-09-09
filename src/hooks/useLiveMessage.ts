/**
 * Một dòng thông báo ngắn cho các thao tác không đổi màn hình.
 *
 * Lưu một từ chỉ làm đổi hình ngôi sao. Người dùng bàn phím và trình đọc màn
 * hình không nghe được gì, còn người nhìn thì phải soi mới thấy. Hook này giữ
 * một câu ngắn để phần giao diện đọc lên qua vùng `aria-live`, rồi tự xoá đi
 * sau ít giây để câu cũ không đứng lại như một nhãn thường trực.
 *
 * `token` tăng sau mỗi lần báo nên nói lại đúng câu cũ vẫn được đọc lên lần
 * nữa: lưu rồi bỏ rồi lưu lại là ba việc khác nhau, dù hai câu giống hệt nhau.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** Khoảng hiện của một câu báo. Đủ để đọc hết, chưa đủ để thành nhãn cố định. */
export const LIVE_MESSAGE_MS = 2600;

export interface LiveMessageState {
  message: string;
  token: number;
  announce: (message: string) => void;
}

export function useLiveMessage(timeoutMs: number = LIVE_MESSAGE_MS): LiveMessageState {
  const [state, setState] = useState<{ message: string; token: number }>({
    message: '',
    token: 0,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const announce = useCallback(
    (message: string) => {
      clear();
      setState((previous) => ({ message, token: previous.token + 1 }));
      timer.current = setTimeout(() => {
        setState((previous) => ({ message: '', token: previous.token }));
      }, timeoutMs);
    },
    [clear, timeoutMs],
  );

  // Rời trang giữa lúc đang đếm giờ thì đừng gọi setState trên thành phần đã gỡ.
  useEffect(() => clear, [clear]);

  return { message: state.message, token: state.token, announce };
}
