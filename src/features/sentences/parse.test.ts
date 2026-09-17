import { describe, expect, it } from 'vitest';
import { parseSentences, sentenceKey } from './parse.ts';
import { BORROWED_CHARS, MY_SENTENCES, MY_WORDS } from './corpus.ts';

describe('parseSentences', () => {
  it('đọc dạng ba cột ngăn bằng dấu sổ', () => {
    const { sentences } = parseSentences(
      '现在几点？ | Xiànzài jǐ diǎn? | Bây giờ mấy giờ?\n妈妈在打电话。 | Māma zài dǎ diànhuà. | Mẹ đang gọi điện thoại.',
    );
    expect(sentences).toEqual([
      { hanzi: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?', vi: 'Bây giờ mấy giờ?' },
      { hanzi: '妈妈在打电话。', pinyin: 'Māma zài dǎ diànhuà.', vi: 'Mẹ đang gọi điện thoại.' },
    ]);
  });

  it('bỏ số thứ tự và dấu đầu dòng mà mô hình hay tự thêm', () => {
    const { sentences } = parseSentences(
      '1. 我买东西。 | Wǒ mǎi dōngxi. | Tôi mua đồ.\n- 我回家。 | Wǒ huí jiā. | Tôi về nhà.',
    );
    expect(sentences.map((s) => s.hanzi)).toEqual(['我买东西。', '我回家。']);
  });

  it('đọc được bảng Markdown, bỏ dòng tiêu đề và dòng kẻ', () => {
    const { sentences } = parseSentences(
      [
        '| Tiếng Trung | Pinyin | Nghĩa |',
        '| --- | --- | --- |',
        '| 太热了。 | Tài rè le. | Nóng quá. |',
      ].join('\n'),
    );
    expect(sentences).toEqual([{ hanzi: '太热了。', pinyin: 'Tài rè le.', vi: 'Nóng quá.' }]);
  });

  it('nhận tab và gạch ngang làm dấu ngăn', () => {
    expect(parseSentences('你呢？\tNǐ ne?\tCòn bạn thì sao?').sentences).toHaveLength(1);
    expect(parseSentences('你呢？ — Nǐ ne? — Còn bạn thì sao?').sentences).toHaveLength(1);
  });

  it('xếp đúng cột khi dòng chỉ có hai phần', () => {
    // Phần thứ hai không mang chữ cái riêng của tiếng Việt thì đó là pinyin.
    expect(parseSentences('我写字。 | Wǒ xiě zì.').sentences[0]).toEqual({
      hanzi: '我写字。',
      pinyin: 'Wǒ xiě zì.',
      vi: '',
    });
    expect(parseSentences('我写字。 | Tôi viết chữ.').sentences[0]).toEqual({
      hanzi: '我写字。',
      pinyin: '',
      vi: 'Tôi viết chữ.',
    });
  });

  it('ghi lại dòng chỉ có chữ Hán thay vì lặng lẽ bỏ', () => {
    const { sentences, skipped } = parseSentences('我回家。\n我买东西。 | Wǒ mǎi dōngxi. | Tôi mua đồ.');
    expect(sentences).toHaveLength(1);
    expect(skipped).toEqual(['我回家。']);
  });

  it('bỏ dòng trùng ngay trong một lần dán', () => {
    const { sentences } = parseSentences(
      '太热了。 | Tài rè le. | Nóng quá.\n太热了 | Tài rè le | Nóng quá',
    );
    expect(sentences).toHaveLength(1);
  });

  it('bỏ qua dòng không có chữ Hán', () => {
    const { sentences, skipped } = parseSentences('Đây là 30 câu cho bạn:\n\nChúc học tốt!');
    expect(sentences).toEqual([]);
    expect(skipped).toEqual([]);
  });
});

describe('sentenceKey', () => {
  it('coi hai câu chỉ khác dấu câu là một', () => {
    expect(sentenceKey('现在几点？')).toBe(sentenceKey('现在几点'));
    expect(sentenceKey('昨天太热了，我在家睡觉。')).toBe(sentenceKey('昨天太热了 我在家睡觉'));
  });
});

describe('bộ câu có sẵn', () => {
  it('không có câu nào trùng nhau', () => {
    const keys = MY_SENTENCES.map((sentence) => sentenceKey(sentence.hanzi));
    expect(new Set(keys).size).toBe(MY_SENTENCES.length);
  });

  it('không có từ nào trùng nhau', () => {
    const hanzi = MY_WORDS.map((word) => word.hanzi);
    expect(new Set(hanzi).size).toBe(MY_WORDS.length);
  });

  it('mọi câu đều có đủ pinyin và nghĩa', () => {
    for (const sentence of MY_SENTENCES) {
      expect(sentence.pinyin.length, sentence.hanzi).toBeGreaterThan(0);
      expect(sentence.vi.length, sentence.hanzi).toBeGreaterThan(0);
    }
  });

  /*
    Lời hứa của cả trang: câu chỉ ghép từ những từ người học đã học. Kiểm bằng
    mắt 90 câu thì sớm muộn cũng lọt một chữ lạ, nên để test canh — thêm câu mới
    mà lỡ dùng chữ chưa học là hỏng ngay ở đây.
  */
  it('không câu nào dùng chữ Hán ngoài vốn từ', () => {
    const known = new Set<string>();
    for (const word of MY_WORDS) for (const char of word.hanzi) known.add(char);
    for (const item of BORROWED_CHARS) known.add(item.char);

    const han = /[一-鿿]/u;
    for (const sentence of MY_SENTENCES) {
      for (const char of sentence.hanzi) {
        if (!han.test(char)) continue;
        expect(known.has(char), `${sentence.hanzi} dùng chữ lạ: ${char}`).toBe(true);
      }
    }
  });
});
