import { describe, expect, it } from 'vitest';
import { studySourceLabel } from './study-source.ts';

describe('studySourceLabel', () => {
  it('nói rõ nguồn từ và các cấp đang lấy', () => {
    expect(
      studySourceLabel({ pool: 'due', levels: [1, 2], shown: 20, total: 20 }),
    ).toBe('Từ cần ôn · HSK 1, 2 · 20 từ');
  });

  it('nói ra phần bị cắt khi nguồn có nhiều hơn một phiên', () => {
    // Đây là con số người học không có cách nào khác để biết: lưu 63 từ mà mỗi
    // phiên chỉ gặp 20 thì màn hình phải nói ra, nếu không họ tưởng chỉ có 20.
    expect(
      studySourceLabel({ pool: 'starred', levels: [1], shown: 20, total: 63 }),
    ).toBe('Từ đã lưu · 20 trong 63 từ');
  });

  it('sổ tay không nhắc tới cấp vì nó không lọc theo cấp', () => {
    expect(studySourceLabel({ pool: 'starred', levels: [1, 2, 3], shown: 5, total: 5 })).toBe(
      'Từ đã lưu · 5 từ',
    );
  });

  it('học theo buổi thì tên buổi thay chỗ cho nguồn từ', () => {
    expect(
      studySourceLabel({
        pool: 'lesson',
        levels: [2],
        lessonLabel: 'HSK 2 · Buổi 40',
        shown: 10,
        total: 10,
      }),
    ).toBe('HSK 2 · Buổi 40 · 10 từ');
  });

  it('sắp cấp theo thứ tự tăng dần dù bên gọi truyền lộn xộn', () => {
    expect(studySourceLabel({ pool: 'new', levels: [3, 1], shown: 8, total: 8 })).toBe(
      'Từ mới · HSK 1, 3 · 8 từ',
    );
  });

  it('hàng đợi rỗng thì không bịa ra con số nào', () => {
    expect(studySourceLabel({ pool: 'due', levels: [1], shown: 0, total: 0 })).toBe(
      'Từ cần ôn · HSK 1',
    );
  });
});
