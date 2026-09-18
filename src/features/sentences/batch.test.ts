import { describe, expect, it } from 'vitest';
import { drawBatch, matchesQuery, shuffle } from './batch.ts';
import { MY_SENTENCES } from './corpus.ts';

/** Bộ sinh số giả, đủ để kết quả lặp lại được giữa hai lần chạy. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

describe('shuffle', () => {
  it('giữ nguyên mảng gốc và đủ phần tử', () => {
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items, seeded(1));
    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('drawBatch', () => {
  const pool = MY_SENTENCES.map((sentence) => sentence.id);

  it('rút đúng số lượng', () => {
    expect(drawBatch(pool, 20, new Set(), seeded(7)).size).toBe(20);
  });

  it('bộ mới không trùng câu nào với bộ cũ khi kho còn đủ', () => {
    const first = drawBatch(pool, 20, new Set(), seeded(1));
    const second = drawBatch(pool, 20, first, seeded(2));
    for (const id of second) expect(first.has(id)).toBe(false);
  });

  it('lấy thêm từ bộ cũ khi phần chưa hiện không đủ', () => {
    const small = pool.slice(0, 25);
    const first = drawBatch(small, 20, new Set(), seeded(3));
    const second = drawBatch(small, 20, first, seeded(4));
    expect(second.size).toBe(20);
    // Năm câu chưa hiện phải có mặt hết, phần còn lại mới lấy từ bộ cũ.
    const unseen = small.filter((id) => !first.has(id));
    for (const id of unseen) expect(second.has(id)).toBe(true);
  });

  it('không bao giờ vượt quá cỡ kho', () => {
    expect(drawBatch(pool.slice(0, 5), 20, new Set(), seeded(5)).size).toBe(5);
  });
});

describe('matchesQuery', () => {
  const sentence = { hanzi: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?', vi: 'Bây giờ mấy giờ?' };

  it('ô trống thì khớp tất cả', () => {
    expect(matchesQuery(sentence, '')).toBe(true);
    expect(matchesQuery(sentence, '   ')).toBe(true);
  });

  it('khớp chữ Hán', () => {
    expect(matchesQuery(sentence, '现在')).toBe(true);
    expect(matchesQuery(sentence, '妈妈')).toBe(false);
  });

  it('khớp pinyin có hoặc không dấu', () => {
    expect(matchesQuery(sentence, 'xiànzài')).toBe(true);
    expect(matchesQuery(sentence, 'xianzai')).toBe(true);
    expect(matchesQuery(sentence, 'JI DIAN')).toBe(true);
  });

  it('khớp tiếng Việt có hoặc không dấu', () => {
    expect(matchesQuery(sentence, 'mấy giờ')).toBe(true);
    expect(matchesQuery(sentence, 'may gio')).toBe(true);
  });
});
