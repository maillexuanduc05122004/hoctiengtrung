import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadSettings, patchSettings } from '../../db/index.ts';
import { SettingsContext, type SettingsContextValue } from '../../hooks/settings-context.ts';
import { DEFAULT_SETTINGS, type AppSettings } from '../../types/settings.ts';

const THEME_STORAGE_KEY = 'moingay.theme';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Cung cấp cài đặt ứng dụng cho toàn bộ cây React.
 *
 * Cài đặt nằm trong IndexedDB, riêng chủ đề còn được ghi thêm vào localStorage
 * để đoạn mã nhỏ trong index.html đặt được màu nền ngay khi tải trang, tránh
 * nháy sáng trước khi React chạy.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    let active = true;
    loadSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch((error: unknown) => {
        console.error('Không đọc được cài đặt, dùng giá trị mặc định.', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent): void => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : settings.theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    try {
      if (settings.theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, settings.theme);
    } catch {
      // Trình duyệt chặn lưu trữ thì bỏ qua, chủ đề vẫn hoạt động trong phiên này.
    }
  }, [resolvedTheme, settings.theme]);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    // Cập nhật giao diện ngay rồi mới ghi xuống ổ đĩa, để thao tác không bị khựng.
    setSettings((current) => ({ ...current, ...patch }));
    try {
      const saved = await patchSettings(patch);
      setSettings(saved);
    } catch (error: unknown) {
      console.error('Không lưu được cài đặt.', error);
    }
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, loading, update, resolvedTheme }),
    [settings, loading, update, resolvedTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
