/** Cấp độ HSK 3.0 mà ứng dụng hỗ trợ trong phiên bản này. */
export type HskLevel = 1 | 2 | 3;

/** Nghĩa tiếng Việt đến từ bản dịch máy hay đã được người kiểm duyệt. */
export type TranslationStatus = 'reviewed' | 'machine';

export interface WordExample {
  /** Câu tiếng Trung giản thể. */
  zh: string;
  /** Pinyin của câu, có dấu thanh. */
  pinyin: string;
  vi: string;
  en: string;
}

export interface WordMeanings {
  vi: string[];
  en: string[];
}

export interface WordAliases {
  /** Cách nói tiếng Việt khác cũng được tính là đúng. */
  vi: string[];
  /** Nghĩa tiếng Anh phụ cũng được tính là đúng. */
  en: string[];
  /** Cách đọc khác, ví dụ "shuí" của 谁. */
  pinyin: string[];
}

export interface VocabularyWord {
  /** Mã của từ trong danh sách HSK gốc, ví dụ "L1-0001". */
  id: string;
  simplified: string;
  traditional?: string;
  /** Pinyin có dấu thanh, các âm tiết cách nhau bởi khoảng trắng. */
  pinyin: string;
  /** Pinyin ASCII không dấu thanh, dùng cho tìm kiếm. */
  pinyinPlain: string;
  hskLevel: HskLevel;
  partOfSpeech?: string[];
  meanings: WordMeanings;
  aliases: WordAliases;
  examples: WordExample[];
  /** Mô tả nguồn gốc của bản ghi, hiển thị ở trang Nguồn dữ liệu. */
  source: string;
  datasetVersion: string;
  translationStatus: TranslationStatus;

  // Các trường bổ sung ngoài hợp đồng tối thiểu, đều không bắt buộc.

  /** Cách viết thay thế cũng được tính là đúng, ví dụ "爸" cho "爸爸". */
  writtenVariants?: string[];
  /** Buổi học chứa từ này. */
  lessonId?: string;
}

export interface Lesson {
  /** Mã buổi học, ví dụ "L1-B03". */
  id: string;
  level: HskLevel;
  /** Số thứ tự buổi trong cấp, bắt đầu từ 1. */
  index: number;
  /** Danh sách mã từ thuộc buổi này, khoảng 10 từ. */
  wordIds: string[];
  /** Từ đầu và từ cuối, dùng làm nhãn nhận biết buổi học. */
  range: { from: string; to: string };
}

export interface DatasetSource {
  name: string;
  url: string;
  license: string;
  /** Commit hash hoặc mã phiên bản đã ghim. */
  version: string;
  /** Vai trò của nguồn trong bộ dữ liệu. */
  usedFor: string;
}

export interface DatasetManifest {
  datasetVersion: string;
  /** Ngày nhập dữ liệu, dạng ISO. */
  importedAt: string;
  standard: string;
  totalWords: number;
  levels: { level: HskLevel; words: number; lessons: number; file: string }[];
  sources: DatasetSource[];
  /** Số từ có nghĩa tiếng Việt là bản dịch máy. */
  machineTranslated: number;
  reviewedTranslations: number;
  notes: string[];
}

export interface LevelDataFile {
  level: HskLevel;
  datasetVersion: string;
  words: VocabularyWord[];
  lessons: Lesson[];
}
