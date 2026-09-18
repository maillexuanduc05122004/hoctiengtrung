/**
 * Lọc và chia nhóm vốn từ đã học — thuần, không phụ thuộc React, để kiểm thử
 * riêng được và để bảng từ chỉ lo việc vẽ.
 */
import type { UserWord } from '../../lib/api/types.ts';
import { pinyinSearchKey } from '../../lib/pinyin/index.ts';
import { searchKey } from '../../lib/text/vietnamese.ts';

/** Cỡ nhóm "mới nhất"; khớp với số từ AI được dặn ưu tiên khi viết câu. */
export const NEWEST_GROUP_SIZE = 10;

/**
 * Những từ học gần đây nhất, mới nhất đứng trước (tối đa `NEWEST_GROUP_SIZE`).
 *
 * Đây cũng là nhóm từ AI được dặn ưu tiên khi viết câu: người học vừa thêm từ
 * thì muốn nghe ngay câu có từ đó, ghép với vốn từ cũ. Cùng `learnedAt` (một
 * lô nhập cùng lúc) thì lấy id lớn hơn trước để thứ tự ổn định.
 */
export function newestWords(words: readonly UserWord[]): UserWord[] {
  return [...words]
    .sort((a, b) => b.learnedAt.localeCompare(a.learnedAt) || b.id - a.id)
    .slice(0, NEWEST_GROUP_SIZE);
}

export interface WordGroup {
  key: string;
  title: string;
  note?: string;
  words: UserWord[];
}

/**
 * Một từ khớp ô tìm khi chữ Hán (giản hoặc phồn), pinyin hoặc nghĩa chứa chuỗi
 * đang gõ. Pinyin so cả theo khoá không dấu bỏ khoảng trắng, nên "xianzai" lẫn
 * "xian zai" đều ra 现在; nghĩa so không dấu nên "mua" ra cả 买 lẫn 下雨.
 */
export function matchesWord(word: UserWord, query: string): boolean {
  const raw = query.trim();
  if (raw === '') return true;
  if (word.simplified.includes(raw)) return true;
  if (word.traditional && word.traditional.includes(raw)) return true;

  const needle = searchKey(raw);
  if (needle !== '') {
    if (searchKey(word.pinyin).includes(needle)) return true;
    if (searchKey(word.meaningVi).includes(needle)) return true;
    if (word.meaningEn && searchKey(word.meaningEn).includes(needle)) return true;
  }

  const pinyinNeedle = pinyinSearchKey(raw);
  return pinyinNeedle !== '' && pinyinSearchKey(word.pinyin).includes(pinyinNeedle);
}

/**
 * Chia vốn từ thành nhóm mới nhất (theo `learnedAt` giảm dần) rồi từng cấp HSK
 * tăng dần, bỏ nhóm rỗng. Một từ chỉ nằm ở một nhóm.
 */
export function groupWords(words: readonly UserWord[]): WordGroup[] {
  const newest = newestWords(words);
  const newestIds = new Set(newest.map((word) => word.id));

  const byLevel = new Map<number, UserWord[]>();
  for (const word of words) {
    if (newestIds.has(word.id)) continue;
    const bucket = byLevel.get(word.hskLevel);
    if (bucket) bucket.push(word);
    else byLevel.set(word.hskLevel, [word]);
  }

  const groups: WordGroup[] = [];
  if (newest.length > 0) {
    groups.push({
      key: 'newest',
      title: `${newest.length} từ mới nhất`,
      note: 'Nhóm được lặp nhiều nhất trong phần câu.',
      words: newest,
    });
  }
  for (const level of [...byLevel.keys()].sort((a, b) => a - b)) {
    groups.push({ key: `hsk-${level}`, title: `HSK ${level}`, words: byLevel.get(level) ?? [] });
  }
  return groups;
}
