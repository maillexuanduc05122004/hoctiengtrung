import { db } from './database.ts';
import type { CardState } from '../types/study.ts';

/**
 * Thẻ trắng cho từ chưa từng học. Chỉ tạo khi người dùng đánh dấu sao trước lúc học,
 * vì lúc đó cần một chỗ để lưu cờ `starred`.
 */
function blankCard(wordId: string): CardState {
  return {
    wordId,
    phase: 'new',
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    correctCount: 0,
    wrongCount: 0,
    lastReviewedAt: null,
    dueAt: 0,
    learningStep: 0,
    starred: false,
    weakestMode: null,
    lastMistake: null,
  };
}

/**
 * Bản ghi có tồn tại nhưng chưa qua lượt ôn nào thì vẫn là từ mới: đánh dấu sao
 * không được làm từ biến mất khỏi hàng đợi học từ mới.
 */
function isUnstudied(card: CardState): boolean {
  return card.reps === 0 && card.phase === 'new';
}

/**
 * Bên gọi hay ghép danh sách từ nhiều nguồn (nhiều cấp, nhiều buổi học) nên id lặp
 * lại là chuyện thường. Không khử trùng thì một từ vào hàng đợi hai lần và bị đếm
 * hai lần vào số từ đã học, khiến thanh tiến độ vượt quá 100%.
 */
function uniqueIds(wordIds: readonly string[]): string[] {
  return [...new Set(wordIds)];
}

export async function getCard(wordId: string): Promise<CardState | undefined> {
  return db.cards.get(wordId);
}

export async function getCards(wordIds: readonly string[]): Promise<Map<string, CardState>> {
  const found = new Map<string, CardState>();
  if (wordIds.length === 0) {
    return found;
  }
  const rows = await db.cards.bulkGet(uniqueIds(wordIds));
  for (const card of rows) {
    if (card) {
      found.set(card.wordId, card);
    }
  }
  return found;
}

export async function saveCard(card: CardState): Promise<void> {
  await db.cards.put(card);
}

/** Lấy các từ tới hạn ôn trong tập wordIds cho trước, sắp theo dueAt tăng dần. */
export async function getDueCards(
  wordIds: readonly string[],
  now: number,
  limit: number,
): Promise<CardState[]> {
  if (wordIds.length === 0 || limit <= 0) {
    return [];
  }
  const wanted = new Set(wordIds);
  // Duyệt theo chỉ mục dueAt nên kết quả đã tăng dần, không cần sắp lại.
  return db.cards
    .where('dueAt')
    .belowOrEqual(now)
    .filter((card) => wanted.has(card.wordId) && !isUnstudied(card))
    .limit(limit)
    .toArray();
}

/** Các từ chưa có bản ghi nào, tức là từ mới. */
export async function getNewWordIds(
  wordIds: readonly string[],
  limit: number,
): Promise<string[]> {
  if (wordIds.length === 0 || limit <= 0) {
    return [];
  }
  const ids = uniqueIds(wordIds);
  const rows = await db.cards.bulkGet(ids);
  const result: string[] = [];
  // Giữ nguyên thứ tự wordIds đầu vào để bên gọi tự quyết định thứ tự học.
  for (let i = 0; i < ids.length && result.length < limit; i += 1) {
    const card = rows[i];
    if (!card || isUnstudied(card)) {
      result.push(ids[i]);
    }
  }
  return result;
}

export async function getStarredWordIds(wordIds: readonly string[]): Promise<string[]> {
  if (wordIds.length === 0) {
    return [];
  }
  // IndexedDB không nhận boolean làm khoá nên chỉ mục `starred` vô dụng, phải lọc tay.
  const rows = await db.cards.bulkGet(uniqueIds(wordIds));
  const result: string[] = [];
  for (const card of rows) {
    if (card?.starred) {
      result.push(card.wordId);
    }
  }
  return result;
}

export async function toggleStar(wordId: string): Promise<boolean> {
  return db.transaction('rw', db.cards, async () => {
    const card = await db.cards.get(wordId);
    const next = card ? !card.starred : true;
    await db.cards.put({ ...(card ?? blankCard(wordId)), starred: next });
    return next;
  });
}

/** Các từ hay trả lời sai nhất, sắp giảm dần theo số lần sai. */
export async function getTroubleWords(
  wordIds: readonly string[],
  limit: number,
): Promise<CardState[]> {
  if (wordIds.length === 0 || limit <= 0) {
    return [];
  }
  const rows = await db.cards.bulkGet(uniqueIds(wordIds));
  const troubled = rows.filter(
    (card): card is CardState => card !== undefined && card.wrongCount > 0,
  );
  // So sánh thêm theo wordId để thứ tự ổn định khi số lần sai bằng nhau.
  troubled.sort((a, b) => b.wrongCount - a.wrongCount || a.wordId.localeCompare(b.wordId));
  return troubled.slice(0, limit);
}

export async function countLearnedByWordIds(wordIds: readonly string[]): Promise<number> {
  if (wordIds.length === 0) {
    return 0;
  }
  const rows = await db.cards.bulkGet(uniqueIds(wordIds));
  let learned = 0;
  for (const card of rows) {
    if (card && !isUnstudied(card)) {
      learned += 1;
    }
  }
  return learned;
}
