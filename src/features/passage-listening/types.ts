/**
 * Kiểu dữ liệu của phần "Nghe đoạn văn".
 *
 * Mỗi bài là một câu chuyện ngắn chia vài đoạn, soạn từ đúng những từ người học
 * đã có (300 từ nền và các bài nghe cố định). Nghe như một bài nghe bình thường:
 * đọc hết một đoạn, nghỉ một lúc cho người học kịp nghĩ, rồi tự sang đoạn sau.
 */

/** Một câu trong đoạn. Đọc và tô sáng theo từng câu. */
export interface PassageSentence {
  hanzi: string;
  pinyin: string;
  vi: string;
}

export interface PassageParagraph {
  sentences: readonly PassageSentence[];
}

/** Một từ đã học xuất hiện trong bài, hiện ở danh sách ôn lại cuối trang. */
export interface PassageWord {
  hanzi: string;
  pinyin: string;
  vi: string;
}

export interface Passage {
  /** Tên bài bằng chữ Hán, đọc to được. */
  title: string;
  titlePinyin: string;
  titleVi: string;
  /** Nhãn trình độ ước chừng, ví dụ "HSK 1–2". */
  level: string;
  /** Số giây nghỉ sau mỗi đoạn trước khi tự sang đoạn sau. */
  pauseSeconds: number;
  paragraphs: readonly PassageParagraph[];
  words: readonly PassageWord[];
}

/** Bài đã đăng ký: dữ liệu bài cộng mã và số bài suy ra từ tên tệp `bai-NN.ts`. */
export interface PassageEntry extends Passage {
  id: string;
  number: number;
}
