import { describe, expect, it } from 'vitest';
import { relativeTime } from './relative-time.ts';

const NOW = new Date('2026-03-10T12:00:00').getTime();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
  it('gọi mốc dưới một phút là vừa xong', () => {
    expect(relativeTime(NOW, NOW)).toBe('vừa xong');
    expect(relativeTime(NOW - 59 * 1000, NOW)).toBe('vừa xong');
  });

  it('đếm phút, giờ và ngày', () => {
    expect(relativeTime(NOW - MINUTE, NOW)).toBe('1 phút trước');
    expect(relativeTime(NOW - 59 * MINUTE, NOW)).toBe('59 phút trước');
    expect(relativeTime(NOW - HOUR, NOW)).toBe('1 giờ trước');
    expect(relativeTime(NOW - 23 * HOUR, NOW)).toBe('23 giờ trước');
    expect(relativeTime(NOW - DAY, NOW)).toBe('hôm qua');
    expect(relativeTime(NOW - 5 * DAY, NOW)).toBe('5 ngày trước');
  });

  it('đổi sang tháng và năm khi đã đủ xa', () => {
    expect(relativeTime(NOW - 30 * DAY, NOW)).toBe('1 tháng trước');
    expect(relativeTime(NOW - 200 * DAY, NOW)).toBe('6 tháng trước');
    expect(relativeTime(NOW - 400 * DAY, NOW)).toBe('1 năm trước');
  });

  it('coi mốc ở tương lai là vừa xong vì đồng hồ máy có thể bị chỉnh lùi', () => {
    expect(relativeTime(NOW + 3 * HOUR, NOW)).toBe('vừa xong');
  });

  it('trả chuỗi rỗng khi mốc thời gian hỏng', () => {
    expect(relativeTime(Number.NaN, NOW)).toBe('');
    expect(relativeTime(NOW, Number.POSITIVE_INFINITY)).toBe('');
  });
});
