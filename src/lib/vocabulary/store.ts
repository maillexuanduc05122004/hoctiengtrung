/**
 * Nạp và tra cứu bộ từ vựng.
 *
 * Dữ liệu nằm sẵn trong public/data nên chỉ tải một lần cho mỗi cấp rồi giữ
 * trong bộ nhớ; service worker lo phần dùng lại khi ngoại tuyến. Ứng dụng
 * KHÔNG tải lại dữ liệu từ Internet mỗi lần mở.
 */
import type {
  DatasetManifest,
  HskLevel,
  Lesson,
  LevelDataFile,
  VocabularyWord,
} from '../../types/vocabulary.ts';

const LEVEL_URL = (level: HskLevel): string => `${import.meta.env.BASE_URL}data/hsk-${level}.json`;
const MANIFEST_URL = (): string => `${import.meta.env.BASE_URL}data/manifest.json`;

const levelCache = new Map<HskLevel, Promise<LevelDataFile>>();
let manifestCache: Promise<DatasetManifest> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không tải được dữ liệu từ vựng (${response.status}).`);
  }
  return (await response.json()) as T;
}

/** Nạp dữ liệu của một cấp, dùng lại kết quả đã tải. */
export function loadLevel(level: HskLevel): Promise<LevelDataFile> {
  const cached = levelCache.get(level);
  if (cached) return cached;
  const promise = fetchJson<LevelDataFile>(LEVEL_URL(level)).catch((error: unknown) => {
    // Xoá khỏi cache để lần sau còn thử lại được.
    levelCache.delete(level);
    throw error;
  });
  levelCache.set(level, promise);
  return promise;
}

export function loadManifest(): Promise<DatasetManifest> {
  manifestCache ??= fetchJson<DatasetManifest>(MANIFEST_URL()).catch((error: unknown) => {
    manifestCache = null;
    throw error;
  });
  return manifestCache;
}

export async function loadLevels(levels: readonly HskLevel[]): Promise<LevelDataFile[]> {
  return Promise.all(levels.map(loadLevel));
}

/** Chỉ mục tra cứu dựng từ các cấp đã nạp. */
export interface VocabularyIndex {
  words: VocabularyWord[];
  lessons: Lesson[];
  byId: Map<string, VocabularyWord>;
  byLesson: Map<string, Lesson>;
  levels: HskLevel[];
}

export function buildIndex(files: readonly LevelDataFile[]): VocabularyIndex {
  const words = files.flatMap((f) => f.words);
  const lessons = files.flatMap((f) => f.lessons);
  return {
    words,
    lessons,
    byId: new Map(words.map((w) => [w.id, w])),
    byLesson: new Map(lessons.map((l) => [l.id, l])),
    levels: files.map((f) => f.level),
  };
}

export const EMPTY_INDEX: VocabularyIndex = {
  words: [],
  lessons: [],
  byId: new Map(),
  byLesson: new Map(),
  levels: [],
};

/** Xoá bộ nhớ đệm, chỉ dùng trong kiểm thử. */
export function clearVocabularyCache(): void {
  levelCache.clear();
  manifestCache = null;
}
