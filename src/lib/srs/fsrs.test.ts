import { describe, expect, it } from 'vitest';
import type { AnswerVerdict, CardState, Rating } from '../../types/study.ts';
import { RATING } from '../../types/study.ts';
import {
  DEFAULT_FSRS_PARAMETERS,
  applyReview,
  createInitialCard,
  describeNextReview,
  intervalFromStability,
  previewInterval,
  ratingFromAnswer,
  retrievability,
  shortInterval,
} from './fsrs.ts';

const MINUTE = 60_000;
const DAY = 86_400_000;
/** Mốc thời gian cố định để test không phụ thuộc đồng hồ máy. */
const T0 = Date.UTC(2026, 0, 1, 8, 0, 0);

/** Đưa một từ mới đi hết các bước học để có thẻ đang ở giai đoạn 'review'. */
function graduated(startAt: number = T0): CardState {
  const learning = applyReview(createInitialCard('L1-0001'), RATING.good, startAt);
  return applyReview(learning, RATING.good, learning.dueAt);
}

describe('createInitialCard', () => {
  it('tạo thẻ chưa học với các bất biến hợp lệ', () => {
    const card = createInitialCard('L1-0042');

    expect(card.wordId).toBe('L1-0042');
    expect(card.phase).toBe('new');
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.lastReviewedAt).toBeNull();
    expect(card.stability).toBeGreaterThan(0);
    expect(card.difficulty).toBeGreaterThanOrEqual(1);
    expect(card.difficulty).toBeLessThanOrEqual(10);
    // Từ mới luôn đến hạn nên hàng đợi lấy ra được ngay.
    expect(card.dueAt).toBeLessThanOrEqual(T0);
  });
});

describe('giai đoạn học lần đầu', () => {
  it('từ mới đi qua các bước học rồi vào review', () => {
    const fresh = createInitialCard('L1-0001');

    const step1 = applyReview(fresh, RATING.good, T0);
    expect(step1.phase).toBe('learning');
    expect(step1.dueAt - T0).toBe(10 * MINUTE);
    expect(step1.reps).toBe(1);
    expect(step1.correctCount).toBe(1);

    const done = applyReview(step1, RATING.good, step1.dueAt);
    expect(done.phase).toBe('review');
    expect(done.learningStep).toBe(0);
    // Đã vào lịch theo ngày nên khoảng ôn tối thiểu là một ngày.
    expect(done.dueAt - done.lastReviewedAt!).toBeGreaterThanOrEqual(DAY);
  });

  it('trả lời again khi đang học thì quay lại bước đầu 1 phút', () => {
    const step1 = applyReview(createInitialCard('L1-0001'), RATING.good, T0);
    const back = applyReview(step1, RATING.again, T0 + MINUTE);

    expect(back.phase).toBe('learning');
    expect(back.learningStep).toBe(0);
    expect(back.dueAt - (T0 + MINUTE)).toBe(MINUTE);
    // Quên lúc còn đang học chưa được tính là một lần quên thật.
    expect(back.lapses).toBe(0);
    expect(back.wrongCount).toBe(1);
  });

  it('trả lời easy ngay lần đầu thì tốt nghiệp thẳng sang review', () => {
    const card = applyReview(createInitialCard('L1-0001'), RATING.easy, T0);

    expect(card.phase).toBe('review');
    expect(card.stability).toBeCloseTo(DEFAULT_FSRS_PARAMETERS.w[3], 10);
  });
});

describe('quên một từ đã thuộc', () => {
  it('again ở review làm tăng lapses và chuyển sang relearning', () => {
    const card = graduated();
    const lapsed = applyReview(card, RATING.again, card.dueAt);

    expect(lapsed.phase).toBe('relearning');
    expect(lapsed.lapses).toBe(card.lapses + 1);
    expect(lapsed.wrongCount).toBe(card.wrongCount + 1);
    expect(lapsed.learningStep).toBe(0);
    expect(lapsed.dueAt - card.dueAt).toBe(10 * MINUTE);
    // Độ bền phải tụt xuống nhưng vẫn dương.
    expect(lapsed.stability).toBeLessThan(card.stability);
    expect(lapsed.stability).toBeGreaterThan(0);
  });

  it('học lại xong thì trở về review', () => {
    const card = graduated();
    const lapsed = applyReview(card, RATING.again, card.dueAt);
    const recovered = applyReview(lapsed, RATING.good, lapsed.dueAt);

    expect(recovered.phase).toBe('review');
    expect(recovered.lapses).toBe(1);
    expect(recovered.dueAt - recovered.lastReviewedAt!).toBeGreaterThanOrEqual(DAY);
  });
});

describe('độ bền và khoảng ôn', () => {
  it('stability tăng và khoảng ôn giãn dần khi trả lời tốt liên tiếp', () => {
    let card = graduated();
    const stabilities: number[] = [card.stability];
    const intervals: number[] = [card.dueAt - card.lastReviewedAt!];

    for (let i = 0; i < 5; i += 1) {
      card = applyReview(card, RATING.good, card.dueAt);
      stabilities.push(card.stability);
      intervals.push(card.dueAt - card.lastReviewedAt!);
    }

    for (let i = 1; i < stabilities.length; i += 1) {
      expect(stabilities[i]).toBeGreaterThan(stabilities[i - 1]);
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
  });

  it('khoảng ôn bằng đúng stability ở mức nhớ mong muốn 0.9', () => {
    expect(intervalFromStability(10)).toBeCloseTo(10, 9);
    expect(intervalFromStability(1)).toBeCloseTo(1, 9);
  });

  it('khoảng ôn bị chặn bởi maximumInterval', () => {
    const capped = intervalFromStability(10_000_000);
    expect(capped).toBeLessThanOrEqual(DEFAULT_FSRS_PARAMETERS.maximumInterval);
    expect(capped).toBeCloseTo(DEFAULT_FSRS_PARAMETERS.maximumInterval, 6);
  });

  it('mức nhớ mong muốn cao hơn thì khoảng ôn ngắn hơn', () => {
    const strict = { ...DEFAULT_FSRS_PARAMETERS, requestRetention: 0.95 };
    expect(intervalFromStability(10, strict)).toBeLessThan(intervalFromStability(10));
  });
});

describe('độ khó', () => {
  it('bị kẹp trong 1..10 sau nhiều lần again', () => {
    let card = graduated();
    for (let i = 0; i < 30; i += 1) {
      card = applyReview(card, RATING.again, card.dueAt);
      expect(card.difficulty).toBeGreaterThanOrEqual(1);
      expect(card.difficulty).toBeLessThanOrEqual(10);
    }
    expect(card.difficulty).toBe(10);
  });

  it('bị kẹp trong 1..10 sau nhiều lần easy', () => {
    let card = graduated();
    for (let i = 0; i < 30; i += 1) {
      card = applyReview(card, RATING.easy, card.dueAt);
      expect(card.difficulty).toBeGreaterThanOrEqual(1);
      expect(card.difficulty).toBeLessThanOrEqual(10);
    }
    expect(card.difficulty).toBe(1);
  });
});

describe('retrievability', () => {
  it('giảm dần theo thời gian', () => {
    const card: CardState = { ...graduated(), stability: 10, lastReviewedAt: T0 };

    const points = [0, 1, 5, 10, 30, 365].map((d) => retrievability(card, T0 + d * DAY));

    expect(points[0]).toBeCloseTo(1, 10);
    for (let i = 1; i < points.length; i += 1) {
      expect(points[i]).toBeLessThan(points[i - 1]);
    }
    expect(points[points.length - 1]).toBeGreaterThan(0);
  });

  it('bằng requestRetention tại đúng ngày đến hạn', () => {
    const stability = 10;
    const dueAt = T0 + intervalFromStability(stability) * DAY;
    const card: CardState = { ...graduated(), stability, lastReviewedAt: T0, dueAt };

    expect(retrievability(card, dueAt)).toBeCloseTo(DEFAULT_FSRS_PARAMETERS.requestRetention, 9);
  });

  it('bằng 0 với thẻ chưa từng ôn', () => {
    expect(retrievability(createInitialCard('L1-0001'), T0)).toBe(0);
  });
});

describe('applyReview thuần khiết', () => {
  it('không làm thay đổi đối tượng đầu vào', () => {
    const card = graduated();
    const before: CardState = JSON.parse(JSON.stringify(card)) as CardState;

    const next = applyReview(card, RATING.again, card.dueAt);

    expect(card).toEqual(before);
    expect(next).not.toBe(card);
  });

  it('giữ nguyên các trường không thuộc thuật toán', () => {
    const card: CardState = {
      ...graduated(),
      starred: true,
      weakestMode: 'listening',
      lastMistake: { mode: 'typing', at: T0, given: 'wo', expected: 'wǒ', verdict: 'close' },
    };

    const next = applyReview(card, RATING.good, card.dueAt);

    expect(next.wordId).toBe(card.wordId);
    expect(next.starred).toBe(true);
    expect(next.weakestMode).toBe('listening');
    expect(next.lastMistake).toEqual(card.lastMistake);
  });

  it('đếm đúng correctCount và wrongCount', () => {
    const start = graduated();

    expect(applyReview(start, RATING.good, start.dueAt).correctCount).toBe(start.correctCount + 1);
    expect(applyReview(start, RATING.easy, start.dueAt).correctCount).toBe(start.correctCount + 1);
    // 'hard' vẫn là nhớ được nhưng không tính vào correctCount (rating < 3).
    expect(applyReview(start, RATING.hard, start.dueAt).correctCount).toBe(start.correctCount);
    expect(applyReview(start, RATING.again, start.dueAt).wrongCount).toBe(start.wrongCount + 1);
    expect(applyReview(start, RATING.good, start.dueAt).wrongCount).toBe(start.wrongCount);
  });
});

describe('ratingFromAnswer', () => {
  const cases: { verdict: AnswerVerdict; usedHint: boolean; expected: Rating }[] = [
    { verdict: 'correct', usedHint: false, expected: RATING.good },
    { verdict: 'correct', usedHint: true, expected: RATING.hard },
    { verdict: 'close', usedHint: false, expected: RATING.hard },
    { verdict: 'close', usedHint: true, expected: RATING.again },
    { verdict: 'wrong', usedHint: false, expected: RATING.again },
    { verdict: 'wrong', usedHint: true, expected: RATING.again },
  ];

  it.each(cases)('$verdict + gợi ý=$usedHint -> $expected', ({ verdict, usedHint, expected }) => {
    expect(ratingFromAnswer(verdict, usedHint)).toBe(expected);
  });
});

describe('describeNextReview', () => {
  it('mô tả đúng theo độ dài khoảng ôn', () => {
    const base = graduated();
    const say = (dueAt: number): string => describeNextReview({ ...base, dueAt }, T0);

    expect(say(T0 - DAY)).toBe('Ôn lại ngay');
    expect(say(T0)).toBe('Ôn lại ngay');
    expect(say(T0 + MINUTE)).toBe('Ôn lại sau 1 phút');
    expect(say(T0 + 10 * MINUTE)).toBe('Ôn lại sau 10 phút');
    expect(say(T0 + 3 * 3_600_000)).toBe('Ôn lại sau 3 giờ');
    expect(say(T0 + 3 * DAY)).toBe('Ôn lại sau 3 ngày');
    expect(say(T0 + 90 * DAY)).toBe('Ôn lại sau 3 tháng');
    expect(say(T0 + 800 * DAY)).toBe('Ôn lại sau 2 năm');
  });
});

describe('shortInterval', () => {
  it('viết gọn để nhét vừa một nút bấm', () => {
    const base = graduated();
    const say = (dueAt: number): string => shortInterval({ ...base, dueAt }, T0);

    expect(say(T0 - DAY)).toBe('ngay');
    expect(say(T0 + MINUTE)).toBe('1 phút');
    expect(say(T0 + 3 * 3_600_000)).toBe('3 giờ');
    expect(say(T0 + 3 * DAY)).toBe('3 ngày');
    expect(say(T0 + 90 * DAY)).toBe('3 tháng');
    expect(say(T0 + 800 * DAY)).toBe('2 năm');
  });

  it('hạn ôn hỏng thì nói "ngay" chứ không hiện NaN', () => {
    expect(shortInterval({ ...graduated(), dueAt: Number.NaN }, T0)).toBe('ngay');
  });
});

describe('previewInterval', () => {
  it('chấm càng chắc thì hẹn ôn càng xa', () => {
    const card = graduated();
    const wrong = applyReview(card, RATING.again, T0).dueAt;
    const close = applyReview(card, RATING.hard, T0).dueAt;
    const correct = applyReview(card, RATING.good, T0).dueAt;

    // "Chưa nhớ" luôn kéo hạn về gần hẳn; "gần nhớ" và "đã nhớ" chỉ chắc chắn
    // không đảo thứ tự — với thẻ vừa tốt nghiệp, hai mức này có thể làm tròn ra
    // cùng một ngày, và đó là hành vi đúng của FSRS chứ không phải lỗi.
    expect(wrong).toBeLessThan(close);
    expect(close).toBeLessThanOrEqual(correct);
    expect(previewInterval(card, card.wordId, 'correct', T0)).toBe(
      shortInterval({ ...card, dueAt: correct }, T0),
    );
  });

  it('từ mới chưa có thẻ vẫn xem trước được, không ném lỗi', () => {
    // Đây là trường hợp thường gặp nhất: mặt trước một thẻ chưa từng học.
    expect(previewInterval(null, 'L1-0001', 'wrong', T0)).not.toBe('');
    expect(previewInterval(null, 'L1-0001', 'correct', T0)).not.toBe('');
  });
});

describe('độ bền số học', () => {
  it('chuỗi 20 lượt ôn liên tiếp không sinh ra NaN hay Infinity', () => {
    const ratings: Rating[] = [
      RATING.good,
      RATING.again,
      RATING.hard,
      RATING.easy,
      RATING.good,
      RATING.again,
      RATING.again,
      RATING.good,
      RATING.hard,
      RATING.easy,
      RATING.good,
      RATING.good,
      RATING.again,
      RATING.hard,
      RATING.hard,
      RATING.good,
      RATING.easy,
      RATING.again,
      RATING.good,
      RATING.good,
    ];

    let card = createInitialCard('L1-0001');
    let now = T0;

    for (const rating of ratings) {
      card = applyReview(card, rating, now);

      expect(Number.isFinite(card.stability)).toBe(true);
      expect(Number.isFinite(card.difficulty)).toBe(true);
      expect(Number.isFinite(card.dueAt)).toBe(true);
      expect(card.stability).toBeGreaterThan(0);
      expect(card.difficulty).toBeGreaterThanOrEqual(1);
      expect(card.difficulty).toBeLessThanOrEqual(10);
      expect(card.dueAt).toBeGreaterThan(now);
      expect(retrievability(card, card.dueAt)).toBeGreaterThan(0);

      now = card.dueAt;
    }

    expect(card.reps).toBe(ratings.length);
    expect(card.correctCount + card.wrongCount).toBeLessThanOrEqual(card.reps);
  });

  it('chịu được tham số bất thường mà không trả về giá trị hỏng', () => {
    const broken = { ...DEFAULT_FSRS_PARAMETERS, w: DEFAULT_FSRS_PARAMETERS.w.map(() => 0) };
    const card = applyReview(createInitialCard('L1-0001'), RATING.good, T0, broken);

    expect(Number.isFinite(card.stability)).toBe(true);
    expect(card.stability).toBeGreaterThan(0);
    expect(card.difficulty).toBeGreaterThanOrEqual(1);
  });
});

describe('dữ liệu thẻ bị hỏng', () => {
  const corruptSteps: number[] = [-1, -0.5, 2.5, Number.NaN, Number.POSITIVE_INFINITY];
  const phases: CardState['phase'][] = ['learning', 'relearning'];
  const allRatings: Rating[] = [RATING.again, RATING.hard, RATING.good, RATING.easy];

  it('learningStep hỏng vẫn cho ra dueAt hợp lệ', () => {
    const base = graduated();

    for (const phase of phases) {
      for (const learningStep of corruptSteps) {
        for (const rating of allRatings) {
          const card: CardState = { ...base, phase, learningStep };
          const next = applyReview(card, rating, T0);

          expect(Number.isFinite(next.dueAt)).toBe(true);
          expect(next.dueAt).toBeGreaterThan(T0);
          // Bước học mới luôn là chỉ số dùng được cho lần lên lịch sau.
          expect(Number.isInteger(next.learningStep)).toBe(true);
          expect(next.learningStep).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('lastReviewedAt hỏng thì coi như học lần đầu, không thổi phồng khoảng ôn', () => {
    const base = graduated();
    const card: CardState = { ...base, lastReviewedAt: Number.NaN };

    const next = applyReview(card, RATING.good, T0);

    expect(retrievability(card, T0)).toBe(0);
    expect(next.stability).toBeCloseTo(DEFAULT_FSRS_PARAMETERS.w[2], 10);
    // Không được nhảy sang lịch hàng trăm ngày chỉ vì một mốc thời gian hỏng.
    expect((next.dueAt - T0) / DAY).toBeLessThan(30);
  });

  it('dueAt hỏng thì mô tả là ôn ngay chứ không phải "NaN"', () => {
    const base = graduated();

    expect(describeNextReview({ ...base, dueAt: Number.NaN }, T0)).toBe('Ôn lại ngay');
    expect(describeNextReview({ ...base, dueAt: Number.POSITIVE_INFINITY }, T0)).toBe('Ôn lại ngay');
    expect(describeNextReview({ ...base, dueAt: Number.NEGATIVE_INFINITY }, T0)).toBe('Ôn lại ngay');
  });
});

describe('tràn số trong công thức', () => {
  it('trọng số quá lớn thì độ bền bão hoà ở maximumInterval chứ không tụt xuống đáy', () => {
    const card = graduated();
    // exp(w8) tràn thành Infinity; kết quả phải là "bền tối đa", không phải "quên sạch".
    const overflowing = [...DEFAULT_FSRS_PARAMETERS.w];
    overflowing[8] = 800;
    const params = { ...DEFAULT_FSRS_PARAMETERS, w: overflowing };

    const next = applyReview(card, RATING.good, card.dueAt, params);

    expect(Number.isFinite(next.stability)).toBe(true);
    expect(next.stability).toBeGreaterThanOrEqual(card.stability);
    expect(next.stability).toBe(params.maximumInterval);
    expect(next.dueAt - card.dueAt).toBe(params.maximumInterval * DAY);
  });

  it('mức nhớ mong muốn bằng 0 cho khoảng ôn dài nhất, không phải ngắn nhất', () => {
    const params = { ...DEFAULT_FSRS_PARAMETERS, requestRetention: 0 };

    expect(intervalFromStability(10, params)).toBe(params.maximumInterval);
  });

  it('maximumInterval hỏng không làm hỏng lịch ôn', () => {
    const params = { ...DEFAULT_FSRS_PARAMETERS, maximumInterval: Number.NaN };
    const card = applyReview(graduated(), RATING.good, T0, params);

    expect(Number.isFinite(card.stability)).toBe(true);
    expect(Number.isFinite(card.dueAt)).toBe(true);
    expect(card.dueAt).toBeGreaterThan(T0);
  });
});
