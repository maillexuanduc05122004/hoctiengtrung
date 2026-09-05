import { describe, expect, it } from 'vitest';
import {
  applyTone,
  formatPinyin,
  formatPinyinPlain,
  normalizeUmlaut,
  numberedToToneMarks,
  parsePinyin,
  pinyinSearchKey,
  segmentPinyin,
  stripToneMarks,
  toAsciiPinyin,
  PINYIN_SYLLABLE_SET,
} from './index.ts';

/** Rút gọn: đọc chuỗi rồi ghi lại thành pinyin có dấu thanh. */
function round(input: string): string | null {
  const parsed = parsePinyin(input);
  return parsed ? formatPinyin(parsed) : null;
}

describe('parsePinyin — các cách viết đều quy về một dạng', () => {
  it('chấp nhận pinyin có dấu thanh, dạng số và viết liền', () => {
    expect(round('nǐ hǎo')).toBe('nǐ hǎo');
    expect(round('ni3 hao3')).toBe('nǐ hǎo');
    expect(round('nǐhǎo')).toBe('nǐ hǎo');
    expect(round('NI3 HAO3')).toBe('nǐ hǎo');
  });

  it('pinyin không dấu thanh giữ nguyên âm tiết nhưng không có thanh điệu', () => {
    const parsed = parsePinyin('ni hao');
    expect(parsed?.map((s) => s.base)).toEqual(['ni', 'hao']);
    expect(parsed?.map((s) => s.tone)).toEqual([null, null]);
  });

  it('tách đúng chuỗi viết liền không dấu', () => {
    expect(segmentPinyin('nihao')).toEqual(['ni', 'hao']);
    expect(segmentPinyin('zhongwen')).toEqual(['zhong', 'wen']);
    expect(segmentPinyin('xihuan')).toEqual(['xi', 'huan']);
    expect(segmentPinyin('laoshi')).toEqual(['lao', 'shi']);
  });

  it('không cắt nhầm "xian" thành "xi" + "an"', () => {
    expect(segmentPinyin('xian')).toEqual(['xian']);
    expect(round('xiān')).toBe('xiān');
  });

  it('gán đúng thanh điệu khi dấu nằm giữa âm tiết', () => {
    expect(round('xǐhuān')).toBe('xǐ huān');
    expect(round('yǒushíhou')).toBe('yǒu shí hou');
    expect(round('lǎoshī')).toBe('lǎo shī');
    expect(round('péngyou')).toBe('péng you');
  });
});

describe('ü, v và u: là một', () => {
  it('ba cách viết cho cùng kết quả', () => {
    expect(round('lǜ')).toBe('lǜ');
    expect(round('lv4')).toBe('lǜ');
    expect(round('lu:4')).toBe('lǜ');
    expect(round('lü4')).toBe('lǜ');
  });

  it('normalizeUmlaut đổi v và u: thành ü', () => {
    expect(normalizeUmlaut('lv')).toBe('lü');
    expect(normalizeUmlaut('lu:')).toBe('lü');
    expect(normalizeUmlaut('nu:e')).toBe('nüe');
  });

  it('nữ và lục đọc đúng', () => {
    expect(numberedToToneMarks('nu:3 er2')).toBe('nǚ ér');
    expect(numberedToToneMarks('lu:4 se4')).toBe('lǜ sè');
  });
});

describe('thanh nhẹ và nhi hoá', () => {
  it('thanh 5 không mang dấu', () => {
    expect(numberedToToneMarks('ba4 ba5')).toBe('bà ba');
    expect(numberedToToneMarks('zhuo1 zi5')).toBe('zhuō zi');
    expect(numberedToToneMarks('xue2 sheng5')).toBe('xué sheng');
  });

  it('đuôi nhi hoá dính vào âm tiết trước', () => {
    expect(numberedToToneMarks('you3 dian3 r5')).toBe('yǒu diǎnr');
    expect(round('diǎnr')).toBe('diǎnr');
    const parsed = parsePinyin('dian3 r5');
    expect(parsed).toHaveLength(1);
    expect(parsed?.[0].erhua).toBe(true);
  });
});

describe('chuẩn hoá để tìm kiếm', () => {
  it('bỏ dấu thanh nhưng giữ ü', () => {
    expect(stripToneMarks('nǐ hǎo')).toBe('ni hao');
    expect(stripToneMarks('lǜ')).toBe('lü');
  });

  it('toAsciiPinyin đưa về ASCII hoàn toàn', () => {
    expect(toAsciiPinyin('lǜ')).toBe('lu');
    expect(toAsciiPinyin('nǚ ér')).toBe('nu er');
  });

  it('pinyinSearchKey bỏ cả khoảng trắng', () => {
    expect(pinyinSearchKey('nǐ hǎo')).toBe('nihao');
    expect(pinyinSearchKey('yǒushíhou')).toBe('youshihou');
    expect(pinyinSearchKey('Lǜ')).toBe('lu');
  });
});

describe('trường hợp biên', () => {
  it('chuỗi rỗng trả về mảng rỗng', () => {
    expect(parsePinyin('')).toEqual([]);
    expect(parsePinyin('   ')).toEqual([]);
    expect(segmentPinyin('')).toEqual([]);
  });

  it('chuỗi không phải pinyin trả về null', () => {
    expect(parsePinyin('xyzq')).toBeNull();
    expect(segmentPinyin('qqq')).toBeNull();
  });

  it('bỏ qua dấu câu', () => {
    expect(round('nǐ hǎo!')).toBe('nǐ hǎo');
    expect(round('nǐ, hǎo.')).toBe('nǐ hǎo');
  });

  it('formatPinyinPlain bỏ dấu và giữ khoảng trắng', () => {
    const parsed = parsePinyin('nǐ hǎo');
    expect(parsed && formatPinyinPlain(parsed)).toBe('ni hao');
  });

  it('applyTone đặt dấu đúng vị trí theo quy tắc chính tả', () => {
    expect(applyTone('hao', 3)).toBe('hǎo');
    expect(applyTone('jiu', 4)).toBe('jiù');
    expect(applyTone('gui', 1)).toBe('guī');
    expect(applyTone('lüe', 4)).toBe('lüè');
    expect(applyTone('ba', 5)).toBe('ba');
    expect(applyTone('ba', null)).toBe('ba');
  });
});

describe('kho âm tiết', () => {
  it('có đủ những âm tiết dễ bị bỏ sót', () => {
    for (const syllable of ['nin', 'shei', 'shui', 'lu:', 'lu:e', 'xue', 'yue', 'jue', 'que', 'er', 'r']) {
      expect(PINYIN_SYLLABLE_SET.has(syllable)).toBe(true);
    }
  });

  it('không chứa chuỗi không phải âm tiết Hán ngữ', () => {
    for (const junk of ['xx', 'coser', 'call', 'ok', 'bp']) {
      expect(PINYIN_SYLLABLE_SET.has(junk)).toBe(false);
    }
  });
});
