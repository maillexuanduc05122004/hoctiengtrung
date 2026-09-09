import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { MAIN_NAV, SECONDARY_NAV, STUDY_NAV, type NavItem } from './navigation.ts';
import { Icon } from './ui/Icon.tsx';

/**
 * Khung ứng dụng.
 *
 * Trên điện thoại: thanh tiêu đề dính trên cùng và thanh điều hướng năm đích
 * đến dính dưới cùng. Trên máy tính: cột điều hướng bên trái và vùng nội dung
 * rộng, không phải bản phóng to của giao diện điện thoại.
 *
 * Thanh dưới cùng mang các ĐÍCH ĐẾN chứ không mang bốn chế độ luyện tập. Bốn
 * chế độ là công cụ: vào thẳng chúng từ thanh điều hướng là rơi vào một hàng đợi
 * không ai chọn. Chúng có mặt ở nơi đã biết mình luyện từ nào — trang buổi học,
 * sổ tay, và hàng đổi chế độ ngay trong phiên.
 */
export function AppShell() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  /*
    Đổi trang thì đưa cửa sổ về đầu và trả tiêu điểm về vùng nội dung.

    React Router không tự làm việc này. Hậu quả thấy rõ nhất ở danh sách buổi
    học: mở buổi 42 từ cuối một trang đã cuộn sâu thì trang chi tiết cũng mở ra
    ở đúng độ cao đó, tức là ở giữa danh sách từ. Người dùng bàn phím và trình
    đọc màn hình còn tệ hơn: tiêu điểm vẫn nằm ở liên kết vừa bấm, thuộc về một
    trang không còn tồn tại.

    Trang có neo trong địa chỉ (`#buoi-42`) thì không đụng tới: chính trang đó
    sẽ tự cuộn tới neo.
  */
  useEffect(() => {
    // Trang có neo thì để chính trang đó cuộn tới neo, nhưng tiêu điểm vẫn phải
    // rời khỏi liên kết của trang cũ — `preventScroll` giữ cho việc đó không
    // kéo màn hình về đầu và phá mất cú cuộn tới neo.
    if (location.hash === '') window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);

  return (
    <div
      className="min-h-dvh bg-paper"
    >
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:border focus:border-line-strong focus:bg-surface focus:px-3 focus:py-2"
      >
        Bỏ qua phần điều hướng
      </a>

      <div
        className="mx-auto flex w-full max-w-[78rem]"
      >
        {/* Cột điều hướng chỉ có trên máy tính. */}
        <aside
          className="sticky top-0 h-dvh w-[15rem] shrink-0 overflow-y-auto border-r border-line px-3 py-5 xsm:hidden"
        >
          <NavLink
            to="/"
            className="mb-6 flex items-baseline px-2 no-underline"
          >
            <span
              className="text-[1.0625rem] font-semibold tracking-tight text-ink"
            >
              Mỗi Ngày
            </span>
            <span
              className="han ml-1.5 text-[1.0625rem] text-cinnabar"
            >
              中文
            </span>
          </NavLink>

          <SidebarGroup
            title="Học"
            items={MAIN_NAV}
          />
          <div
            className="my-4 border-t border-line"
          />
          <SidebarGroup
            title="Cách luyện"
            items={STUDY_NAV}
          />
          <div
            className="my-4 border-t border-line"
          />
          <SidebarGroup
            title="Khác"
            items={SECONDARY_NAV}
          />

          <NavLink
            to="/nguon-du-lieu"
            className="mt-6 block px-2 text-[0.75rem] text-ink-faint underline underline-offset-2 hover:text-ink-soft"
          >
            Nguồn dữ liệu
          </NavLink>
        </aside>

        <div
          className="min-w-0 flex-1"
        >
          {/* Thanh tiêu đề chỉ có trên điện thoại. */}
          <header
            className="hidden border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur-sm xsm:sticky xsm:top-0 xsm:z-30 xsm:flex xsm:items-center xsm:justify-between"
          >
            <NavLink
              to="/"
              className="flex items-baseline no-underline"
            >
              <span
                className="text-[1rem] font-semibold tracking-tight text-ink"
              >
                Mỗi Ngày
              </span>
              <span
                className="han ml-1 text-[1rem] text-cinnabar"
              >
                中文
              </span>
            </NavLink>
            <nav
              aria-label="Điều hướng phụ"
              className="flex items-center space-x-0.5"
            >
              {SECONDARY_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  title={item.label}
                  className={({ isActive }) =>
                    [
                      'tap inline-flex items-center justify-center rounded-[0.375rem] transition-colors duration-150',
                      isActive ? 'text-cinnabar' : 'text-ink-faint hover:text-ink-soft',
                    ].join(' ')
                  }
                >
                  <Icon name={item.icon} size={1.1875} />
                </NavLink>
              ))}
            </nav>
          </header>

          {/*
            `tabIndex={-1}` để liên kết "Bỏ qua phần điều hướng" thật sự đưa được
            tiêu điểm tới đây: nhảy tới một phần tử không nhận tiêu điểm thì
            trình duyệt chỉ cuộn, còn phím Tab tiếp theo vẫn quay về thanh điều
            hướng vừa bỏ qua. Đây cũng là chỗ nhận tiêu điểm sau mỗi lần đổi trang.
          */}
          <main
            id="noi-dung"
            ref={mainRef}
            tabIndex={-1}
            className="px-6 pt-6 pb-16 focus:outline-none xsm:px-4 xsm:pt-4 xsm:pb-[calc(4.75rem+env(safe-area-inset-bottom))]"
          >
            <Outlet key={location.pathname} />
          </main>
        </div>
      </div>

      {/* Năm đích đến chính, chỉ hiện trên điện thoại. */}
      <nav
        aria-label="Điều hướng chính"
        className="hidden xsm:fixed xsm:right-0 xsm:bottom-0 xsm:left-0 xsm:z-30 xsm:grid xsm:grid-cols-5 xsm:border-t xsm:border-line xsm:bg-surface xsm:pb-[env(safe-area-inset-bottom)]"
      >
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex min-h-[3.5rem] flex-col items-center justify-center px-0.5 py-1.5 no-underline transition-colors duration-150',
                isActive ? 'text-cinnabar' : 'text-ink-faint',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={isActive && item.icon === 'star' ? 'star-filled' : item.icon} size={1.3125} />
                <span
                  className={[
                    'mt-0.5 text-center text-[0.6875rem] leading-tight',
                    isActive ? 'font-semibold' : 'font-medium',
                  ].join(' ')}
                >
                  {item.shortLabel ?? item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SidebarGroup({ title, items }: { title: string; items: readonly NavItem[] }) {
  return (
    <nav
      aria-label={title}
    >
      <p
        className="mb-1.5 px-2 text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
      >
        {title}
      </p>
      <ul
        className="space-y-0.5"
      >
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'tap flex items-center rounded-[0.375rem] px-2 py-2 text-[0.9375rem] no-underline transition-colors duration-150',
                  isActive
                    ? 'bg-sunken font-semibold text-ink'
                    : 'font-medium text-ink-soft hover:bg-sunken hover:text-ink',
                ].join(' ')
              }
            >
              <span
                className="mr-2.5 shrink-0"
              >
                <Icon name={item.icon} size={1.125} />
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
