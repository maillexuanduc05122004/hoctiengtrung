import { describe, expect, it } from 'vitest';
import { looksLikePinyin, MAX_WORD_ROWS, parseWordLines } from './parse-words.ts';

describe('parseWordLines', () => {
  it('đọc dòng đủ ba phần cách nhau bằng khoảng trắng', () => {
    expect(parseWordLines('我 wǒ tôi')).toEqual([{ simplified: '我', pinyin: 'wǒ', meaningVi: 'tôi' }]);
  });

  it('dòng thiếu chữ Hán vẫn đọc được pinyin và nghĩa', () => {
    expect(parseWordLines('wǒ tôi')).toEqual([{ pinyin: 'wǒ', meaningVi: 'tôi' }]);
  });

  it('pinyin nhiều âm tiết cách nhau khoảng trắng ghép thành một cột', () => {
    expect(parseWordLines('打电话 dǎ diànhuà gọi điện thoại')).toEqual([
      { simplified: '打电话', pinyin: 'dǎ diànhuà', meaningVi: 'gọi điện thoại' },
    ]);
  });

  it('đọc dạng ngăn bằng dấu sổ và tab', () => {
    expect(parseWordLines('学校|xuéxiào|trường học')).toEqual([
      { simplified: '学校', pinyin: 'xuéxiào', meaningVi: 'trường học' },
    ]);
    expect(parseWordLines('学校\txuéxiào\ttrường học\tschool')).toEqual([
      { simplified: '学校', pinyin: 'xuéxiào', meaningVi: 'trường học', meaningEn: 'school' },
    ]);
  });

  it('bỏ dòng trống, dòng tiêu đề và dòng kẻ của bảng', () => {
    const rows = parseWordLines(
      [
        'Chữ Hán | Pinyin | Nghĩa',
        '| --- | --- | --- |',
        '',
        'STT\tHán tự\tPhiên âm\tNghĩa',
        '我 wǒ tôi',
        '   ',
        '你 nǐ bạn',
      ].join('\n'),
    );
    expect(rows).toEqual([
      { simplified: '我', pinyin: 'wǒ', meaningVi: 'tôi' },
      { simplified: '你', pinyin: 'nǐ', meaningVi: 'bạn' },
    ]);
  });

  it('bỏ số thứ tự và dấu đầu dòng', () => {
    expect(parseWordLines('1. 我 wǒ tôi\n- 你 nǐ bạn\n2) 他 tā anh ấy')).toEqual([
      { simplified: '我', pinyin: 'wǒ', meaningVi: 'tôi' },
      { simplified: '你', pinyin: 'nǐ', meaningVi: 'bạn' },
      { simplified: '他', pinyin: 'tā', meaningVi: 'anh ấy' },
    ]);
  });

  it('nhận pinyin viết bằng số thanh và pinyin trong ngoặc', () => {
    expect(parseWordLines('好 hao3 tốt')).toEqual([
      { simplified: '好', pinyin: 'hao3', meaningVi: 'tốt' },
    ]);
    expect(parseWordLines('学校 (xuéxiào) trường học')).toEqual([
      { simplified: '学校', pinyin: 'xuéxiào', meaningVi: 'trường học' },
    ]);
  });

  it('chữ tiếng Việt không dấu trông giống pinyin vẫn thuộc phần nghĩa', () => {
    // "ma" là một âm tiết pinyin hợp lệ, nhưng đã có nghĩa đứng trước nên
    // không được nhảy sang cột pinyin.
    expect(parseWordLines('妈妈 māma mẹ ma')).toEqual([
      { simplified: '妈妈', pinyin: 'māma', meaningVi: 'mẹ ma' },
    ]);
    // Không có pinyin: "toi" không tách được thành âm tiết nên là nghĩa.
    expect(parseWordLines('我 toi')).toEqual([{ simplified: '我', meaningVi: 'toi' }]);
  });

  it('giữ dấu phẩy trong nghĩa', () => {
    expect(parseWordLines('请 qǐng mời, vui lòng')).toEqual([
      { simplified: '请', pinyin: 'qǐng', meaningVi: 'mời, vui lòng' },
    ]);
  });

  it('chỉ giữ lần đầu của dòng dán trùng', () => {
    expect(parseWordLines('我 wǒ tôi\n我 wo3 tôi\n我 wǒ tôi')).toHaveLength(1);
    // Cùng chữ Hán nhưng pinyin khác là hai từ đa âm, phải giữ cả hai.
    expect(parseWordLines('行 xíng đi\n行 háng hàng')).toHaveLength(2);
  });

  it('dòng chỉ có nghĩa cũng được giữ để máy chủ báo lỗi rõ ràng', () => {
    expect(parseWordLines('tôi')).toEqual([{ meaningVi: 'tôi' }]);
  });

  it('không vượt quá giới hạn của máy chủ', () => {
    const many = Array.from({ length: MAX_WORD_ROWS + 20 }, (_, i) => `字${i} zi${(i % 4) + 1} nghĩa`);
    expect(parseWordLines(many.join('\n'))).toHaveLength(MAX_WORD_ROWS);
  });
});

describe('looksLikePinyin', () => {
  it('nhận dạng có dấu, không dấu và số thanh', () => {
    expect(looksLikePinyin('xuéxiào')).toBe(true);
    expect(looksLikePinyin('xuexiao')).toBe(true);
    expect(looksLikePinyin('xue2xiao4')).toBe(true);
    expect(looksLikePinyin('nǚ')).toBe(true);
    expect(looksLikePinyin('nǎr')).toBe(true);
  });

  it('loại chữ tiếng Việt và cụm không tách được thành âm tiết', () => {
    expect(looksLikePinyin('tôi')).toBe(false);
    expect(looksLikePinyin('học')).toBe(false);
    expect(looksLikePinyin('trường')).toBe(false);
    expect(looksLikePinyin('toi')).toBe(false);
    expect(looksLikePinyin('')).toBe(false);
    expect(looksLikePinyin('3')).toBe(false);
  });
});
