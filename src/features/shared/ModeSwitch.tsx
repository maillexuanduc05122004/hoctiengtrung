/**
 * Chuyển chế độ luyện mà giữ nguyên phiên đang học.
 *
 * Thanh điều hướng của khung ứng dụng trỏ tới đường dẫn trần (`/go`), nên bấm
 * nó giữa lúc đang luyện buổi 3 là mất luôn buổi 3: trang gõ không thấy tham số
 * `lesson` nên rơi về nguồn "cần ôn" của cả cấp. Hàng chip này mang theo đúng
 * chuỗi truy vấn đang có, nhờ vậy đổi cách luyện không đổi tập từ đang luyện.
 *
 * Đây là điều hướng trong một phiên chứ không phải năm liên kết rời, nên dùng
 * `aria-current="page"` cho chế độ đang mở thay vì `aria-pressed`.
 */
import { Link } from 'react-router';
import { STUDY_NAV } from '../../components/navigation.ts';
import { Icon } from '../../components/ui/Icon.tsx';
import type { StudyMode } from '../../types/study.ts';

/** Đường dẫn của từng chế độ, để biết chip nào đang là chế độ hiện tại. */
const PATH_BY_MODE: Record<StudyMode, string> = {
  flashcards: '/the',
  typing: '/go',
  listening: '/nghe',
  speaking: '/noi',
};

export interface ModeSwitchProps {
  current: StudyMode;
  /**
   * Chuỗi truy vấn mô tả phiên đang học, ví dụ "?level=1,2&pool=due".
   *
   * Bên gọi phải dựng sẵn chuỗi này từ lựa chọn ĐÃ GIẢI, không để ModeSwitch
   * tự lấy `location.search`: mở /the trần thì địa chỉ chưa có tham số nào,
   * mà bốn trang lại có bốn nguồn từ mặc định khác nhau (thẻ và gõ lùi về
   * "cần ôn", nghe và nói lùi về "trộn"). Chuyển một chuỗi rỗng sang trang
   * khác nghĩa là lặng lẽ đổi luôn nguồn từ giữa chừng.
   */
  sessionQuery: string;
}

export function ModeSwitch({ current, sessionQuery }: ModeSwitchProps) {
  const currentPath = PATH_BY_MODE[current];

  return (
    /* Đệm rồi kéo lại bằng margin âm: cuộn ngang cắt mất phần tràn, mà vòng tiêu
       điểm được vẽ 0,125rem BÊN NGOÀI chip nên không có đệm là nó biến mất. */
    <nav
      aria-label="Đổi cách luyện, giữ nguyên tập từ"
      className="-mx-1 -my-1 min-w-0 overflow-x-auto px-1 py-1"
    >
      <ul
        className="m-0 flex list-none items-center p-0 space-x-1.5"
      >
        {STUDY_NAV.map((item) => {
          const active = item.to === currentPath;
          return (
            <li
              key={item.to}
              className="shrink-0"
            >
              <Link
                to={`${item.to}${sessionQuery}`}
                aria-current={active ? 'page' : undefined}
                className={[
                  'tap inline-flex items-center border px-3 py-1.5 no-underline',
                  'rounded-[0.375rem] text-[0.8125rem] font-medium transition-colors duration-150',
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className="mr-1.5 shrink-0"
                >
                  <Icon name={item.icon} size={1} />
                </span>
                {item.shortLabel ?? item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
