import type { HskLevel } from './vocabulary.ts';

/** Bốn mức đánh giá của FSRS. */
export type Rating = 1 | 2 | 3 | 4;

export const RATING = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
} as const satisfies Record<string, Rating>;

/** Bốn chế độ luyện tập chính. */
export type StudyMode = 'flashcards' | 'typing' | 'listening' | 'speaking';

/** Kết quả chấm một câu trả lời. */
export type AnswerVerdict = 'correct' | 'close' | 'wrong';

/** Loại nội dung mà người học phải nhập. */
export type AnswerKind = 'hanzi' | 'pinyin' | 'vi' | 'en';

/** Dạng đề bài của phần gõ đáp án. */
export interface TypingPrompt {
  /** Nội dung đề bài hiển thị cho người học. */
  question: AnswerKind;
  /** Nội dung người học phải gõ. */
  expected: AnswerKind;
}

/** Trạng thái ghi nhớ của một từ theo thuật toán FSRS. */
export interface CardState {
  wordId: string;
  /** `new` chưa học, `learning` đang học lần đầu, `review` đã vào lịch ôn, `relearning` học lại sau khi quên. */
  phase: 'new' | 'learning' | 'review' | 'relearning';
  /** Độ bền trí nhớ, tính bằng ngày. */
  stability: number;
  /** Độ khó của từ với người học, thang 1 đến 10. */
  difficulty: number;
  /** Số lần đã ôn. */
  reps: number;
  /** Số lần quên. */
  lapses: number;
  /** Số lần trả lời đúng và sai, dùng cho thống kê. */
  correctCount: number;
  wrongCount: number;
  /** Thời điểm ôn gần nhất, số mili giây. */
  lastReviewedAt: number | null;
  /** Thời điểm cần ôn tiếp theo, số mili giây. */
  dueAt: number;
  /** Số bước đã qua trong giai đoạn học lần đầu hoặc học lại. */
  learningStep: number;
  /** Người học đã lưu từ này vào sổ tay. */
  starred: boolean;
  /**
   * Thời điểm lưu gần nhất, để sổ tay xếp từ mới lưu lên đầu.
   *
   * Không bắt buộc vì các thẻ tạo ra trước khi có sổ tay không có mốc này, và
   * tệp sao lưu cũ cũng vậy. Thiếu mốc thì coi như đã lưu từ rất lâu rồi.
   */
  starredAt?: number;
  /** Chế độ mà người học hay trả lời sai nhất. */
  weakestMode: StudyMode | null;
  /** Lỗi gần nhất, để nhắc lại khi gặp lại từ. */
  lastMistake: LastMistake | null;
}

export interface LastMistake {
  mode: StudyMode;
  at: number;
  /** Nội dung người học đã nhập. */
  given: string;
  /** Đáp án đúng. */
  expected: string;
  verdict: AnswerVerdict;
}

/** Một lượt trả lời đã ghi lại, dùng cho thống kê và biểu đồ. */
export interface ReviewLogEntry {
  id?: number;
  wordId: string;
  mode: StudyMode;
  rating: Rating;
  verdict: AnswerVerdict;
  /** Người học đã bấm nút trợ giúp trong câu này. */
  usedHint: boolean;
  at: number;
  /** Ngày theo giờ địa phương, dạng YYYY-MM-DD, dùng để đếm chuỗi ngày học. */
  day: string;
  /** Thời gian trả lời tính bằng mili giây. */
  elapsedMs: number;
}

/** Thống kê một ngày học, cập nhật dần trong lúc học. */
export interface DailyStat {
  /** Khoá chính, dạng YYYY-MM-DD theo giờ địa phương. */
  day: string;
  reviews: number;
  correct: number;
  /** Số từ mới đã học trong ngày. */
  newWords: number;
  /** Tổng thời gian học trong ngày, tính bằng mili giây. */
  studyMs: number;
}

/** Nơi phát sinh một lượt tra từ. */
export type LookupSource = 'search' | 'scan';

/**
 * Một từ đã tra trong từ điển. Gộp theo từ chứ không ghi từng lượt, nên `at` là
 * lần tra gần nhất còn `count` là tổng số lần.
 */
export interface LookupEntry {
  /** Khoá chính. */
  wordId: string;
  at: number;
  count: number;
  /** Nội dung đã gõ ở lần tra gần nhất; rỗng khi từ đến từ phần quét đoạn văn. */
  query: string;
  source: LookupSource;
}

/**
 * Một buổi học người dùng đã lưu để quay lại sau.
 *
 * Tách khỏi tiến độ học: lưu một buổi là ý định của người học ("để dành buổi
 * này"), còn tiến độ là hệ quả của việc trả lời. Trộn hai thứ vào một bảng thì
 * xoá tiến độ sẽ xoá luôn danh sách để dành, mà hai việc đó không liên quan.
 */
export interface SavedLesson {
  /** Khoá chính, ví dụ "L2-B42". */
  lessonId: string;
  /** Thời điểm lưu, dùng để xếp mới trước cũ sau. */
  at: number;
}

export interface StudyQueueOptions {
  levels: HskLevel[];
  /** Nguồn từ đưa vào hàng đợi. */
  pool: 'due' | 'new' | 'starred' | 'mixed' | 'lesson';
  /** Chỉ lấy từ trong một buổi học cụ thể. */
  lessonId?: string;
  limit: number;
}

/** Số liệu tổng hợp hiển thị ở trang chủ. */
export interface ProgressSummary {
  dueToday: number;
  newAvailable: number;
  learnedTotal: number;
  /** Số từ đã học theo từng cấp. */
  perLevel: { level: HskLevel; learned: number; total: number }[];
  /** Chuỗi ngày học liên tiếp tính đến hôm nay. */
  streak: number;
  /** Bảy ngày gần nhất, cũ trước mới sau. */
  lastSevenDays: DailyStat[];
  todayReviews: number;
  todayGoalReached: boolean;
  /** Số từ đang nằm trong sổ tay, đếm trên toàn bộ kho chứ không theo cấp đang chọn. */
  starredTotal: number;
  /** Số buổi học đã lưu. */
  savedLessonsTotal: number;
}
