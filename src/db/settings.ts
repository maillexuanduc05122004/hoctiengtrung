import { db } from './database.ts';
import { DEFAULT_SETTINGS, SPEECH_RATES } from '../types/settings.ts';
import type { AppSettings, DisplayMode, ThemePreference } from '../types/settings.ts';
import type { HskLevel } from '../types/vocabulary.ts';
import type {
  AnswerVerdict,
  CardState,
  DailyStat,
  LastMistake,
  Rating,
  ReviewLogEntry,
  StudyMode,
} from '../types/study.ts';

export const SETTINGS_KEY = 'app';

/** Tăng số này khi định dạng tệp sao lưu thay đổi không tương thích. */
export const BACKUP_VERSION = 1;

/** Cấu trúc tệp sao lưu mà người dùng tải về rồi nạp lại. */
export interface ProgressBackup {
  version: number;
  exportedAt: number;
  cards: CardState[];
  reviews: ReviewLogEntry[];
  dailyStats: DailyStat[];
  settings: AppSettings | null;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const PHASES: readonly CardState['phase'][] = ['new', 'learning', 'review', 'relearning'];
const MODES: readonly StudyMode[] = ['flashcards', 'typing', 'listening', 'speaking'];
const VERDICTS: readonly AnswerVerdict[] = ['correct', 'close', 'wrong'];
const RATINGS: readonly Rating[] = [1, 2, 3, 4];
const LEVELS: readonly HskLevel[] = [1, 2, 3];
const DISPLAY_MODES: readonly DisplayMode[] = ['vi-zh', 'en-zh', 'vi-en-zh'];
const THEMES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/** Trả bản sao để nơi gọi sửa thoải mái mà không đụng vào DEFAULT_SETTINGS dùng chung. */
function cloneSettings(settings: AppSettings): AppSettings {
  return { ...settings, activeLevels: [...settings.activeLevels] };
}

/** Lấy giá trị nếu nó nằm trong tập cho phép, không thì lùi về mặc định. */
function oneOfOr<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  for (const option of allowed) {
    if (option === value) {
      return option;
    }
  }
  return fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Số lượng từ và mục tiêu ngày phải hữu hạn và không âm, nếu không giao diện chia cho NaN. */
function countOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function isHskLevel(value: unknown): value is HskLevel {
  return LEVELS.some((level) => level === value);
}

/**
 * Bản lưu trong IndexedDB là dữ liệu lạ: có thể là bản cũ thiếu trường, có thể đã
 * bị ghi đè bằng `undefined`, có thể do một phiên bản khác của ứng dụng ghi vào.
 * Kiểu `AppSettings` hứa với giao diện rằng mọi trường đều có giá trị dùng được,
 * nên phải làm sạch ở đây thay vì tin vào cái kiểu đã khai.
 */
function sanitizeSettings(stored: unknown): AppSettings {
  const raw = isRecord(stored) ? stored : {};
  const levels = Array.isArray(raw.activeLevels) ? raw.activeLevels.filter(isHskLevel) : null;
  return {
    displayMode: oneOfOr(raw.displayMode, DISPLAY_MODES, DEFAULT_SETTINGS.displayMode),
    theme: oneOfOr(raw.theme, THEMES, DEFAULT_SETTINGS.theme),
    hidePinyin: booleanOr(raw.hidePinyin, DEFAULT_SETTINGS.hidePinyin),
    showTraditional: booleanOr(raw.showTraditional, DEFAULT_SETTINGS.showTraditional),
    speechRate: oneOfOr(raw.speechRate, SPEECH_RATES, DEFAULT_SETTINGS.speechRate),
    // `null` là lựa chọn hợp lệ: dùng giọng mặc định của máy.
    preferredVoiceUri: typeof raw.preferredVoiceUri === 'string' ? raw.preferredVoiceUri : null,
    dailyGoal: countOr(raw.dailyGoal, DEFAULT_SETTINGS.dailyGoal),
    newPerDay: countOr(raw.newPerDay, DEFAULT_SETTINGS.newPerDay),
    // Danh sách rỗng là ý muốn thật của người dùng (bỏ chọn hết cấp), giữ nguyên.
    activeLevels: levels ?? [...DEFAULT_SETTINGS.activeLevels],
  };
}

/**
 * `Partial<AppSettings>` cho phép truyền `undefined` mà TypeScript không kêu, nên
 * phải gộp từng trường một: một trường `undefined` nghĩa là "không đổi", không
 * phải "xoá đi". Riêng `preferredVoiceUri` nhận `null` để bỏ chọn giọng đọc.
 */
function mergeDefined(base: AppSettings, patch: Partial<AppSettings>): AppSettings {
  return {
    displayMode: patch.displayMode ?? base.displayMode,
    theme: patch.theme ?? base.theme,
    hidePinyin: patch.hidePinyin ?? base.hidePinyin,
    showTraditional: patch.showTraditional ?? base.showTraditional,
    speechRate: patch.speechRate ?? base.speechRate,
    preferredVoiceUri:
      patch.preferredVoiceUri !== undefined ? patch.preferredVoiceUri : base.preferredVoiceUri,
    dailyGoal: patch.dailyGoal ?? base.dailyGoal,
    newPerDay: patch.newPerDay ?? base.newPerDay,
    activeLevels: [...(patch.activeLevels ?? base.activeLevels)],
  };
}

export async function loadSettings(): Promise<AppSettings> {
  const row = await db.appSettings.get(SETTINGS_KEY);
  return row ? sanitizeSettings(row.value) : cloneSettings(DEFAULT_SETTINGS);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.appSettings.put({ key: SETTINGS_KEY, value: cloneSettings(settings) });
}

export async function patchSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  return db.transaction('rw', db.appSettings, async () => {
    const current = await loadSettings();
    const next = mergeDefined(current, patch);
    await db.appSettings.put({ key: SETTINGS_KEY, value: next });
    return next;
  });
}

/** Xuất toàn bộ tiến độ ra JSON để người dùng sao lưu. */
export async function exportProgress(): Promise<string> {
  const backup = await db.transaction(
    'r',
    [db.cards, db.reviews, db.dailyStats, db.appSettings],
    async (): Promise<ProgressBackup> => {
      const [cards, reviews, dailyStats, row] = await Promise.all([
        db.cards.toArray(),
        db.reviews.toArray(),
        db.dailyStats.toArray(),
        db.appSettings.get(SETTINGS_KEY),
      ]);
      return {
        version: BACKUP_VERSION,
        exportedAt: Date.now(),
        cards,
        reviews,
        dailyStats,
        settings: row ? row.value : null,
      };
    },
  );
  return JSON.stringify(backup);
}

/** Nạp lại tiến độ từ JSON đã xuất. Trả về số bản ghi đã nạp. */
export async function importProgress(
  json: string,
): Promise<{ cards: number; reviews: number; days: number }> {
  const backup = parseBackup(json);
  await db.transaction('rw', [db.cards, db.reviews, db.dailyStats, db.appSettings], async () => {
    // Nạp là thay thế toàn bộ tiến độ, không trộn với dữ liệu đang có để tránh số liệu lai.
    // Riêng cài đặt chỉ bị ghi đè khi tệp có kèm, vì tệp cũ có thể xuất trước lúc người
    // dùng chỉnh cài đặt và không có lý do gì để trả họ về mặc định.
    await Promise.all([db.cards.clear(), db.reviews.clear(), db.dailyStats.clear()]);
    await db.cards.bulkPut(backup.cards);
    await db.reviews.bulkPut(backup.reviews);
    await db.dailyStats.bulkPut(backup.dailyStats);
    if (backup.settings) {
      await db.appSettings.put({ key: SETTINGS_KEY, value: backup.settings });
    }
  });
  return {
    cards: backup.cards.length,
    reviews: backup.reviews.length,
    days: backup.dailyStats.length,
  };
}

// --- Kiểm tra dữ liệu nạp vào -------------------------------------------------
// JSON đến từ tệp người dùng chọn nên phải coi là dữ liệu lạ: kiểm tra từng trường
// thay vì ép kiểu, và báo lỗi tiếng Việt đủ rõ để người dùng biết tệp hỏng chỗ nào.

function invalid(detail: string): Error {
  return new Error(`Tệp sao lưu không hợp lệ: ${detail}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw invalid(`"${field}" phải là một đối tượng`);
  }
  return value;
}

function requireArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw invalid(`"${field}" phải là một danh sách`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalid(`"${field}" phải là một số`);
  }
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw invalid(`"${field}" phải là một chuỗi`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalid(`"${field}" phải là true hoặc false`);
  }
  return value;
}

function requireDay(value: unknown, field: string): string {
  const day = requireString(value, field);
  if (!DAY_PATTERN.test(day)) {
    throw invalid(`"${field}" phải có dạng YYYY-MM-DD`);
  }
  return day;
}

function requireOneOf<T extends string | number>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  for (const option of allowed) {
    if (option === value) {
      return option;
    }
  }
  throw invalid(`"${field}" có giá trị không dùng được`);
}

function toLastMistake(value: unknown, field: string): LastMistake | null {
  if (value === null || value === undefined) {
    return null;
  }
  const raw = requireRecord(value, field);
  return {
    mode: requireOneOf(raw.mode, MODES, `${field}.mode`),
    at: requireNumber(raw.at, `${field}.at`),
    given: requireString(raw.given, `${field}.given`),
    expected: requireString(raw.expected, `${field}.expected`),
    verdict: requireOneOf(raw.verdict, VERDICTS, `${field}.verdict`),
  };
}

function toCard(value: unknown, index: number): CardState {
  const field = `cards[${index}]`;
  const raw = requireRecord(value, field);
  return {
    wordId: requireString(raw.wordId, `${field}.wordId`),
    phase: requireOneOf(raw.phase, PHASES, `${field}.phase`),
    stability: requireNumber(raw.stability, `${field}.stability`),
    difficulty: requireNumber(raw.difficulty, `${field}.difficulty`),
    reps: requireNumber(raw.reps, `${field}.reps`),
    lapses: requireNumber(raw.lapses, `${field}.lapses`),
    correctCount: requireNumber(raw.correctCount, `${field}.correctCount`),
    wrongCount: requireNumber(raw.wrongCount, `${field}.wrongCount`),
    lastReviewedAt:
      raw.lastReviewedAt === null || raw.lastReviewedAt === undefined
        ? null
        : requireNumber(raw.lastReviewedAt, `${field}.lastReviewedAt`),
    dueAt: requireNumber(raw.dueAt, `${field}.dueAt`),
    learningStep: requireNumber(raw.learningStep, `${field}.learningStep`),
    starred: requireBoolean(raw.starred, `${field}.starred`),
    weakestMode:
      raw.weakestMode === null || raw.weakestMode === undefined
        ? null
        : requireOneOf(raw.weakestMode, MODES, `${field}.weakestMode`),
    lastMistake: toLastMistake(raw.lastMistake, `${field}.lastMistake`),
  };
}

function toReview(value: unknown, index: number): ReviewLogEntry {
  const field = `reviews[${index}]`;
  const raw = requireRecord(value, field);
  const entry: ReviewLogEntry = {
    wordId: requireString(raw.wordId, `${field}.wordId`),
    mode: requireOneOf(raw.mode, MODES, `${field}.mode`),
    rating: requireOneOf(raw.rating, RATINGS, `${field}.rating`),
    verdict: requireOneOf(raw.verdict, VERDICTS, `${field}.verdict`),
    usedHint: requireBoolean(raw.usedHint, `${field}.usedHint`),
    at: requireNumber(raw.at, `${field}.at`),
    day: requireDay(raw.day, `${field}.day`),
    elapsedMs: requireNumber(raw.elapsedMs, `${field}.elapsedMs`),
  };
  // Giữ nguyên id cũ để nạp lại không sinh thêm bản ghi trùng nội dung.
  if (raw.id !== undefined && raw.id !== null) {
    entry.id = requireNumber(raw.id, `${field}.id`);
  }
  return entry;
}

function toDailyStat(value: unknown, index: number): DailyStat {
  const field = `dailyStats[${index}]`;
  const raw = requireRecord(value, field);
  return {
    day: requireDay(raw.day, `${field}.day`),
    reviews: requireNumber(raw.reviews, `${field}.reviews`),
    correct: requireNumber(raw.correct, `${field}.correct`),
    newWords: requireNumber(raw.newWords, `${field}.newWords`),
    studyMs: requireNumber(raw.studyMs, `${field}.studyMs`),
  };
}

function toSettings(value: unknown): AppSettings {
  const raw = requireRecord(value, 'settings');
  const levels = requireArray(raw.activeLevels, 'settings.activeLevels').map((level, index) =>
    requireOneOf(level, LEVELS, `settings.activeLevels[${index}]`),
  );
  return {
    displayMode: requireOneOf(raw.displayMode, DISPLAY_MODES, 'settings.displayMode'),
    theme: requireOneOf(raw.theme, THEMES, 'settings.theme'),
    hidePinyin: requireBoolean(raw.hidePinyin, 'settings.hidePinyin'),
    showTraditional: requireBoolean(raw.showTraditional, 'settings.showTraditional'),
    speechRate: requireOneOf(raw.speechRate, SPEECH_RATES, 'settings.speechRate'),
    preferredVoiceUri:
      raw.preferredVoiceUri === null || raw.preferredVoiceUri === undefined
        ? null
        : requireString(raw.preferredVoiceUri, 'settings.preferredVoiceUri'),
    dailyGoal: requireNumber(raw.dailyGoal, 'settings.dailyGoal'),
    newPerDay: requireNumber(raw.newPerDay, 'settings.newPerDay'),
    activeLevels: levels,
  };
}

function parseBackup(json: string): ProgressBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw invalid('nội dung không phải JSON đọc được');
  }
  const root = requireRecord(raw, 'tệp sao lưu');
  const version = requireNumber(root.version, 'version');
  if (version !== BACKUP_VERSION) {
    throw invalid(`phiên bản ${version} không được hỗ trợ, cần phiên bản ${BACKUP_VERSION}`);
  }
  return {
    version,
    exportedAt: typeof root.exportedAt === 'number' ? root.exportedAt : Date.now(),
    cards: requireArray(root.cards, 'cards').map(toCard),
    reviews: requireArray(root.reviews, 'reviews').map(toReview),
    dailyStats: requireArray(root.dailyStats, 'dailyStats').map(toDailyStat),
    settings:
      root.settings === null || root.settings === undefined ? null : toSettings(root.settings),
  };
}
