import { db } from './database.ts';
import type { DailyStat, ReviewLogEntry, StudyMode } from '../types/study.ts';

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MODES: readonly StudyMode[] = ['flashcards', 'typing', 'listening', 'speaking'];

/**
 * Ngày học phải theo giờ địa phương: `toISOString` dùng UTC nên ở Việt Nam
 * mọi lượt học trước 7 giờ sáng sẽ bị tính sang ngày hôm trước.
 */
export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayToDate(day: string): Date {
  if (!DAY_PATTERN.test(day)) {
    throw new Error(`Ngày không hợp lệ: "${day}". Định dạng đúng là YYYY-MM-DD.`);
  }
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

/** Cộng hoặc trừ số ngày, để Date tự lo chuyện cuối tháng và năm nhuận. */
export function shiftDay(day: string, delta: number): string {
  const date = dayToDate(day);
  date.setDate(date.getDate() + delta);
  return dayKey(date.getTime());
}

function emptyStat(day: string): DailyStat {
  return { day, reviews: 0, correct: 0, newWords: 0, studyMs: 0 };
}

/**
 * Khoá của bảng thống kê phải luôn là một ngày đọc được. `dayKey` của một mốc
 * thời gian hỏng (NaN, Infinity, quá tầm của Date) sinh ra "NaN-NaN-NaN"; hàng đó
 * lọt vào cơ sở dữ liệu là hỏng vĩnh viễn nên thà quy về hôm nay còn hơn.
 */
function normalizeDay(day: string, at: number): string {
  if (DAY_PATTERN.test(day)) {
    return day;
  }
  const fromTimestamp = dayKey(at);
  return DAY_PATTERN.test(fromTimestamp) ? fromTimestamp : dayKey(Date.now());
}

/** Ghi một lượt trả lời và cập nhật thống kê ngày trong cùng một giao dịch. */
export async function recordReview(entry: Omit<ReviewLogEntry, 'id'>): Promise<void> {
  await db.transaction('rw', [db.reviews, db.dailyStats], async () => {
    // Đếm trước khi thêm: chưa có bản ghi nào nghĩa là hôm nay mới gặp từ này lần đầu.
    const seenBefore = await db.reviews.where('wordId').equals(entry.wordId).count();
    await db.reviews.add({ ...entry });

    const day = normalizeDay(entry.day, entry.at);
    const current = (await db.dailyStats.get(day)) ?? emptyStat(day);
    // Thời gian trả lời do đồng hồ trình duyệt cấp, chặn giá trị âm hoặc NaN.
    const elapsed = Number.isFinite(entry.elapsedMs) ? Math.max(0, entry.elapsedMs) : 0;
    await db.dailyStats.put({
      day,
      reviews: current.reviews + 1,
      correct: current.correct + (entry.verdict === 'correct' ? 1 : 0),
      newWords: current.newWords + (seenBefore === 0 ? 1 : 0),
      studyMs: current.studyMs + elapsed,
    });
  });
}

/** Thống kê n ngày gần nhất tính đến today, cũ trước mới sau, ngày không học vẫn có bản ghi 0. */
export async function getRecentDays(today: string, days: number): Promise<DailyStat[]> {
  if (days <= 0) {
    return [];
  }
  const keys: string[] = [];
  for (let back = days - 1; back >= 0; back -= 1) {
    keys.push(shiftDay(today, -back));
  }
  const rows = await db.dailyStats.bulkGet(keys);
  return keys.map((day, index) => rows[index] ?? emptyStat(day));
}

/** Số ngày học liên tiếp tính đến today; hôm nay chưa học thì tính từ hôm qua. */
export async function getStreak(today: string): Promise<number> {
  const rows = await db.dailyStats.where('day').belowOrEqual(today).toArray();
  const byDay = new Map(rows.map((stat) => [stat.day, stat]));
  const studied = (day: string): boolean => (byDay.get(day)?.reviews ?? 0) > 0;

  // Hôm nay chưa học thì chuỗi vẫn còn nguyên, chỉ bắt đầu đếm từ hôm qua.
  let cursor = studied(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (studied(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export async function getDailyStat(day: string): Promise<DailyStat | undefined> {
  return db.dailyStats.get(day);
}

/** Đếm số lượt ôn theo từng chế độ, dùng để biết người học yếu chế độ nào. */
export async function countByMode(
  wordId: string,
): Promise<Record<StudyMode, { total: number; wrong: number }>> {
  const result = {
    flashcards: { total: 0, wrong: 0 },
    typing: { total: 0, wrong: 0 },
    listening: { total: 0, wrong: 0 },
    speaking: { total: 0, wrong: 0 },
  } satisfies Record<StudyMode, { total: number; wrong: number }>;

  const entries = await db.reviews.where('wordId').equals(wordId).toArray();
  for (const entry of entries) {
    // Nhật ký cũ (bản PWA còn nằm trong cache) có thể chứa chế độ nay đã bỏ;
    // bỏ qua nó chứ đừng để cả trang chi tiết từ chết vì một hàng lạ.
    if (!MODES.includes(entry.mode)) {
      continue;
    }
    const bucket = result[entry.mode];
    bucket.total += 1;
    // `close` là gần đúng nên không tính là sai, tránh đánh giá oan một chế độ.
    if (entry.verdict === 'wrong') {
      bucket.wrong += 1;
    }
  }
  return result;
}
