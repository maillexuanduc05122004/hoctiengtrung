/**
 * Khoảng cách Damerau-Levenshtein đầy đủ (thuật toán Lowrance-Wagner): ngoài
 * chèn, xoá, thay thế thì việc đảo chỗ hai phần tử liền nhau chỉ tính là 1.
 * Bản đầy đủ được chọn thay cho bản rút gọn OSA vì OSA đếm sai khi giữa hai phần
 * tử bị đảo còn có thao tác khác, ví dụ "ca" và "abc".
 */
export function damerauLevenshteinSeq<T>(a: readonly T[], b: readonly T[]): number {
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Ma trận có thêm một hàng và một cột "vô cực" ở đầu để công thức hoán vị
  // luôn đọc được ô hợp lệ, nên mọi chỉ số bị đẩy thêm 1.
  const far = aLen + bLen;
  const d: number[][] = Array.from({ length: aLen + 2 }, () => new Array<number>(bLen + 2).fill(far));
  for (let i = 0; i <= aLen; i++) d[i + 1][1] = i;
  for (let j = 0; j <= bLen; j++) d[1][j + 1] = j;

  const lastRowOf = new Map<T, number>();
  for (let i = 1; i <= aLen; i++) {
    let lastMatchCol = 0;
    for (let j = 1; j <= bLen; j++) {
      const k = lastRowOf.get(b[j - 1]) ?? 0;
      const l = lastMatchCol;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      if (cost === 0) lastMatchCol = j;
      d[i + 1][j + 1] = Math.min(
        d[i][j] + cost,
        d[i + 1][j] + 1,
        d[i][j + 1] + 1,
        d[k][l] + (i - k - 1) + 1 + (j - l - 1),
      );
    }
    lastRowOf.set(a[i - 1], i);
  }
  return d[aLen + 1][bLen + 1];
}

/** Khoảng cách Damerau-Levenshtein giữa hai chuỗi, tính theo điểm mã Unicode. */
export function damerauLevenshtein(a: string, b: string): number {
  return damerauLevenshteinSeq([...a], [...b]);
}

/** Độ tương đồng 0..1 của hai dãy: 1 trừ khoảng cách chia cho độ dài lớn hơn. */
export function similaritySeq<T>(a: readonly T[], b: readonly T[]): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - damerauLevenshteinSeq(a, b) / longest;
}

/** Độ tương đồng 0..1 của hai chuỗi. */
export function similarity(a: string, b: string): number {
  return similaritySeq([...a], [...b]);
}

export type AlignOpKind = 'equal' | 'substitute' | 'delete' | 'insert';

export interface AlignOp {
  kind: AlignOpKind;
  /** Vị trí trong dãy đáp án, `-1` khi người học nhập thừa. */
  expectedIndex: number;
  /** Vị trí trong dãy người học nhập, `-1` khi người học bỏ sót. */
  givenIndex: number;
}

/**
 * Ghép cặp hai dãy theo đường biên tập ngắn nhất (Levenshtein, không xét hoán vị
 * để đường đi luôn dựng lại được) và trả về danh sách thao tác theo thứ tự đọc.
 */
export function alignSequences<T>(expected: readonly T[], given: readonly T[]): AlignOp[] {
  const m = expected.length;
  const n = given.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = expected[i - 1] === given[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j - 1] + cost, d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }

  const ops: AlignOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const cost = i > 0 && j > 0 && expected[i - 1] === given[j - 1] ? 0 : 1;
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + cost) {
      ops.push({
        kind: cost === 0 ? 'equal' : 'substitute',
        expectedIndex: i - 1,
        givenIndex: j - 1,
      });
      i -= 1;
      j -= 1;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ kind: 'delete', expectedIndex: i - 1, givenIndex: -1 });
      i -= 1;
    } else {
      ops.push({ kind: 'insert', expectedIndex: -1, givenIndex: j - 1 });
      j -= 1;
    }
  }
  return ops.reverse();
}
