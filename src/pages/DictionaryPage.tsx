/**
 * Trang tra từ.
 *
 * Toàn bộ phần tìm kiếm nằm trong <DictionarySearch> để hộp trượt tra từ giữa
 * giờ học và trang này luôn tìm giống hệt nhau. Trang chỉ lo phần tiêu đề và bề
 * rộng đọc thoải mái.
 *
 * Không tự lấy tiêu điểm cho ô nhập: trên điện thoại việc đó bật bàn phím ngay
 * khi mở trang và che mất danh sách gợi ý.
 */
import { DictionarySearch } from '../features/dictionary/DictionarySearch.tsx';

export function DictionaryPage() {
  return (
    <div
      className="mx-auto w-full max-w-[46rem] min-w-0"
    >
      <h1
        className="mb-3 text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Tra từ
      </h1>

      <DictionarySearch />
    </div>
  );
}

export default DictionaryPage;
