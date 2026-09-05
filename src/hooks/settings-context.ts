import { createContext, useContext } from 'react';
import type { AppSettings } from '../types/settings.ts';
import { DEFAULT_SETTINGS } from '../types/settings.ts';

export interface SettingsContextValue {
  settings: AppSettings;
  /** `true` khi còn đang đọc cài đặt từ IndexedDB. */
  loading: boolean;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  /** Chủ đề đang áp dụng thật sự sau khi quy đổi lựa chọn "theo hệ thống". */
  resolvedTheme: 'light' | 'dark';
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  update: async () => undefined,
  resolvedTheme: 'light',
});

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
