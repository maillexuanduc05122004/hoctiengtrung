import { describe, expect, it } from 'vitest';
import {
  englishForms,
  hanziChars,
  isBlankAnswer,
  normalizeBasic,
  normalizeEn,
  normalizeHanzi,
  normalizePinyin,
  normalizeVi,
  normalizeViPlain,
  pinyinFallbackKey,
  stripVietnameseDiacritics,
  tonesEqual,
} from './normalize.ts';

describe('normalizeBasic', () => {
  it('thường hoá và gộp khoảng trắng thừa', () => {
    expect(normalizeBasic('  Xin   CHÀO  ')).toBe('xin chào');
  });

  it('bỏ dấu câu, kể cả dấu câu tiếng Trung', () => {
    expect(normalizeBasic('Hello, world!')).toBe('hello world');
    expect(normalizeBasic('你好，世界。')).toBe('你好 世界');
  });

  it('xoá hẳn dấu nháy để "it\'s" và "its" cùng dạng', () => {
    expect(normalizeBasic("it's")).toBe('its');
    expect(normalizeBasic('it’s')).toBe('its');
  });

  it('giữ nguyên chữ số của pinyin dạng số', () => {
    expect(normalizeBasic('Ni3 Hao3')).toBe('ni3 hao3');
  });
});

describe('isBlankAnswer', () => {
  it('nhận ra chuỗi rỗng, chuỗi khoảng trắng và chuỗi chỉ có dấu câu', () => {
    expect(isBlankAnswer('')).toBe(true);
    expect(isBlankAnswer('   ')).toBe(true);
    expect(isBlankAnswer('???')).toBe(true);
    expect(isBlankAnswer('a')).toBe(false);
  });
});

describe('stripVietnameseDiacritics', () => {
  it('bỏ dấu thanh', () => {
    expect(stripVietnameseDiacritics('xin chào')).toBe('xin chao');
    expect(stripVietnameseDiacritics('má mà mả mã mạ')).toBe('ma ma ma ma ma');
  });

  it('bỏ dấu mũ và dấu móc', () => {
    expect(stripVietnameseDiacritics('cơm')).toBe('com');
    expect(stripVietnameseDiacritics('người')).toBe('nguoi');
    expect(stripVietnameseDiacritics('tiếng Việt')).toBe('tieng Viet');
  });

  it('đổi đ thành d, giữ nguyên hoa thường', () => {
    expect(stripVietnameseDiacritics('đi đâu đấy')).toBe('di dau day');
    expect(stripVietnameseDiacritics('Đường')).toBe('Duong');
  });

  it('không đụng tới chữ không dấu', () => {
    expect(stripVietnameseDiacritics('ban')).toBe('ban');
  });
});

describe('normalizeVi', () => {
  it('giữ dấu nhưng bỏ hoa thường và dấu câu', () => {
    expect(normalizeVi('Cảm ơn!')).toBe('cảm ơn');
  });

  it('normalizeViPlain vừa chuẩn hoá vừa bỏ dấu', () => {
    expect(normalizeViPlain('Cảm ơn!')).toBe('cam on');
  });
});

describe('normalizeEn', () => {
  it('bỏ mạo từ ở đầu', () => {
    expect(normalizeEn('the book')).toBe('book');
    expect(normalizeEn('a book')).toBe('book');
    expect(normalizeEn('an apple')).toBe('apple');
  });

  it('bỏ "to" ở đầu động từ nguyên thể', () => {
    expect(normalizeEn('to love')).toBe('love');
    expect(normalizeEn('love')).toBe('love');
  });

  it('không cắt mất nội dung khi đáp án chính là mạo từ', () => {
    expect(normalizeEn('the')).toBe('the');
    expect(normalizeEn('to')).toBe('to');
  });

  it('không cắt mạo từ nằm giữa câu', () => {
    expect(normalizeEn('read the book')).toBe('read the book');
  });
});

describe('englishForms', () => {
  it('tách chuỗi nhiều nghĩa thành từng vế, phần tử đầu là cả chuỗi', () => {
    const forms = englishForms('to love; to like');
    expect(forms[0]).toBe('love to like');
    expect(forms).toContain('love');
    expect(forms).toContain('like');
  });

  it('chỉ có một dạng khi đáp án chỉ có một nghĩa', () => {
    expect(englishForms('good')).toEqual(['good']);
  });
});

describe('normalizeHanzi', () => {
  it('bỏ khoảng trắng và dấu câu, giữ nguyên từng chữ', () => {
    expect(normalizeHanzi(' 你 好 ！')).toBe('你好');
    expect(hanziChars('对不起')).toEqual(['对', '不', '起']);
  });
});

describe('normalizePinyin', () => {
  it('đưa mọi cách viết về cùng một dãy âm tiết', () => {
    const withMarks = normalizePinyin('nǐ hǎo');
    const numbered = normalizePinyin('ni3 hao3');
    const joined = normalizePinyin('nǐhǎo');
    expect(withMarks?.bases).toEqual(['ni', 'hao']);
    expect(numbered?.bases).toEqual(['ni', 'hao']);
    expect(joined?.bases).toEqual(['ni', 'hao']);
    expect(numbered?.display).toEqual(['nǐ', 'hǎo']);
  });

  it('coi ü, v và u: là một', () => {
    const a = normalizePinyin('lǜ');
    const b = normalizePinyin('lv4');
    const c = normalizePinyin('lu:4');
    expect(a?.display).toEqual(b?.display);
    expect(a?.display).toEqual(c?.display);
    expect(a?.bases).toEqual(['lü']);
    expect(b?.bases).toEqual(['lü']);
    expect(c?.bases).toEqual(['lü']);
  });

  it('không lẫn "ü" với "u" vì đó là hai âm tiết khác nhau', () => {
    expect(normalizePinyin('lǜ')?.bases).not.toEqual(normalizePinyin('lù')?.bases);
    expect(normalizePinyin('nǚ')?.plainKey).not.toBe(normalizePinyin('nǔ')?.plainKey);
  });

  it('cho biết người học có nhập dấu thanh hay không', () => {
    expect(normalizePinyin('ni hao')?.hasTone).toBe(false);
    expect(normalizePinyin('nǐ hao')?.hasTone).toBe(true);
    expect(normalizePinyin('ni3hao3')?.hasTone).toBe(true);
  });

  it('dựng khoá không thanh viết liền cho so khớp mờ', () => {
    expect(normalizePinyin('nǐ hǎo')?.plainKey).toBe('nihao');
    expect(normalizePinyin('lǜ')?.plainKey).toBe('lü');
  });

  it('trả về null khi chuỗi không tách được thành âm tiết hợp lệ', () => {
    expect(normalizePinyin('zzz')).toBeNull();
    expect(normalizePinyin('')).toBeNull();
  });
});

describe('pinyinFallbackKey', () => {
  it('chỉ giữ chữ cái ASCII, bỏ dấu thanh và số', () => {
    expect(pinyinFallbackKey('nǐ hǎo')).toBe('nihao');
    expect(pinyinFallbackKey('ni3 hao3')).toBe('nihao');
  });
});

describe('tonesEqual', () => {
  it('coi thanh nhẹ ghi bằng 5 và không ghi gì là một', () => {
    expect(tonesEqual(5, null)).toBe(true);
    expect(tonesEqual(null, 5)).toBe(true);
    expect(tonesEqual(3, 3)).toBe(true);
    expect(tonesEqual(3, 4)).toBe(false);
    expect(tonesEqual(3, null)).toBe(false);
  });
});
