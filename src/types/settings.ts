import type { HskLevel } from './vocabulary.ts';

/** Cách hiển thị nghĩa của từ. */
export type DisplayMode = 'vi-zh' | 'en-zh' | 'vi-en-zh';

export type ThemePreference = 'light' | 'dark' | 'system';

/** Tốc độ đọc mẫu được phép chọn. */
export type SpeechRate = 0.7 | 0.85 | 1;

export const SPEECH_RATES: readonly SpeechRate[] = [0.7, 0.85, 1];

export interface AppSettings {
  displayMode: DisplayMode;
  theme: ThemePreference;
  /** Ẩn pinyin ở mặt trước thẻ và trong danh sách. */
  hidePinyin: boolean;
  /** Hiện thêm chữ phồn thể bên cạnh chữ giản thể. */
  showTraditional: boolean;
  /** Tốc độ đọc mặc định. */
  speechRate: SpeechRate;
  /** Giọng đọc tiếng Trung đã chọn, lưu theo `voiceURI`. */
  preferredVoiceUri: string | null;
  /** Mục tiêu số lượt ôn mỗi ngày. */
  dailyGoal: number;
  /** Số từ mới tối đa đưa vào mỗi ngày. */
  newPerDay: number;
  /** Các cấp HSK đang được chọn để học. */
  activeLevels: HskLevel[];
  /**
   * Buổi học mở gần nhất, `null` khi chưa mở buổi nào.
   *
   * Danh sách buổi học dùng nó để mở lại đúng cấp người học đang theo. Lưu mã
   * buổi chứ không lưu riêng số cấp: một giá trị thì không thể tự mâu thuẫn.
   */
  lastLessonId: string | null;
  /**
   * Lần tạo tệp sao lưu gần nhất, `null` khi chưa sao lưu lần nào.
   *
   * Nằm trong cài đặt chứ không trong bảng tiến độ vì nó nói về thói quen của
   * người dùng trên máy này, và vì cài đặt là thứ duy nhất sống sót qua nút
   * "Đặt lại tiến độ" — sau khi đặt lại thì lời nhắc sao lưu không nên hiện lại
   * như thể người dùng chưa từng sao lưu.
   */
  lastBackupAt: number | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  displayMode: 'vi-zh',
  theme: 'system',
  hidePinyin: false,
  showTraditional: false,
  speechRate: 0.85,
  preferredVoiceUri: null,
  dailyGoal: 20,
  newPerDay: 10,
  activeLevels: [1],
  lastLessonId: null,
  lastBackupAt: null,
};
