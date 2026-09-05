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
};
