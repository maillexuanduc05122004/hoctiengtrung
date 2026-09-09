import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { AppSettings } from '../types/settings.ts';
import type {
  CardState,
  DailyStat,
  LookupEntry,
  ReviewLogEntry,
  SavedLesson,
} from '../types/study.ts';

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
  lookups!: Table<LookupEntry, string>;
  savedLessons!: Table<SavedLesson, string>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores({
      // `starred` là boolean nên IndexedDB không lập chỉ mục được, các hàm đọc phải tự lọc.
      cards: 'wordId, phase, dueAt, starred, [phase+dueAt]',
      reviews: '++id, wordId, day, at, mode',
      dailyStats: 'day',
      appSettings: 'key',
    });
    // Phiên bản 2 thêm lịch sử tra từ. Chỉ khai bảng mới: bảng nào không nhắc lại
    // thì Dexie giữ nguyên lược đồ của phiên bản trước, dữ liệu cũ không mất.
    this.version(2).stores({
      lookups: 'wordId, at',
    });
    // Phiên bản 3 thêm danh sách buổi học đã lưu. `at` có chỉ mục để sổ tay xếp
    // buổi mới lưu lên đầu mà không phải đọc cả bảng rồi sắp trong bộ nhớ.
    this.version(3).stores({
      savedLessons: 'lessonId, at',
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
  await db.transaction(
    'rw',
    [db.cards, db.reviews, db.dailyStats, db.appSettings, db.lookups, db.savedLessons],
    async () => {
      await Promise.all([
        db.cards.clear(),
        db.reviews.clear(),
        db.dailyStats.clear(),
        db.appSettings.clear(),
        db.lookups.clear(),
        db.savedLessons.clear(),
      ]);
    },
  );
}
