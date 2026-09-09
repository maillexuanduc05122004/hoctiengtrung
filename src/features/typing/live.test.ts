import { describe, expect, it } from 'vitest';
import { checkLive } from './live.ts';
import { makeChallenge } from './prompt.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

function word(partial: Partial<VocabularyWord> = {}): VocabularyWord {
  return {
    id: 'L1-0002',
    simplified: '朋友',
    traditional: '朋友',
    pinyin: 'péngyou',
    pinyinPlain: 'pengyou',
    hskLevel: 1,
    meanings: { vi: ['bạn bè'], en: ['friend'] },
    aliases: { vi: ['bạn'], en: [], pinyin: [] },
    examples: [],
    source: 'kiểm thử',
    datasetVersion: '1.0.0',
    translationStatus: 'machine',
    ...partial,
  };
}

/** Gộp các đoạn cùng trạng thái lại thành cặp [chuỗi đúng, chuỗi chệch] cho gọn. */
function split(check: ReturnType<typeof checkLive>): [string, string] {
  const ok = check.parts.find((part) => part.status === 'ok')?.text ?? '';
  const wrong = check.parts.find((part) => part.status === 'wrong')?.text ?? '';
  return [ok, wrong];
}

describe('checkLive', () => {
  it('chưa gõ gì thì không kết luận gì', () => {
    const challenge = makeChallenge(word(), 'vi-to-zh');
    expect(checkLive(challenge, '').status).toBe('empty');
    expect(checkLive(challenge, '   ').status).toBe('empty');
    expect(checkLive(challenge, '').parts).toEqual([]);
  });

  it('chữ Hán: gõ đúng tới đâu báo đúng tới đó', () => {
    const challenge = makeChallenge(word(), 'vi-to-zh');
    expect(checkLive(challenge, '朋').status).toBe('ok');
    expect(checkLive(challenge, '朋友').status).toBe('complete');
    expect(split(checkLive(challenge, '朋们'))).toEqual(['朋', '们']);
    expect(split(checkLive(challenge, '们'))).toEqual(['', '们']);
  });

  it('chữ Hán: sai ngay chữ đầu thì không có đoạn nào đúng', () => {
    const challenge = makeChallenge(word(), 'vi-to-zh');
    const check = checkLive(challenge, '友朋');
    expect(check.status).toBe('wrong');
    expect(check.okLength).toBe(0);
  });

  it('nhận cả cách gõ pinyin khi đề chấp nhận hai kiểu đáp án', () => {
    const challenge = makeChallenge(word(), 'vi-to-zh');
    expect(checkLive(challenge, 'peng').status).toBe('ok');
    expect(checkLive(challenge, 'péngyou').status).toBe('complete');
    expect(checkLive(challenge, 'pengyou').status).toBe('complete');
    expect(split(checkLive(challenge, 'pengx'))).toEqual(['peng', 'x']);
  });

  it('pinyin: gõ chữ Hán vào ô đòi pinyin là chệch ngay từ đầu', () => {
    const challenge = makeChallenge(word(), 'zh-to-pinyin');
    expect(checkLive(challenge, 'peng').status).toBe('ok');
    expect(checkLive(challenge, '朋').status).toBe('wrong');
    expect(checkLive(challenge, '朋').okLength).toBe(0);
  });

  it('tiếng Việt: thiếu dấu vẫn tính là đang đi đúng hướng', () => {
    const challenge = makeChallenge(word(), 'pinyin-to-meaning');
    expect(checkLive(challenge, 'ba').status).toBe('ok');
    expect(checkLive(challenge, 'bạn b').status).toBe('ok');
    // Bỏ dấu hết vẫn tính là gõ trọn; dấu tiếng Việt để nhịp chấm chính nhắc.
    expect(checkLive(challenge, 'ban be').status).toBe('complete');
    expect(checkLive(challenge, 'bạn bè').status).toBe('complete');
    expect(split(checkLive(challenge, 'bạn xe'))).toEqual(['bạn ', 'xe']);
  });

  it('tiếng Việt: đáp án phụ cũng được tính là gõ trọn', () => {
    const challenge = makeChallenge(word(), 'pinyin-to-meaning');
    expect(checkLive(challenge, 'bạn').status).toBe('complete');
  });

  it('tiếng Anh: mạo từ đầu câu không bị tính là chệch', () => {
    const challenge = makeChallenge(word({ meanings: { vi: [], en: ['the friend'] } }), 'pinyin-to-meaning');
    expect(checkLive(challenge, 'the fr').status).toBe('ok');
    expect(checkLive(challenge, 'the friend').status).toBe('complete');
    expect(checkLive(challenge, 'friend').status).toBe('complete');
    expect(split(checkLive(challenge, 'frog'))).toEqual(['fr', 'og']);
  });

  it('luôn ghép lại đúng bằng chuỗi người học đã gõ', () => {
    const challenge = makeChallenge(word(), 'vi-to-zh');
    const input = '朋友们';
    expect(checkLive(challenge, input).parts.map((part) => part.text).join('')).toBe(input);
  });
});
