/**
 * Bộ biểu tượng nét mảnh, vẽ trực tiếp bằng SVG để không phải tải thêm tệp và
 * để nét luôn khớp với độ dày đường kẻ của giao diện.
 */

export type IconName =
  | 'card'
  | 'keyboard'
  | 'ear'
  | 'mic'
  | 'search'
  | 'chart'
  | 'settings'
  | 'home'
  | 'book'
  | 'volume'
  | 'volume-slow'
  | 'star'
  | 'star-filled'
  | 'check'
  | 'close'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'arrow-right'
  | 'eye'
  | 'eye-off'
  | 'refresh'
  | 'plus'
  | 'info'
  | 'flip'
  | 'lightbulb'
  | 'stop';

const PATHS: Record<IconName, string> = {
  card: 'M3 6.5h13.5v11H3zM6.5 3.5H21v11',
  keyboard: 'M2.5 6.5h19v11h-19zM6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M8 13.5h8M18 13.5h.01',
  ear: 'M8 8a4 4 0 1 1 8 0c0 2.5-2.5 3-3.2 4.6-.5 1.2-.3 2.4-1.6 3.2M12 19.5a3 3 0 0 1-3-3',
  mic: 'M12 3.5a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-5 0V6A2.5 2.5 0 0 1 12 3.5zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3M8.5 20.5h7',
  search: 'M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM15.6 15.6 20.5 20.5',
  chart: 'M3.5 20.5h17M6.5 17V9.5M11 17V4.5M15.5 17v-6M20 17v-9',
  settings: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2.5l1.3 2.6 2.9-.5 1 2.7 2.6 1.3-.5 2.9.5 2.9-2.6 1.3-1 2.7-2.9-.5L12 21.5l-1.3-2.6-2.9.5-1-2.7-2.6-1.3.5-2.9-.5-2.9 2.6-1.3 1-2.7 2.9.5z',
  home: 'M3.5 10.5 12 3.5l8.5 7M6 9.5v11h12v-11M10 20.5v-6h4v6',
  book: 'M4 4.5h6a2.5 2.5 0 0 1 2 1 2.5 2.5 0 0 1 2-1h6v14h-6a2.5 2.5 0 0 0-2 1 2.5 2.5 0 0 0-2-1H4zM12 5.5v14',
  volume: 'M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM15.5 9.5a4 4 0 0 1 0 5M18 7a7.5 7.5 0 0 1 0 10',
  'volume-slow': 'M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM15.5 9.5a4 4 0 0 1 0 5',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9 6.7 19.7l1.1-5.9-4.3-4.1 5.9-.8z',
  'star-filled': 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9 6.7 19.7l1.1-5.9-4.3-4.1 5.9-.8z',
  check: 'M4.5 12.5l5 5 10-11',
  close: 'M5.5 5.5l13 13M18.5 5.5l-13 13',
  'chevron-right': 'M9.5 5.5l7 6.5-7 6.5',
  'chevron-left': 'M14.5 5.5l-7 6.5 7 6.5',
  'chevron-down': 'M5.5 9.5l6.5 7 6.5-7',
  'arrow-right': 'M4.5 12h15M13.5 6l6 6-6 6',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'eye-off': 'M4 4l16 16M9.9 5.9A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4M6.3 8.1A17 17 0 0 0 2.5 12S6 18.5 12 18.5c.9 0 1.7-.1 2.5-.4M9.9 9.9a3 3 0 0 0 4.2 4.2',
  refresh: 'M20 12a8 8 0 1 1-2.4-5.7M20.5 3.5v5h-5',
  plus: 'M12 5v14M5 12h14',
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 11v5.5M12 7.6h.01',
  flip: 'M8 4.5H5.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H8M16 4.5h2.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H16M12 2.5v19',
  lightbulb: 'M12 3.5a5.5 5.5 0 0 0-3.2 10c.5.4.7 1 .7 1.6v.4h5v-.4c0-.6.2-1.2.7-1.6A5.5 5.5 0 0 0 12 3.5zM9.5 19h5M10.5 21.5h3',
  stop: 'M7 7h10v10H7z',
};

const FILLED: ReadonlySet<IconName> = new Set(['star-filled', 'stop']);

export interface IconProps {
  name: IconName;
  /** Cỡ tính bằng rem. */
  size?: number;
  className?: string;
}

export function Icon({ name, size = 1.25, className }: IconProps) {
  const filled = FILLED.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={`${size}rem`}
      height={`${size}rem`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
