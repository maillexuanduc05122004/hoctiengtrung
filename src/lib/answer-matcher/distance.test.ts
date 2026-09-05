import { describe, expect, it } from 'vitest';
import {
  alignSequences,
  damerauLevenshtein,
  damerauLevenshteinSeq,
  similarity,
  similaritySeq,
} from './distance.ts';

describe('damerauLevenshtein', () => {
  it('bằng 0 khi hai chuỗi giống nhau', () => {
    expect(damerauLevenshtein('', '')).toBe(0);
    expect(damerauLevenshtein('nihao', 'nihao')).toBe(0);
  });

  it('bằng độ dài chuỗi kia khi một chuỗi rỗng', () => {
    expect(damerauLevenshtein('', 'abcd')).toBe(4);
    expect(damerauLevenshtein('abcd', '')).toBe(4);
  });

  it('đếm chèn, xoá và thay thế mỗi thao tác là 1', () => {
    expect(damerauLevenshtein('mao', 'miao')).toBe(1);
    expect(damerauLevenshtein('miao', 'mao')).toBe(1);
    expect(damerauLevenshtein('mao', 'mai')).toBe(1);
    expect(damerauLevenshtein('kitten', 'sitting')).toBe(3);
  });

  it('tính đảo chỗ hai ký tự liền nhau là khoảng cách 1', () => {
    expect(damerauLevenshtein('ab', 'ba')).toBe(1);
    expect(damerauLevenshtein('beautiful', 'baeutiful')).toBe(1);
    expect(damerauLevenshtein('nihao', 'nihoa')).toBe(1);
  });

  it('dùng bản Damerau đầy đủ chứ không phải bản rút gọn OSA', () => {
    // OSA trả về 3 cho cặp này vì không cho phép chỉnh sửa xen giữa hai ký tự đảo.
    expect(damerauLevenshtein('ca', 'abc')).toBe(2);
  });

  it('so sánh theo điểm mã nên chữ Hán tính đúng từng chữ', () => {
    expect(damerauLevenshtein('你好', '你好')).toBe(0);
    expect(damerauLevenshtein('对不起', '对不去')).toBe(1);
  });

  it('làm việc trên dãy phần tử bất kỳ, không chỉ chuỗi', () => {
    expect(damerauLevenshteinSeq(['ni', 'hao'], ['ni', 'hao'])).toBe(0);
    expect(damerauLevenshteinSeq(['ni', 'hao'], ['hao', 'ni'])).toBe(1);
    expect(damerauLevenshteinSeq(['ni', 'hao'], ['ni', 'hen', 'hao'])).toBe(1);
  });
});

/**
 * Tham chiếu độc lập: tìm kiếm theo chiều rộng trên mọi phép biến đổi, chậm nhưng
 * chắc chắn đúng. Dùng để đối chiếu công thức quy hoạch động vốn dễ sai ở nhánh
 * hoán vị mà các ví dụ lẻ khó lộ ra.
 */
function bruteForceDistance(a: string, b: string, alphabet: string, maxDist: number): number {
  if (a === b) return 0;
  let frontier = new Set<string>([a]);
  const seen = new Set<string>([a]);
  for (let dist = 1; dist <= maxDist; dist++) {
    const next = new Set<string>();
    for (const word of frontier) {
      const variants: string[] = [];
      for (let i = 0; i < word.length; i++) variants.push(word.slice(0, i) + word.slice(i + 1));
      for (let i = 0; i <= word.length; i++) {
        for (const ch of alphabet) variants.push(word.slice(0, i) + ch + word.slice(i));
      }
      for (let i = 0; i < word.length; i++) {
        for (const ch of alphabet) variants.push(word.slice(0, i) + ch + word.slice(i + 1));
      }
      for (let i = 0; i + 1 < word.length; i++) {
        variants.push(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
      }
      for (const variant of variants) {
        if (variant === b) return dist;
        if (variant.length <= a.length + b.length + 2 && !seen.has(variant)) {
          seen.add(variant);
          next.add(variant);
        }
      }
    }
    frontier = next;
  }
  return -1;
}

function allWords(alphabet: string, maxLength: number): string[] {
  let level = [''];
  const out = [''];
  for (let n = 0; n < maxLength; n++) {
    const next: string[] = [];
    for (const word of level) for (const ch of alphabet) next.push(word + ch);
    out.push(...next);
    level = next;
  }
  return out;
}

describe('damerauLevenshtein đối chiếu với tham chiếu vét cạn', () => {
  it('khớp tham chiếu trên mọi cặp từ dài tối đa 3 của bảng chữ "abc"', () => {
    const words = allWords('abc', 3);
    const mismatches: string[] = [];
    for (const a of words) {
      for (const b of words) {
        const want = bruteForceDistance(a, b, 'abc', 4);
        if (want >= 0 && damerauLevenshtein(a, b) !== want) {
          mismatches.push(`"${a}" -> "${b}"`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('đối xứng: đổi chỗ hai chuỗi không đổi khoảng cách', () => {
    const words = allWords('ab', 4);
    for (const a of words) {
      for (const b of words) {
        expect(damerauLevenshtein(a, b)).toBe(damerauLevenshtein(b, a));
      }
    }
  });

  it('đếm hai lần đảo chỗ rời nhau là 2', () => {
    expect(damerauLevenshtein('abcd', 'badc')).toBe(2);
  });
});

describe('similarity', () => {
  it('bằng 1 khi giống hệt, kể cả hai chuỗi rỗng', () => {
    expect(similarity('', '')).toBe(1);
    expect(similarity('xin chao', 'xin chao')).toBe(1);
  });

  it('bằng 1 trừ khoảng cách chia độ dài lớn hơn', () => {
    expect(similarity('beautiful', 'baeutiful')).toBeCloseTo(1 - 1 / 9, 10);
    expect(similarity('abcd', '')).toBe(0);
    expect(similaritySeq(['a', 'b'], ['a', 'c'])).toBe(0.5);
  });
});

describe('alignSequences', () => {
  it('trả về toàn thao tác "equal" khi hai dãy trùng nhau', () => {
    const ops = alignSequences([...'hao'], [...'hao']);
    expect(ops.map((op) => op.kind)).toEqual(['equal', 'equal', 'equal']);
    expect(ops.map((op) => op.givenIndex)).toEqual([0, 1, 2]);
  });

  it('đánh dấu thay thế đúng vị trí', () => {
    const ops = alignSequences([...'hao'], [...'hau']);
    expect(ops.map((op) => op.kind)).toEqual(['equal', 'equal', 'substitute']);
  });

  it('phân biệt phần bỏ sót và phần nhập thừa', () => {
    expect(alignSequences([...'abc'], [...'ac']).map((op) => op.kind)).toEqual([
      'equal',
      'delete',
      'equal',
    ]);
    expect(alignSequences([...'ac'], [...'abc']).map((op) => op.kind)).toEqual([
      'equal',
      'insert',
      'equal',
    ]);
  });

  it('chỉ ra chỉ số -1 cho bên không có phần tử tương ứng', () => {
    const [, missing] = alignSequences([...'abc'], [...'ac']);
    expect(missing.kind).toBe('delete');
    expect(missing.givenIndex).toBe(-1);
    expect(missing.expectedIndex).toBe(1);
  });

  it('ghép cặp được cả dãy âm tiết', () => {
    const ops = alignSequences(['ni', 'hao'], ['ni', 'hen', 'hao']);
    expect(ops.map((op) => op.kind)).toEqual(['equal', 'insert', 'equal']);
  });
});
