/**
 * Bộ từ và câu dự phòng, đóng gói sẵn trong ứng dụng.
 *
 * Trang "Câu của tôi" lấy dữ liệu từ máy chủ, mà máy chủ miễn phí ngủ và dậy
 * chậm. Lần mở SAU đã có bản chụp (`snapshot.ts`) để hiện ngay; còn lần mở ĐẦU
 * trên một máy — hay sau khi xoá dữ liệu trình duyệt — thì chưa có gì. Chỗ này
 * lấp đúng khoảng trống đó: 89 từ và 90 câu trong `corpus.ts`, tức chính bộ
 * máy chủ được seed lúc dựng (migration V16 phía backend), đổi sang đúng kiểu
 * máy chủ trả về để bảng từ và phần nghe dùng như dữ liệu thật.
 *
 * Mã (`id`, `wordId`) là số ÂM để không bao giờ trùng mã thật của máy chủ và
 * để nhìn vào là biết đây là bản dự phòng. Vì mã giả, mọi thao tác ghi (xoá
 * từ, xoá câu) phải chờ máy chủ trả lời — trang giấu các nút đó đi cho tới lúc
 * ấy; xem `SentencesPage`.
 *
 * Nhóm "10 từ mới gần nhất" của `corpus.ts` được cho `learnedAt` muộn hơn để
 * `groupWords` xếp đúng nhóm đó lên đầu, như trên máy chủ.
 */
import type { Sentence, UserWord } from '../../lib/api/types.ts';
import { MY_SENTENCES, MY_WORDS } from './corpus.ts';

const SEEDED_AT = '2026-01-01T00:00:00Z';
const NEWEST_AT = '2026-01-02T00:00:00Z';

export const FALLBACK_WORDS: readonly UserWord[] = MY_WORDS.map((word, i) => ({
  id: -(i + 1),
  wordId: -(i + 1),
  simplified: word.hanzi,
  pinyin: word.pinyin,
  meaningVi: word.vi,
  hskLevel: 1,
  status: 'LEARNED',
  learnedAt: word.group === 'moi' ? NEWEST_AT : SEEDED_AT,
}));

export const FALLBACK_SENTENCES: readonly Sentence[] = MY_SENTENCES.map((sentence, i) => ({
  id: -(i + 1),
  hanzi: sentence.hanzi,
  pinyin: sentence.pinyin,
  meaningVi: sentence.vi,
  level: sentence.level,
  source: 'BUILTIN',
  createdAt: SEEDED_AT,
}));

/** Mã âm là dấu hiệu của bản dự phòng; máy chủ chỉ cấp mã dương. */
export function isFallbackId(id: number): boolean {
  return id < 0;
}
