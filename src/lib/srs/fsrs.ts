import type { AnswerVerdict, CardState, Rating } from '../../types/study.ts';
import { RATING } from '../../types/study.ts';

/**
 * FSRS 4.5 — Free Spaced Repetition Scheduler.
 *
 * Mô hình dùng ba đại lượng cho mỗi thẻ:
 *
 * 1. Độ bền `S` (stability, đơn vị ngày): số ngày trôi qua để khả năng nhớ lại
 *    tụt xuống đúng 90%.
 * 2. Độ khó `D` (difficulty, thang 1..10): từ càng khó thì độ bền càng tăng chậm.
 * 3. Khả năng nhớ lại `R` (retrievability, 0..1): xác suất nhớ được ngay lúc này.
 *
 * Đường quên là hàm luỹ thừa (FSRS 4.5 đổi từ hàm mũ sang luỹ thừa vì khớp dữ
 * liệu ôn tập thực tế tốt hơn):
 *
 *     R(t, S) = (1 + FACTOR · t / S) ^ DECAY,   DECAY = -0.5, FACTOR = 19/81
 *
 * FACTOR được chọn sao cho R(t = S) = 0.9, đúng với định nghĩa "độ bền là số
 * ngày còn nhớ 90%". Đảo ngược công thức trên cho ra khoảng cách ôn tiếp theo
 * ứng với mức nhớ mong muốn `requestRetention`:
 *
 *     I(r, S) = S / FACTOR · (r ^ (1 / DECAY) − 1)
 *
 * Với r = 0.9 thì I = S, nên khoảng ôn mặc định đúng bằng độ bền.
 *
 * Cập nhật sau mỗi lượt trả lời (G = rating 1..4):
 *
 * - Lần đầu gặp từ:   S₀(G) = w[G−1];   D₀(G) = w4 − (G − 3)·w5
 * - Độ khó lần sau:   D' = w7·D₀(4) + (1 − w7)·(D − w6·(G − 3))
 *   Thành phần w7·D₀(4) là "hồi quy về trung bình": độ khó bị kéo dần về mức của
 *   một từ dễ, nếu không thì mọi từ đều trôi dần tới 10 sau đủ nhiều lần quên.
 * - Nhớ được (G ≥ 2): S' = S · (1 + e^w8 · (11 − D) · S^(−w9)
 *                          · (e^(w10·(1−R)) − 1) · phạt_khó · thưởng_dễ)
 *   Ba nhân tử đầu nói: từ dễ tăng bền nhanh hơn, thẻ đã bền thì tăng chậm lại,
 *   và ôn đúng lúc sắp quên (R thấp) cho mức tăng lớn nhất — đó là lý do phải
 *   giãn khoảng ôn thay vì ôn dày.
 * - Quên (G = 1):     S' = w11 · D^(−w12) · ((S + 1)^w13 − 1) · e^(w14·(1−R))
 *   Độ bền không rơi về 0 mà tụt về một mức thấp phụ thuộc độ bền cũ, nên từ đã
 *   học lâu vẫn hồi phục nhanh hơn từ mới toanh.
 *
 * Giai đoạn học lần đầu không dùng lịch theo ngày mà dùng các bước phút ngắn
 * (1 phút, 10 phút) giống Anki, vì FSRS 4.5 không mô hình hoá lượt ôn trong ngày.
 */
export interface FsrsParameters {
  w: readonly number[];
  requestRetention: number;
  maximumInterval: number;
}

/** Bộ 17 trọng số mặc định của FSRS 4.5, khớp từ tập dữ liệu ôn tập cộng đồng. */
const DEFAULT_W: readonly number[] = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072,
  0.0793, 0.3246, 1.587, 0.2272, 2.8755,
];

export const DEFAULT_FSRS_PARAMETERS: FsrsParameters = {
  w: DEFAULT_W,
  requestRetention: 0.9,
  maximumInterval: 36500,
};

/** Số mũ của đường quên luỹ thừa trong FSRS 4.5. */
const DECAY = -0.5;
/** Hệ số chuẩn hoá, chọn sao cho R(t = S) = 0.9. */
const FACTOR = 19 / 81;

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** Các bước học lần đầu: 1 phút rồi 10 phút, qua hết thì vào lịch ôn theo ngày. */
const LEARNING_STEPS_MS: readonly number[] = [MINUTE_MS, 10 * MINUTE_MS];
/** Học lại sau khi quên chỉ cần một bước ngắn. */
const RELEARNING_STEPS_MS: readonly number[] = [10 * MINUTE_MS];

const MIN_STABILITY = 0.01;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

/**
 * Kẹp giá trị vào [min, max]. Chỉ NaN mới bị quy về `min`; còn tràn số thì phải
 * bão hoà đúng phía (+∞ → max, −∞ → min), vì quy cả +∞ về `min` sẽ biến một lượt
 * trả lời tốt bị tràn số thành cú tụt độ bền xuống đáy — sai ngược hoàn toàn.
 */
function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  // Cận trên hỏng thì bỏ cận trên, nếu không Math.min(x, NaN) lại đẻ ra NaN.
  const upper = Number.isNaN(max) ? Number.POSITIVE_INFINITY : max;
  return Math.min(Math.max(value, min), upper);
}

function clampStability(value: number, max: number): number {
  return clamp(value, MIN_STABILITY, max);
}

function clampDifficulty(value: number): number {
  return clamp(value, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/** S₀(G): độ bền ngay sau lần trả lời đầu tiên. */
function initialStability(rating: Rating, params: FsrsParameters): number {
  return clampStability(params.w[rating - 1], params.maximumInterval);
}

/** D₀(G) chưa kẹp biên; phép hồi quy về trung bình cần giá trị gốc này. */
function rawInitialDifficulty(rating: Rating, w: readonly number[]): number {
  return w[4] - (rating - 3) * w[5];
}

function initialDifficulty(rating: Rating, w: readonly number[]): number {
  return clampDifficulty(rawInitialDifficulty(rating, w));
}

/** D' — độ khó mới, có hồi quy về mức của một từ "dễ". */
function nextDifficulty(difficulty: number, rating: Rating, w: readonly number[]): number {
  const shifted = difficulty - w[6] * (rating - 3);
  const reverted = w[7] * rawInitialDifficulty(RATING.easy, w) + (1 - w[7]) * shifted;
  return clampDifficulty(reverted);
}

/** S' khi người học vẫn nhớ (rating 2..4). */
function recallStability(
  difficulty: number,
  stability: number,
  retention: number,
  rating: Rating,
  params: FsrsParameters,
): number {
  const w = params.w;
  const hardPenalty = rating === RATING.hard ? w[15] : 1;
  const easyBonus = rating === RATING.easy ? w[16] : 1;
  const growth =
    Math.exp(w[8]) *
    (11 - difficulty) *
    Math.pow(stability, -w[9]) *
    (Math.exp((1 - retention) * w[10]) - 1) *
    hardPenalty *
    easyBonus;
  return clampStability(stability * (1 + growth), params.maximumInterval);
}

/** S' khi người học đã quên (rating 1). */
function forgetStability(
  difficulty: number,
  stability: number,
  retention: number,
  params: FsrsParameters,
): number {
  const w = params.w;
  const next =
    w[11] *
    Math.pow(difficulty, -w[12]) *
    (Math.pow(stability + 1, w[13]) - 1) *
    Math.exp((1 - retention) * w[14]);
  // Đã quên thì độ bền phải giảm; với thẻ còn non công thức trên có thể cho ra
  // giá trị lớn hơn độ bền cũ nên cần chặn lại.
  return clampStability(Math.min(next, stability), params.maximumInterval);
}

/** Tạo trạng thái ban đầu cho một từ chưa học. */
export function createInitialCard(wordId: string): CardState {
  return {
    wordId,
    phase: 'new',
    // Chưa có trí nhớ nào, nhưng vẫn giữ độ bền dương để mọi phép chia và luỹ thừa an toàn.
    stability: MIN_STABILITY,
    difficulty: initialDifficulty(RATING.good, DEFAULT_FSRS_PARAMETERS.w),
    reps: 0,
    lapses: 0,
    correctCount: 0,
    wrongCount: 0,
    lastReviewedAt: null,
    // dueAt = 0 nghĩa là luôn đến hạn, hàng đợi có thể lấy từ mới ra bất cứ lúc nào.
    dueAt: 0,
    learningStep: 0,
    starred: false,
    weakestMode: null,
    lastMistake: null,
  };
}

/** Tính khả năng nhớ lại tại thời điểm now (0..1). */
export function retrievability(
  card: CardState,
  now: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  // Chưa từng ôn (hoặc mốc thời gian đã hỏng) thì chưa có gì trong trí nhớ để mà nhớ lại.
  if (card.lastReviewedAt === null || !Number.isFinite(card.lastReviewedAt)) return 0;
  const elapsedDays = Math.max(0, (now - card.lastReviewedAt) / DAY_MS);
  const stability = clampStability(card.stability, params.maximumInterval);
  return clamp(Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY), 0, 1);
}

/** Khoảng cách ôn (ngày) ứng với stability hiện tại. */
export function intervalFromStability(
  stability: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  const safeStability = clampStability(stability, params.maximumInterval);
  const days = (safeStability / FACTOR) * (Math.pow(params.requestRetention, 1 / DECAY) - 1);
  return clamp(days, 0, params.maximumInterval);
}

/** Khoảng ôn dài hạn quy về số ngày tròn, tối thiểu 1 ngày để không hiện lại trong cùng ngày. */
function scheduledDays(stability: number, params: FsrsParameters): number {
  const days = Math.ceil(intervalFromStability(stability, params));
  return clamp(days, 1, params.maximumInterval);
}

/**
 * Quy `learningStep` đọc từ kho lưu trữ về một chỉ số dùng được. Bản ghi cũ hoặc
 * tệp sao lưu do người dùng sửa tay có thể mang số âm, số lẻ hay NaN; nếu bê
 * nguyên vào mảng bước học thì `steps[step]` là undefined và dueAt thành NaN,
 * tức thẻ biến mất khỏi mọi hàng đợi.
 */
function safeStepIndex(step: number, stepCount: number): number {
  if (!Number.isFinite(step)) return 0;
  return clamp(Math.floor(step), 0, stepCount);
}

/**
 * Bước học kế tiếp trong chuỗi bước ngắn. Kết quả ≥ số bước nghĩa là đã tốt
 * nghiệp, thẻ chuyển sang lịch ôn theo ngày.
 */
function nextLearningStep(currentStep: number, rating: Rating, stepCount: number): number {
  switch (rating) {
    case RATING.again:
      return 0;
    case RATING.hard:
      return currentStep;
    case RATING.good:
      return currentStep + 1;
    case RATING.easy:
      return stepCount;
  }
}

/** Áp dụng một lượt trả lời và trả về trạng thái mới. Không sửa đối tượng đầu vào. */
export function applyReview(
  card: CardState,
  rating: Rating,
  now: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): CardState {
  const w = params.w;
  // Mốc ôn gần nhất hỏng thì không suy ra được R, coi như gặp từ lần đầu còn hơn
  // lấy R = 0 rồi thổi độ bền lên như thể thẻ đã nằm im hàng thế kỷ.
  const isFirstTime = card.phase === 'new' || !Number.isFinite(card.lastReviewedAt);
  const currentRetention = retrievability(card, now, params);

  // Cả độ khó lẫn độ bền mới đều tính từ giá trị cũ, nên phải lấy trước khi ghi đè.
  const difficulty = isFirstTime
    ? initialDifficulty(rating, w)
    : nextDifficulty(card.difficulty, rating, w);

  let stability: number;
  if (isFirstTime) {
    stability = initialStability(rating, params);
  } else if (rating === RATING.again) {
    stability =
      card.phase === 'learning'
        ? // Quên khi còn đang học lần đầu chỉ là bắt đầu lại, chưa phải quên một từ đã thuộc.
          initialStability(RATING.again, params)
        : forgetStability(card.difficulty, card.stability, currentRetention, params);
  } else {
    stability = recallStability(card.difficulty, card.stability, currentRetention, rating, params);
  }

  let phase: CardState['phase'];
  let learningStep = 0;
  let lapses = card.lapses;
  let dueAt: number;

  if (card.phase === 'review' && rating === RATING.again) {
    // Quên một từ đã vào lịch ôn mới là "lapse" theo nghĩa của FSRS.
    lapses += 1;
    phase = 'relearning';
    dueAt = now + RELEARNING_STEPS_MS[0];
  } else if (card.phase === 'review') {
    phase = 'review';
    dueAt = now + scheduledDays(stability, params) * DAY_MS;
  } else {
    const steps = card.phase === 'relearning' ? RELEARNING_STEPS_MS : LEARNING_STEPS_MS;
    const currentStep = card.phase === 'new' ? 0 : safeStepIndex(card.learningStep, steps.length);
    const step = nextLearningStep(currentStep, rating, steps.length);
    if (step >= steps.length) {
      phase = 'review';
      dueAt = now + scheduledDays(stability, params) * DAY_MS;
    } else {
      phase = card.phase === 'relearning' ? 'relearning' : 'learning';
      learningStep = step;
      dueAt = now + steps[step];
    }
  }

  return {
    ...card,
    phase,
    stability,
    difficulty,
    reps: card.reps + 1,
    lapses,
    correctCount: card.correctCount + (rating >= RATING.good ? 1 : 0),
    wrongCount: card.wrongCount + (rating === RATING.again ? 1 : 0),
    lastReviewedAt: now,
    dueAt,
    learningStep,
  };
}

/** Quy đổi kết quả chấm bài thành mức đánh giá FSRS. */
export function ratingFromAnswer(verdict: AnswerVerdict, usedHint: boolean): Rating {
  if (verdict === 'wrong') return RATING.again;
  // Gần đúng mà còn phải mở gợi ý thì coi như chưa nhớ.
  if (verdict === 'close') return usedHint ? RATING.again : RATING.hard;
  // Đúng nhưng nhờ gợi ý thì trí nhớ chưa vững, chỉ tính là "khó".
  return usedHint ? RATING.hard : RATING.good;
}

/** Mô tả ngắn bằng tiếng Việt để hiển thị cho người học, ví dụ "Ôn lại sau 3 ngày". */
export function describeNextReview(card: CardState, now: number): string {
  const remaining = card.dueAt - now;
  // Hạn ôn hỏng thì thà đẩy thẻ ra ôn ngay còn hơn hiện "Ôn lại sau NaN năm";
  // lượt ôn kế tiếp sẽ ghi lại dueAt hợp lệ.
  if (!Number.isFinite(remaining) || remaining <= 0) return 'Ôn lại ngay';

  const minutes = Math.round(remaining / MINUTE_MS);
  if (minutes < 60) return `Ôn lại sau ${Math.max(1, minutes)} phút`;

  const hours = Math.round(remaining / (60 * MINUTE_MS));
  if (hours < 24) return `Ôn lại sau ${hours} giờ`;

  const days = Math.round(remaining / DAY_MS);
  if (days < 30) return `Ôn lại sau ${days} ngày`;

  const months = Math.round(days / 30);
  if (months < 12) return `Ôn lại sau ${months} tháng`;

  return `Ôn lại sau ${Math.round(days / 365)} năm`;
}

/**
 * Khoảng cách tới lần ôn kế tiếp, viết thật ngắn để nhét vừa một nút bấm.
 *
 * Ba nút "Chưa nhớ / Gần nhớ / Đã nhớ" là dữ liệu đầu vào của cả thuật toán,
 * nhưng nếu người học không thấy hệ quả thì họ bấm theo cảm tính. Chuỗi này bỏ
 * hẳn phần "Ôn lại sau" của `describeNextReview` vì nhãn nút đã nói điều đó rồi.
 */
export function shortInterval(card: CardState, now: number): string {
  const remaining = card.dueAt - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return 'ngay';

  const minutes = Math.round(remaining / MINUTE_MS);
  if (minutes < 60) return `${Math.max(1, minutes)} phút`;

  const hours = Math.round(remaining / (60 * MINUTE_MS));
  if (hours < 24) return `${hours} giờ`;

  const days = Math.round(remaining / DAY_MS);
  if (days < 30) return `${days} ngày`;

  const months = Math.round(days / 30);
  if (months < 12) return `${months} tháng`;

  return `${Math.round(days / 365)} năm`;
}

/**
 * Xem trước hạn ôn nếu người học chấm thẻ này ở mức `verdict`.
 *
 * Chỉ tính chứ không ghi: `applyReview` là hàm thuần nên gọi ở đây an toàn, và
 * lượt chấm thật vẫn đi qua đúng đường cũ.
 */
export function previewInterval(
  card: CardState | null,
  wordId: string,
  verdict: AnswerVerdict,
  now: number,
): string {
  const base = card ?? createInitialCard(wordId);
  return shortInterval(applyReview(base, ratingFromAnswer(verdict, false), now), now);
}
