import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { AppSettings } from '../types/settings.ts';
import type { CardState, DailyStat, ReviewLogEntry } from '../types/study.ts';

/** Bảng cài đặt chỉ chứa đúng một dòng nên cần một khoá cố định. */
export interface SettingsRow {
  key: string;
  value: AppSettings;
}

export const DB_NAME = 'moi-ngay-zhongwen';

export class MoiNgayDatabase extends Dexie {
  cards!: Table<CardState, string>;
  reviews!: Table<ReviewLogEntry, number>;
  dailyStats!: Table<DailyStat, string>;
  appSettings!: Table<SettingsRow, string>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores({
      // `starred` là boolean nên IndexedDB không lập chỉ mục được, các hàm đọc phải tự lọc.
      cards: 'wordId, phase, dueAt, starred, [phase+dueAt]',
      reviews: '++id, wordId, day, at, mode',
      dailyStats: 'day',
      appSettings: 'key',
    });
  }
}

export const db = new MoiNgayDatabase();

/** Xoá sạch dữ liệu, dùng cho nút đặt lại tiến độ và cho test. */
export async function resetDatabase(): Promise<void> {
  // Mở sẵn để lần gọi đầu tiên trong test không chạy vào cơ sở dữ liệu chưa khởi tạo.
  if (!db.isOpen()) {
    await db.open();
  }
  await db.transaction('rw', [db.cards, db.reviews, db.dailyStats, db.appSettings], async () => {
    await Promise.all([
      db.cards.clear(),
      db.reviews.clear(),
      db.dailyStats.clear(),
      db.appSettings.clear(),
    ]);
  });
}
