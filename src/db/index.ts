export { db, DB_NAME, MoiNgayDatabase, resetDatabase } from './database.ts';
export type { SettingsRow } from './database.ts';

export {
  countLearnedByWordIds,
  countStarred,
  getCard,
  getCards,
  getDueCards,
  getNewWordIds,
  getStarredCards,
  getStarredWordIds,
  getTroubleWords,
  saveCard,
  setStar,
  toggleStar,
} from './cards.ts';
export type { StarOptions } from './cards.ts';

export {
  clearSavedLessons,
  countSavedLessons,
  getSavedLessonIds,
  getSavedLessons,
  isLessonSaved,
  saveLesson,
  toggleSavedLesson,
  unsaveLesson,
} from './saved-lessons.ts';
export type { SaveLessonOptions } from './saved-lessons.ts';

export {
  clearLookups,
  countLookups,
  getRecentLookups,
  MAX_LOOKUPS,
  recordLookup,
  recordLookups,
  removeLookup,
} from './lookups.ts';
export type { RecordLookupOptions } from './lookups.ts';

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
