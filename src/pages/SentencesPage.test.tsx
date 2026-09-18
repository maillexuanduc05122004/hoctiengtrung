/**
 * Dựng thật trang "Câu của tôi".
 *
 * Trọng tâm là lời hứa dễ vỡ nhất của trang: mở lên thì KHÔNG được thấy chữ Hán,
 * pinyin hay nghĩa — chỉ có nút phát. Một lần lỡ tay đổi giá trị mặc định là
 * người học mất luôn phần đoán, mà nhìn mã nguồn thì không thấy ngay.
 *
 * jsdom không có `speechSynthesis`, nên các nút nghe dựng ra ở trạng thái vô
 * hiệu. Đó đúng là điều cần kiểm: thiết bị không đọc được thì trang vẫn phải
 * dựng xong chứ không vỡ.
 *
 * Bộ câu rút ngẫu nhiên nên test nào cần một câu cụ thể thì thu hẹp bằng ô tìm
 * trước; test nào kiểm chính việc rút thì làm việc với tập hợp. Không dùng
 * "Tất cả" để lấy một câu: tra theo tên nút trên 90 thẻ trong jsdom chậm tới
 * mức vượt hạn 5 giây khi chạy song song.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SentencesPage } from './SentencesPage.tsx';
import { MY_SENTENCES, MY_WORDS } from '../features/sentences/corpus.ts';

beforeEach(() => {
  localStorage.clear();
  // jsdom không có scrollIntoView; đổi bộ câu thì trang cuộn lên đầu nên cần hàm giả.
  Element.prototype.scrollIntoView = vi.fn();
});

/**
 * Toàn bộ chữ đang có trên trang, lấy một lần.
 *
 * Phần chưa mở KHÔNG được dựng ra (điều kiện trong JSX, không phải ẩn bằng
 * CSS), nên so chuỗi trên `textContent` là đủ đúng — và rẻ hơn hẳn 90 lần
 * `queryByText`, mỗi lần duyệt lại cả DOM.
 */
function pageText(): string {
  return document.body.textContent ?? '';
}

/**
 * Chữ Hán của những câu đang mở, đọc đúng từng phần tử.
 *
 * Không so chuỗi con trên cả trang được: "多少钱？" nằm gọn trong "苹果多少钱？"
 * nên sẽ đếm thừa.
 */
function shownHanzi(): Set<string> {
  const nodes = document.querySelectorAll('article p[lang="zh-CN"]');
  return new Set([...nodes].map((node) => node.textContent ?? ''));
}

describe('trang Câu của tôi', () => {
  it('mở ra ở bảng từ vựng với đủ số từ', () => {
    render(<SentencesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Câu của tôi' })).toBeInTheDocument();
    expect(
      screen.getByText(
        `${MY_WORDS.length} từ bạn đã học và ${MY_SENTENCES.length} câu ghép từ chính những từ đó.`,
      ),
    ).toBeInTheDocument();
    // Một từ ở nhóm đầu và một từ ở nhóm cuối, để chắc là dựng hết chứ không cắt.
    expect(screen.getByText('开车')).toBeInTheDocument();
    expect(screen.getByText('水果')).toBeInTheDocument();
  });

  it('ô tìm lọc bảng từ theo chữ Hán, pinyin hoặc nghĩa không dấu', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);

    // Không dấu nên "mua" khớp cả "mua" (买) lẫn "mưa" (下雨) — đúng ý, vì người
    // học gõ điện thoại thường bỏ dấu.
    await user.type(screen.getByRole('searchbox', { name: 'Tìm từ' }), 'mua');
    expect(screen.getByText('买')).toBeInTheDocument();
    expect(screen.getByText('下雨')).toBeInTheDocument();
    expect(screen.queryByText('开车')).not.toBeInTheDocument();
    expect(screen.getByText('2 từ khớp.')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Tìm từ' }));
    await user.type(screen.getByRole('searchbox', { name: 'Tìm từ' }), 'xianzai');
    expect(screen.getByText('现在')).toBeInTheDocument();
  });

  it('phần nghe câu mở ra một bộ 20 câu, không lộ chữ Hán, pinyin hay nghĩa', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    expect(screen.getAllByRole('article')).toHaveLength(20);
    expect(shownHanzi().size).toBe(0);
    const text = pageText();
    for (const sentence of MY_SENTENCES) {
      expect(text, sentence.hanzi).not.toContain(sentence.pinyin);
      expect(text, sentence.hanzi).not.toContain(sentence.vi);
    }
  });

  it('"Đổi câu khác" cho ra bộ không trùng câu nào với bộ trước', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    await user.click(screen.getByRole('radio', { name: 'Hiện hết' }));

    const before = shownHanzi();
    expect(before.size).toBe(20);

    await user.click(screen.getAllByRole('button', { name: /Đổi/ })[0]);
    const after = shownHanzi();
    expect(after.size).toBe(20);
    for (const hanzi of after) expect(before.has(hanzi)).toBe(false);
  });

  it('đổi cỡ bộ thì rút lại đúng số câu, "Tất cả" thì hiện hết', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    await user.click(screen.getByRole('radio', { name: '10' }));
    expect(screen.getAllByRole('article')).toHaveLength(10);

    await user.click(screen.getByRole('radio', { name: 'Tất cả' }));
    expect(screen.getAllByRole('article')).toHaveLength(MY_SENTENCES.length);
    // Hiện cả kho thì không còn gì để "đổi".
    expect(screen.getByRole('button', { name: 'Đổi câu khác' })).toBeDisabled();
    // Test này cố ý dựng đủ 90 thẻ nên cần hạn rộng hơn mặc định.
  }, 15_000);

  it('mở riêng từng phần của một câu', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    // Thu hẹp bằng ô tìm để câu đầu chắc chắn là 现在几点？ mà không phải dựng
    // cả 90 thẻ — tra theo role trên 90 thẻ trong jsdom chậm tới mức vượt hạn.
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '现在几点');

    await user.click(screen.getAllByRole('button', { name: 'Hiện Chữ Hán' })[0]);
    expect(screen.getByText('现在几点？')).toBeInTheDocument();
    // Mở chữ Hán KHÔNG được kéo theo nghĩa, nếu không thì mất chỗ để đoán.
    expect(screen.queryByText('Bây giờ mấy giờ?')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Hiện Nghĩa' })[0]);
    expect(screen.getByText('Bây giờ mấy giờ?')).toBeInTheDocument();
  });

  it('ô tìm hiện mọi câu khớp, bỏ qua bộ ngẫu nhiên', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    const expected = MY_SENTENCES.filter((sentence) => sentence.hanzi.includes('现在')).length;
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '现在');
    expect(screen.getAllByRole('article')).toHaveLength(expected);
    // Tìm không được lộ nội dung: vẫn phải bấm mới thấy chữ.
    expect(shownHanzi().size).toBe(0);
  });

  it('thêm câu dán vào và giữ lại sau khi dựng lại trang', async () => {
    const user = userEvent.setup();
    const view = render(<SentencesPage />);

    await user.click(screen.getByRole('radio', { name: 'Thêm câu' }));
    await user.click(screen.getByLabelText('Dán câu do AI tạo'));
    await user.paste('他很忙。 | Tā hěn máng. | Anh ấy rất bận.');

    await user.click(screen.getByRole('button', { name: /Thêm 1 câu/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã thêm 1 câu.');

    // Thêm xong thì nhảy sang phần nghe để dùng được ngay; câu mới tìm được như
    // mọi câu khác.
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '他很忙');
    await user.click(screen.getByRole('radio', { name: 'Hiện hết' }));
    expect(screen.getByText('他很忙。')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);

    view.unmount();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '他很忙');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
  });

  it('không thêm câu đã có sẵn', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);

    await user.click(screen.getByRole('radio', { name: 'Thêm câu' }));
    await user.click(screen.getByLabelText('Dán câu do AI tạo'));
    await user.paste('现在几点？ | Xiànzài jǐ diǎn? | Bây giờ mấy giờ?');
    await user.click(screen.getByRole('button', { name: /Thêm 1 câu/ }));

    expect(await screen.findByRole('status')).toHaveTextContent('1 câu đã có sẵn nên bỏ qua.');
  });
});
