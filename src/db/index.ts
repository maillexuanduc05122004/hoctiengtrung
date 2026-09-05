export { db, DB_NAME, MoiNgayDatabase, resetDatabase } from './database.ts';
export type { SettingsRow } from './database.ts';

export {
  countLearnedByWordIds,
  getCard,
  getCards,
  getDueCards,
  getNewWordIds,
  getStarredWordIds,
  getTroubleWords,
  saveCard,
  toggleStar,
} from './cards.ts';

export {
  countByMode,
  dayKey,
  getDailyStat,
  getRecentDays,
  getStreak,
  recordReview,
  shiftDay,
} from './reviews.ts';

export {
  BACKUP_VERSION,
  exportProgress,
  importProgress,
  loadSettings,
  patchSettings,
  saveSettings,
  SETTINGS_KEY,
} from './settings.ts';
export type { ProgressBackup } from './settings.ts';
