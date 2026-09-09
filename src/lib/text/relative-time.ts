/**
 * Nhãn thời gian tương đối bằng tiếng Việt.
 *
 * Lịch sử tra từ chỉ cần biết "vừa xong" hay "hôm kia", không cần giờ phút chính
 * xác, nên chọn đơn vị lớn nhất mà vẫn còn nghĩa rồi làm tròn xuống.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Trả về nhãn cho mốc thời gian `at` so với `now`.
 *
 * Mốc nằm ở tương lai vẫn cho ra "vừa xong": đồng hồ máy có thể bị chỉnh lùi
 * giữa hai lần mở ứng dụng, và "trong 3 phút nữa" thì vô nghĩa với một việc đã
 * xảy ra rồi.
 */
export function relativeTime(at: number, now: number = Date.now()): string {
  if (!Number.isFinite(at) || !Number.isFinite(now)) return '';

  const diff = now - at;
  if (diff < MINUTE_MS) return 'vừa xong';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} phút trước`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} giờ trước`;

  const days = Math.floor(diff / DAY_MS);
  if (days === 1) return 'hôm qua';
  if (days < 30) return `${days} ngày trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
}
