/**
 * Kho câu và cách rút câu cho "Dịch câu" / "Luyện phát âm": câu lấy đúng từ
 * các bài nghe cố định, mỗi lượt ưu tiên câu chưa ra, hết câu mới thì quay lại
 * câu đã ra lâu nhất.
 */
import { describe, expect, it } from 'vitest';
import { PRACTICE_SENTENCES, hanziLength, lessonsInPool, type PracticeSentence } from './pool.ts';
import { filterPool, pickRound } from './round.ts';

function sentence(id: string, hanzi: string, lessonId = 'bai-01'): PracticeSentence {
  return {
    id,
    lessonId,
    lessonNumber: Number(lessonId.slice(4)),
    source: 'ghep',
    hanzi,
    pinyin: '',
    vi: 'nghĩa',
    newWords: [],
  };
}

describe('kho câu luyện', () => {
  it('có câu của mọi bài nghe cố định, mã không trùng, câu nào cũng có nghĩa và pinyin', () => {
    const ids = new Set(PRACTICE_SENTENCES.map((s) => s.id));
    expect(ids.size).toBe(PRACTICE_SENTENCES.length);
    expect(lessonsInPool(PRACTICE_SENTENCES).map((lesson) => lesson.id)).toEqual([
      'bai-01',
      'bai-02',
      'bai-03',
      'bai-04',
      'bai-05',
      'bai-06',
      'bai-07',
      'bai-08',
      'bai-09',
      'bai-10',
    ]);
    for (const s of PRACTICE_SENTENCES) {
      expect(s.vi, s.hanzi).not.toBe('');
      expect(s.pinyin, s.hanzi).not.toBe('');
    }
  });

  it('không lẫn từ mới đứng một mình vào kho câu', () => {
    // Từ mới ngắn nhất là một chữ; câu ngắn nhất trong các bài cũng có từ ba chữ.
    expect(Math.min(...PRACTICE_SENTENCES.map((s) => hanziLength(s.hanzi)))).toBeGreaterThanOrEqual(3);
  });

  it('ghi lại từ mới của bài có trong câu, theo thứ tự xuất hiện', () => {
    const found = PRACTICE_SENTENCES.find((s) => s.hanzi === '我平常一个星期写三篇日记。');
    expect(found?.newWords).toEqual(['平常', '篇']);
  });
});

describe('filterPool', () => {
  const pool = [
    sentence('a', '我很好。'),
    sentence('b', '这家店的面包又好吃又便宜，每天都有人排队。', 'bai-06'),
  ];

  it('lọc theo bài và theo độ dài', () => {
    expect(filterPool(pool, { lesson: 'bai-06', length: 'all' }).map((s) => s.id)).toEqual(['b']);
    expect(filterPool(pool, { lesson: 'all', length: 'short' }).map((s) => s.id)).toEqual(['a']);
    expect(filterPool(pool, { lesson: 'all', length: 'long' }).map((s) => s.id)).toEqual(['b']);
  });
});

describe('pickRound', () => {
  const pool = ['a', 'b', 'c', 'd', 'e'].map((id) => sentence(id, '我很好。'));

  it('ưu tiên câu chưa ra, rồi tới câu đã ra lâu nhất', () => {
    const round = pickRound(pool, 4, ['d', 'b', 'a'], () => 0);
    expect(round.slice(0, 2).map((s) => s.id).sort()).toEqual(['c', 'e']);
    expect(round.slice(2).map((s) => s.id)).toEqual(['d', 'b']);
  });

  it('kho ít hơn số câu một lượt thì lấy hết, không lặp câu', () => {
    expect(pickRound(pool, 20, []).map((s) => s.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
