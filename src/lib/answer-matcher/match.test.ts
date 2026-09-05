import { describe, expect, it } from 'vitest';
import type { MatchOptions, MatchResult } from './match.ts';
import { matchAnswer } from './match.ts';

/** Gộp các phần diff thành chuỗi "text:status" cho dễ đọc trong kỳ vọng. */
function diffShape(result: MatchResult): string[] {
  return result.diff.map((part) => `${part.text}:${part.status}`);
}

describe('matchAnswer - pinyin đúng', () => {
  it('chấp nhận pinyin có dấu thanh', () => {
    const result = matchAnswer('nǐ hǎo', { kind: 'pinyin', expected: ['nǐ hǎo'] });
    expect(result.verdict).toBe('correct');
    expect(result.reason).toBe('exact');
    expect(result.similarity).toBe(1);
    expect(result.matchedAnswer).toBe('nǐ hǎo');
    expect(result.explanation).toBe('Đúng rồi.');
  });

  it('chấp nhận pinyin dạng số', () => {
    expect(matchAnswer('ni3 hao3', { kind: 'pinyin', expected: ['nǐ hǎo'] })).toMatchObject({
      verdict: 'correct',
      reason: 'exact',
    });
  });

  it('chấp nhận pinyin viết liền, cả dạng dấu lẫn dạng số', () => {
    expect(matchAnswer('nǐhǎo', { kind: 'pinyin', expected: ['nǐ hǎo'] }).verdict).toBe('correct');
    expect(matchAnswer('ni3hao3', { kind: 'pinyin', expected: ['nǐ hǎo'] }).verdict).toBe('correct');
  });

  it('coi ü, v và u: là như nhau', () => {
    const options: MatchOptions = { kind: 'pinyin', expected: ['lǜ'] };
    expect(matchAnswer('lǜ', options).verdict).toBe('correct');
    expect(matchAnswer('lü4', options).verdict).toBe('correct');
    expect(matchAnswer('lv4', options).verdict).toBe('correct');
    expect(matchAnswer('lu:4', options).verdict).toBe('correct');
  });

  it('không nhận nhầm "u" thành "ü" vì đó là hai từ khác nhau', () => {
    // 路 lù không phải 绿 lǜ, 怒 nù không phải 女 nǚ.
    expect(matchAnswer('lù', { kind: 'pinyin', expected: ['lǜ'] }).verdict).not.toBe('correct');
    expect(matchAnswer('lu4', { kind: 'pinyin', expected: ['lǜ'] }).verdict).not.toBe('correct');
    expect(matchAnswer('nu3', { kind: 'pinyin', expected: ['nǚ'] }).verdict).not.toBe('correct');
    // Chiều ngược lại cũng vậy: gõ "ü" cho từ viết bằng "u" là sai.
    expect(matchAnswer('lǜ', { kind: 'pinyin', expected: ['lù'] }).verdict).not.toBe('correct');
  });

  it('coi thanh nhẹ ghi bằng số 5 và không ghi gì là một', () => {
    const result = matchAnswer('ma1ma5', { kind: 'pinyin', expected: ['māma'] });
    expect(result.verdict).toBe('correct');
  });

  it('bỏ qua hoa thường và dấu câu thừa', () => {
    expect(matchAnswer('  Nǐ Hǎo!  ', { kind: 'pinyin', expected: ['nǐ hǎo'] }).verdict).toBe(
      'correct',
    );
  });
});

describe('matchAnswer - pinyin thiếu hoặc sai thanh điệu', () => {
  it('thiếu toàn bộ dấu thanh thì gần đúng với lý do tone-missing', () => {
    const result = matchAnswer('ni hao', { kind: 'pinyin', expected: ['nǐ hǎo'] });
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('tone-missing');
    expect(result.explanation).toBe('Đúng âm nhưng thiếu dấu thanh.');
    expect(diffShape(result)).toEqual(['ni:wrong', 'hao:wrong']);
  });

  it('viết liền không dấu thanh cũng là tone-missing', () => {
    expect(matchAnswer('nihao', { kind: 'pinyin', expected: ['nǐ hǎo'] })).toMatchObject({
      verdict: 'close',
      reason: 'tone-missing',
    });
  });

  it('chỉ thiếu dấu ở âm tiết mang thanh, âm tiết thanh nhẹ vẫn đúng', () => {
    const result = matchAnswer('mama', { kind: 'pinyin', expected: ['māma'] });
    expect(result.reason).toBe('tone-missing');
    expect(diffShape(result)).toEqual(['ma:wrong', 'ma:ok']);
  });

  it('sai thanh điệu thì chỉ đánh dấu đúng âm tiết sai', () => {
    const result = matchAnswer('nǐ hào', { kind: 'pinyin', expected: ['nǐ hǎo'] });
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('tone-wrong');
    expect(diffShape(result)).toEqual(['nǐ:ok', 'hào:wrong']);
    expect(result.explanation).toBe('Sai thanh điệu ở âm tiết thứ 2.');
  });

  it('sai thanh ở nhiều âm tiết thì liệt kê đủ vị trí', () => {
    const result = matchAnswer('ni2 hao4', { kind: 'pinyin', expected: ['nǐ hǎo'] });
    expect(result.reason).toBe('tone-wrong');
    expect(result.explanation).toBe('Sai thanh điệu ở các âm tiết thứ 1, 2.');
  });

  it('nhập dạng số nhưng sai thanh vẫn là tone-wrong chứ không phải tone-missing', () => {
    expect(matchAnswer('ni3 hao4', { kind: 'pinyin', expected: ['nǐ hǎo'] }).reason).toBe(
      'tone-wrong',
    );
  });
});

describe('matchAnswer - pinyin sai âm tiết', () => {
  it('sai một âm tiết trong chuỗi dài thì chấm mờ và chỉ ra âm tiết sai', () => {
    const result = matchAnswer('zhong gou', { kind: 'pinyin', expected: ['zhōng guó'] });
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('typo');
    expect(diffShape(result)).toEqual(['zhong:ok', 'gou:wrong']);
  });

  it('âm tiết ngắn khác nhau thì sai hẳn, không nới lỏng', () => {
    const result = matchAnswer('bō', { kind: 'pinyin', expected: ['bā'] });
    expect(result.verdict).toBe('wrong');
    expect(result.reason).toBe('no-match');
  });

  it('chuỗi không phải pinyin thì chấm mờ trên chữ cái và vẫn sai', () => {
    const result = matchAnswer('zzz', { kind: 'pinyin', expected: ['nǐ hǎo'] });
    expect(result.verdict).toBe('wrong');
    expect(result.explanation).toBe('Chưa đúng.');
  });
});

describe('matchAnswer - tiếng Việt', () => {
  it('trùng khớp cả dấu thì đúng', () => {
    const result = matchAnswer('xin chào', { kind: 'vi', expected: ['xin chào'] });
    expect(result.verdict).toBe('correct');
    expect(result.reason).toBe('exact');
  });

  it('bỏ qua hoa thường, dấu câu và dạng tổ hợp Unicode', () => {
    expect(matchAnswer('Xin Chào!', { kind: 'vi', expected: ['xin chào'] }).verdict).toBe('correct');
    // Cùng một chữ nhưng người học gõ ở dạng tổ hợp NFD.
    expect(matchAnswer('xin cha\u0300o', { kind: 'vi', expected: ['xin chào'] }).verdict).toBe(
      'correct',
    );
  });

  it('thiếu dấu tiếng Việt thì gần đúng', () => {
    const result = matchAnswer('xin chao', { kind: 'vi', expected: ['xin chào'] });
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('diacritics-missing');
    expect(result.explanation).toBe('Thiếu dấu tiếng Việt.');
    expect(diffShape(result)).toEqual(['xin ch:ok', 'a:wrong', 'o:ok']);
  });

  it('bỏ dấu đúng với đ, dấu mũ và dấu móc', () => {
    expect(matchAnswer('di duong', { kind: 'vi', expected: ['đi đường'] })).toMatchObject({
      verdict: 'close',
      reason: 'diacritics-missing',
    });
    expect(matchAnswer('nguoi ban', { kind: 'vi', expected: ['người bạn'] })).toMatchObject({
      verdict: 'close',
      reason: 'diacritics-missing',
    });
  });

  it('gõ nhầm đảo hai chữ cái trong cụm dài thì gần đúng với lý do typo', () => {
    const result = matchAnswer('nguoi bna', { kind: 'vi', expected: ['người bạn'] });
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('typo');
  });

  it('chọn đáp án gần nhất trong nhiều đáp án chính', () => {
    const result = matchAnswer('tam biet', {
      kind: 'vi',
      expected: ['xin chào', 'tạm biệt'],
    });
    expect(result.matchedAnswer).toBe('tạm biệt');
    expect(result.reason).toBe('diacritics-missing');
  });
});

describe('matchAnswer - tiếng Anh', () => {
  it('bỏ qua mạo từ ở đầu', () => {
    expect(matchAnswer('book', { kind: 'en', expected: ['the book'] }).verdict).toBe('correct');
    expect(matchAnswer('the book', { kind: 'en', expected: ['book'] }).verdict).toBe('correct');
    expect(matchAnswer('apple', { kind: 'en', expected: ['an apple'] }).verdict).toBe('correct');
  });

  it('coi "to" ở đầu động từ là tuỳ chọn', () => {
    expect(matchAnswer('love', { kind: 'en', expected: ['to love'] }).verdict).toBe('correct');
    expect(matchAnswer('to love', { kind: 'en', expected: ['love'] }).verdict).toBe('correct');
  });

  it('khớp một vế của chuỗi nhiều nghĩa ngăn bởi dấu chấm phẩy là đủ', () => {
    const result = matchAnswer('like', { kind: 'en', expected: ['to love; to like'] });
    expect(result.verdict).toBe('correct');
    expect(result.reason).toBe('variant');
  });

  it('người học ghi thêm nghĩa khác vẫn đúng nhưng lý do là variant, không phải exact', () => {
    const result = matchAnswer('book; notebook', { kind: 'en', expected: ['book'] });
    expect(result.verdict).toBe('correct');
    expect(result.reason).toBe('variant');
    // Gõ đúng nguyên chuỗi mới là exact.
    expect(matchAnswer('book', { kind: 'en', expected: ['book'] }).reason).toBe('exact');
  });

  it('gõ sai đảo chữ trong từ dài thì gần đúng với lý do typo', () => {
    const result = matchAnswer('baeutiful', { kind: 'en', expected: ['beautiful'] });
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('typo');
    expect(result.similarity).toBeCloseTo(1 - 1 / 9, 10);
    expect(result.explanation).toBe('Gần đúng, chỉ sai vài ký tự.');
  });

  it('từ ngắn không được nới lỏng dù chỉ sai một chữ cái', () => {
    expect(matchAnswer('bat', { kind: 'en', expected: ['bad'] })).toMatchObject({
      verdict: 'wrong',
      reason: 'no-match',
    });
  });

  it('sai một chữ cái ở từ bốn ký tự thì vẫn gần đúng', () => {
    expect(matchAnswer('boot', { kind: 'en', expected: ['book'] })).toMatchObject({
      verdict: 'close',
      reason: 'typo',
    });
  });
});

describe('matchAnswer - chữ Hán', () => {
  it('trùng khớp từng chữ thì đúng', () => {
    const result = matchAnswer('你好', { kind: 'hanzi', expected: ['你好'] });
    expect(result.verdict).toBe('correct');
    expect(diffShape(result)).toEqual(['你好:ok']);
  });

  it('sai một chữ trong từ ba chữ thì gần đúng', () => {
    const result = matchAnswer('对不去', { kind: 'hanzi', expected: ['对不起'] });
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('partial');
    expect(result.explanation).toBe('Sai 1 chữ.');
    expect(diffShape(result)).toEqual(['对不:ok', '去:wrong']);
  });

  it('sai một chữ trong từ hai chữ thì sai hẳn', () => {
    expect(matchAnswer('谢射', { kind: 'hanzi', expected: ['谢谢'] })).toMatchObject({
      verdict: 'wrong',
      reason: 'no-match',
    });
  });

  it('sai chữ duy nhất của từ một chữ thì sai hẳn', () => {
    expect(matchAnswer('女', { kind: 'hanzi', expected: ['好'] }).verdict).toBe('wrong');
  });

  it('sai hai chữ trong từ ba chữ thì sai hẳn', () => {
    expect(matchAnswer('对去去', { kind: 'hanzi', expected: ['对不起'] }).verdict).toBe('wrong');
  });

  it('cách viết thay thế nằm trong aliases vẫn được tính là đúng', () => {
    const result = matchAnswer('爸', { kind: 'hanzi', expected: ['爸爸'], aliases: ['爸'] });
    expect(result.verdict).toBe('correct');
    expect(result.reason).toBe('alias');
    expect(result.matchedAnswer).toBe('爸');
  });
});

describe('matchAnswer - đáp án phụ', () => {
  it('khớp aliases thì đúng và ghi rõ lý do alias', () => {
    const result = matchAnswer('chào bạn', {
      kind: 'vi',
      expected: ['xin chào'],
      aliases: ['chào bạn'],
    });
    expect(result.verdict).toBe('correct');
    expect(result.reason).toBe('alias');
    expect(result.matchedAnswer).toBe('chào bạn');
    expect(result.explanation).toBe('Đúng rồi, đây cũng là một đáp án được chấp nhận.');
  });

  it('đáp án chính vẫn được ưu tiên khi cả hai cùng đúng', () => {
    const result = matchAnswer('xin chào', {
      kind: 'vi',
      expected: ['xin chào'],
      aliases: ['xin chào'],
    });
    expect(result.reason).toBe('exact');
  });

  it('cách đọc khác của pinyin nằm trong aliases cũng được chấp nhận', () => {
    const result = matchAnswer('shuí', { kind: 'pinyin', expected: ['shéi'], aliases: ['shuí'] });
    expect(result.verdict).toBe('correct');
    expect(result.reason).toBe('alias');
  });
});

describe('matchAnswer - trường hợp biên', () => {
  it('chuỗi rỗng là sai với lý do empty và diff rỗng', () => {
    const result = matchAnswer('', { kind: 'vi', expected: ['xin chào'] });
    expect(result.verdict).toBe('wrong');
    expect(result.reason).toBe('empty');
    expect(result.diff).toEqual([]);
    expect(result.matchedAnswer).toBeNull();
    expect(result.similarity).toBe(0);
    expect(result.explanation).toBe('Bạn chưa nhập đáp án.');
  });

  it('chuỗi chỉ có khoảng trắng hoặc dấu câu cũng tính là rỗng', () => {
    expect(matchAnswer('   ', { kind: 'vi', expected: ['xin chào'] }).reason).toBe('empty');
    expect(matchAnswer('???', { kind: 'hanzi', expected: ['你好'] }).reason).toBe('empty');
  });

  it('không có đáp án nào thì trả về sai và matchedAnswer null', () => {
    const result = matchAnswer('gì đó', { kind: 'vi', expected: [] });
    expect(result.verdict).toBe('wrong');
    expect(result.reason).toBe('no-match');
    expect(result.matchedAnswer).toBeNull();
  });

  it('kết quả sai thì độ tương đồng phải nhỏ hơn 1, không được nói ngược nhau', () => {
    // Người học gõ chữ Hán trong bài pinyin: cả hai bên đều không còn chữ cái nào.
    const result = matchAnswer('你好', { kind: 'pinyin', expected: ['你好'] });
    expect(result.verdict).toBe('wrong');
    expect(result.similarity).toBe(0);

    const kinds: MatchOptions['kind'][] = ['hanzi', 'pinyin', 'vi', 'en'];
    for (const kind of kinds) {
      for (const input of ['a', 'zzz', 'ni hao', '你好', 'lǜ', '1']) {
        for (const answer of ['a', 'nǐ hǎo', '你好', 'to love; to like', 'lǜ', 'đi đường']) {
          const current = matchAnswer(input, { kind, expected: [answer] });
          if (current.verdict === 'wrong') expect(current.similarity).toBeLessThan(1);
        }
      }
    }
  });

  it('độ tương đồng luôn nằm trong khoảng 0 đến 1', () => {
    const cases: MatchResult[] = [
      matchAnswer('ni hao', { kind: 'pinyin', expected: ['nǐ hǎo'] }),
      matchAnswer('xin chao', { kind: 'vi', expected: ['xin chào'] }),
      matchAnswer('zzz', { kind: 'en', expected: ['beautiful'] }),
      matchAnswer('对不去', { kind: 'hanzi', expected: ['对不起'] }),
    ];
    for (const result of cases) {
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
    }
  });
});

describe('matchAnswer - gợi ý', () => {
  it('giữ nguyên usedHint và không hạ kết quả đúng', () => {
    const result = matchAnswer('你好', { kind: 'hanzi', expected: ['你好'], usedHint: true });
    expect(result.usedHint).toBe(true);
    expect(result.verdict).toBe('correct');
  });

  it('giữ nguyên usedHint ở kết quả gần đúng và sai', () => {
    const close = matchAnswer('ni hao', {
      kind: 'pinyin',
      expected: ['nǐ hǎo'],
      usedHint: true,
    });
    expect(close.usedHint).toBe(true);
    expect(close.verdict).toBe('close');

    const wrong = matchAnswer('bo', { kind: 'vi', expected: ['ba'], usedHint: true });
    expect(wrong.usedHint).toBe(true);
    expect(wrong.verdict).toBe('wrong');
  });

  it('mặc định usedHint là false khi không truyền', () => {
    expect(matchAnswer('你好', { kind: 'hanzi', expected: ['你好'] }).usedHint).toBe(false);
  });
});

describe('matchAnswer - từ ngắn không được nới lỏng', () => {
  it('tiếng Việt hai chữ cái khác nhau là sai hẳn', () => {
    const result = matchAnswer('bo', { kind: 'vi', expected: ['ba'] });
    expect(result.verdict).toBe('wrong');
    expect(result.reason).toBe('no-match');
  });

  it('ba chữ cái vẫn chưa được chấm mờ', () => {
    expect(matchAnswer('con', { kind: 'vi', expected: ['coi'] }).verdict).toBe('wrong');
  });
});
