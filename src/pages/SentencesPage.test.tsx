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
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { SentencesPage } from './SentencesPage.tsx';
import { MY_SENTENCES, MY_WORDS } from '../features/sentences/corpus.ts';

beforeEach(() => {
  localStorage.clear();
});

describe('trang Câu của tôi', () => {
  it('mở ra ở bảng từ vựng với đủ số từ', () => {
    render(<SentencesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Câu của tôi' })).toBeInTheDocument();
    expect(screen.getByText(`${MY_WORDS.length} từ bạn đã học và ${MY_SENTENCES.length} câu ghép từ chính những từ đó.`)).toBeInTheDocument();
    // Một từ ở nhóm đầu và một từ ở nhóm cuối, để chắc là dựng hết chứ không cắt.
    expect(screen.getByText('开车')).toBeInTheDocument();
    expect(screen.getByText('水果')).toBeInTheDocument();
  });

  it('phần nghe câu không lộ chữ Hán, pinyin hay nghĩa khi vừa mở', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    expect(screen.queryByText('现在几点？')).not.toBeInTheDocument();
    expect(screen.queryByText('Xiànzài jǐ diǎn?')).not.toBeInTheDocument();
    expect(screen.queryByText('Bây giờ mấy giờ?')).not.toBeInTheDocument();
    // Nhưng nút phát thì phải có, mỗi câu một nút.
    expect(screen.getAllByRole('button', { name: /Nghe câu/ })).toHaveLength(MY_SENTENCES.length);
  });

  it('mở riêng từng phần của một câu', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    await user.click(screen.getAllByRole('button', { name: 'Hiện Chữ Hán' })[0]);
    expect(screen.getByText('现在几点？')).toBeInTheDocument();
    // Mở chữ Hán KHÔNG được kéo theo nghĩa, nếu không thì mất chỗ để đoán.
    expect(screen.queryByText('Bây giờ mấy giờ?')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Hiện Nghĩa' })[0]);
    expect(screen.getByText('Bây giờ mấy giờ?')).toBeInTheDocument();
  });

  it('"Hiện hết" mở cả ba phần của mọi câu', async () => {
    const user = userEvent.setup();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    await user.click(screen.getByRole('radio', { name: 'Hiện hết' }));

    expect(screen.getByText('现在几点？')).toBeInTheDocument();
    expect(screen.getByText('Xiànzài jǐ diǎn?')).toBeInTheDocument();
    expect(screen.getByText('Bây giờ mấy giờ?')).toBeInTheDocument();
  });

  it('thêm câu dán vào và giữ lại sau khi dựng lại trang', async () => {
    const user = userEvent.setup();
    const view = render(<SentencesPage />);

    await user.click(screen.getByRole('radio', { name: 'Thêm câu' }));
    await user.click(screen.getByLabelText('Dán câu do AI tạo'));
    await user.paste('他很忙。 | Tā hěn máng. | Anh ấy rất bận.');

    await user.click(screen.getByRole('button', { name: /Thêm 1 câu/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã thêm 1 câu.');

    // Thêm xong thì nhảy sang phần nghe để dùng được ngay.
    await user.click(screen.getByRole('radio', { name: 'Hiện hết' }));
    expect(screen.getByText('他很忙。')).toBeInTheDocument();

    view.unmount();
    render(<SentencesPage />);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Nghe câu/ })).toHaveLength(
        MY_SENTENCES.length + 1,
      ),
    );
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
