/**
 * Mã của mọi từ đang nằm trong sổ tay.
 *
 * Dùng cho các danh sách chỉ cần biết "từ này đã lưu chưa" — kết quả tra từ, hộp
 * trượt giữa giờ học, lịch sử tra. Đọc bằng liveQuery nên lưu một từ ở màn hình
 * này thì mọi danh sách đang mở đều đổi theo, không cần ai báo cho ai.
 */
import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getStarredCards, toggleStar } from '../../db/index.ts';

const EMPTY: ReadonlySet<string> = new Set<string>();

export interface SavedIdsState {
  ids: ReadonlySet<string>;
  loading: boolean;
  /** Bật tắt việc lưu một từ, trả về trạng thái sau khi đổi. */
  toggle: (wordId: string) => Promise<boolean>;
}

export function useSavedIds(): SavedIdsState {
  const ids = useLiveQuery(async () => {
    const cards = await getStarredCards();
    return new Set(cards.map((card) => card.wordId));
  }, []);

  const toggle = useCallback(async (wordId: string): Promise<boolean> => {
    return toggleStar(wordId);
  }, []);

  return { ids: ids ?? EMPTY, loading: ids === undefined, toggle };
}
