/**
 * Kiểu dữ liệu của phần "Nghe cố định".
 *
 * Mỗi bài là một bộ soạn sẵn, không đổi: nghe lại bao nhiêu lần cũng đúng
 * những mục đó, đúng thứ tự đó. Khác hẳn "Câu của tôi" (rút ngẫu nhiên từ kho
 * trên máy chủ) và "Nghe chép" (hàng đợi ôn tập theo FSRS).
 */

/** Một mục nghe: một từ mới hay một câu ghép. */
export interface FixedListeningItem {
  hanzi: string;
  pinyin: string;
  vi: string;
  /** Chuỗi đưa cho bộ đọc khi khác chữ hiển thị; thiếu thì đọc đúng `hanzi`. */
  speak?: string;
}

export interface FixedListeningSection {
  /** Tên mục, ví dụ "20 từ mới". */
  title: string;
  /** Nhãn đứng trước số thứ tự của từng mục: "Từ mới" thành "Từ mới 01". */
  itemLabel: string;
  items: readonly FixedListeningItem[];
}

export interface FixedListeningLesson {
  title: string;
  /** Vài dòng giới thiệu bài, giữ nguyên từ tệp gốc. */
  notes: readonly string[];
  /** Tốc độ đọc cố định của bài, theo đúng tệp gốc. */
  rate: number;
  sections: readonly FixedListeningSection[];
}

/** Bài đã đăng ký: dữ liệu bài cộng mã và số bài suy ra từ tên tệp `bai-NN.ts`. */
export interface FixedListeningEntry extends FixedListeningLesson {
  id: string;
  number: number;
}
