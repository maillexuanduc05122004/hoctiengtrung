/**
 * Chọn câu để hiện: rút một bộ ngẫu nhiên, và lọc theo ô tìm kiếm.
 *
 * Không phụ thuộc React để kiểm thử được riêng — nhất là việc "đổi câu khác"
 * phải cho ra bộ KHÁC thật, chứ không phải xáo lại rồi ra gần y hệt.
 */
import { searchKey } from '../../lib/text/vietnamese.ts';
import type { MySentence } from './corpus.ts';

/** Fisher–Yates, trả về bản sao. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Rút `size` mã câu từ `pool`, tránh những mã trong `exclude` chừng nào còn đủ.
 *
 * Bấm "đổi câu khác" mà thấy lại nửa bộ cũ thì nút đó vô nghĩa, nên bộ mới lấy
 * hết từ phần chưa hiện trước; chỉ khi phần đó không đủ mới lấy thêm từ bộ cũ.
 * Với 90 câu và bộ 20 thì bộ mới luôn không trùng câu nào với bộ cũ.
 */
export function drawBatch(
  pool: readonly string[],
  size: number,
  exclude: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): Set<string> {
  const fresh = pool.filter((id) => !exclude.has(id));
  const stale = pool.filter((id) => exclude.has(id));
  const picked = shuffle(fresh, random).slice(0, size);
  if (picked.length < size) {
    picked.push(...shuffle(stale, random).slice(0, size - picked.length));
  }
  return new Set(picked);
}

/**
 * Một câu khớp ô tìm kiếm khi chữ Hán, pinyin hoặc nghĩa chứa chuỗi đang gõ.
 *
 * So không dấu ở cả hai phía: `searchKey` bỏ luôn dấu thanh của pinyin, nên gõ
 * "xianzai" vẫn ra 现在, và gõ "bay gio" vẫn ra "bây giờ".
 */
export function matchesQuery(
  item: Pick<MySentence, 'hanzi' | 'pinyin' | 'vi'>,
  query: string,
): boolean {
  const needle = searchKey(query);
  if (needle === '') return true;
  return (
    item.hanzi.includes(query.trim()) ||
    searchKey(item.pinyin).includes(needle) ||
    searchKey(item.vi).includes(needle)
  );
}
