/**
 * Dựng thật trang "Câu của tôi" với máy chủ giả.
 *
 * Trọng tâm vẫn là lời hứa dễ vỡ nhất của trang: mở phần nghe thì KHÔNG được
 * thấy chữ Hán, pinyin hay nghĩa — chỉ có nút phát. Cộng thêm các lời hứa kể
 * từ khi trang nối máy chủ: chưa đăng nhập thì tự vào bằng tài khoản khách
 * 1111 và chỉ khi không vào được mới hiện ô đăng nhập; đang là khách thì có
 * nút chuyển sang tài khoản 2222; nút AI khoá khi máy chủ chưa bật AI; và bấm
 * "Tạo bằng AI" thì gửi đúng số câu, đúng cấp người học đã chọn.
 *
 * `endpoints.ts` được giả lập nguyên tệp nên không có yêu cầu mạng nào; dữ liệu
 * mẫu lấy từ `corpus.ts` (89 từ, 90 câu) để bộ câu ngẫu nhiên có cùng kích cỡ
 * với dữ liệu thật. `useAuth` được giả bằng một kho nhỏ có đăng ký lắng nghe,
 * để `login`/`logout` giả đổi được trạng thái và trang vẽ lại như với provider
 * thật.
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
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SentencesPage } from './SentencesPage.tsx';
import { MY_SENTENCES, MY_WORDS } from '../features/sentences/corpus.ts';
import type { AuthUser } from '../lib/api/auth.ts';
import type {
  AiStatus,
  ImportPreviewResponse,
  Sentence,
  UserWord,
} from '../lib/api/types.ts';

const OWNER: AuthUser = {
  id: 1,
  email: '2222@hoctiengtrung.vn',
  username: '2222',
  displayName: 'Tôi',
  roles: ['ROLE_ADMIN'],
  currentHskLevel: 1,
};

const GUEST: AuthUser = {
  id: 2,
  email: '1111@hoctiengtrung.vn',
  username: '1111',
  displayName: 'Khách',
  roles: ['ROLE_USER'],
  currentHskLevel: 1,
};

/**
 * Kho phiên giả: đổi người dùng thì báo cho mọi bên đang nghe, để trang vẽ lại
 * đúng như khi `AuthProvider` thật đổi trạng thái sau `login`/`logout`.
 */
const auth = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let user: AuthUser | null = null;
  return {
    login: vi.fn<(username: string, password: string) => Promise<void>>(),
    logout: vi.fn<() => Promise<void>>(),
    getUser: () => user,
    setUser(next: AuthUser | null): void {
      user = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
});

vi.mock('../hooks/useAuth.ts', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useAuth: () => {
      const user = useSyncExternalStore(auth.subscribe, auth.getUser);
      return {
        user,
        status: user === null ? 'anonymous' : 'authenticated',
        login: auth.login,
        logout: auth.logout,
        isAdmin: user !== null && user.roles.includes('ROLE_ADMIN'),
      };
    },
  };
});

const api = vi.hoisted(() => ({
  listMyWords: vi.fn(),
  deleteMyWord: vi.fn(),
  previewImport: vi.fn(),
  confirmImport: vi.fn(),
  listSentences: vi.fn(),
  addSentences: vi.fn(),
  deleteSentence: vi.fn(),
  deleteSentencesBySource: vi.fn(),
  generateSentences: vi.fn(),
  aiStatus: vi.fn(),
}));

vi.mock('../lib/api/endpoints.ts', () => api);

const LOGIN_DESCRIPTION =
  'Phần này lưu từ bạn đã học trên máy chủ và dùng AI viết câu mới, nên cần đăng nhập.';

/** 89 từ mẫu, học cách nhau một phút để nhóm "mới nhất" có thứ tự xác định. */
const WORDS: UserWord[] = MY_WORDS.map((word, i) => ({
  id: i + 1,
  wordId: 1000 + i,
  simplified: word.hanzi,
  traditional: word.hanzi,
  pinyin: word.pinyin,
  meaningVi: word.vi,
  hskLevel: 1,
  status: 'LEARNED',
  learnedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
}));

const SENTENCES: Sentence[] = MY_SENTENCES.map((sentence, i) => ({
  id: i + 1,
  hanzi: sentence.hanzi,
  pinyin: sentence.pinyin,
  meaningVi: sentence.vi,
  level: sentence.level,
  source: 'BUILTIN',
  createdAt: '2026-01-01T00:00:00Z',
}));

const AI_ON: AiStatus = { enabled: true, model: 'claude-opus-5' };
const AI_OFF: AiStatus = { enabled: false, model: '', reason: 'Chưa cấu hình ANTHROPIC_API_KEY' };

function aiSentence(id: number, hanzi: string, pinyin: string, meaningVi: string): Sentence {
  return { id, hanzi, pinyin, meaningVi, level: 1, source: 'AI', createdAt: '2026-02-01T00:00:00Z' };
}

beforeEach(() => {
  auth.setUser(OWNER);
  auth.login.mockReset();
  auth.logout.mockReset();
  // Mặc định máy chủ giả nhận cả hai tài khoản dựng sẵn và từ chối mọi tài khoản khác.
  auth.login.mockImplementation(async (username, password) => {
    await Promise.resolve();
    if (username === '1111' && password === '1111') auth.setUser(GUEST);
    else if (username === '2222' && password === '2222') auth.setUser(OWNER);
    else throw new TypeError('fetch failed');
  });
  auth.logout.mockImplementation(async () => {
    await Promise.resolve();
    auth.setUser(null);
  });
  for (const fn of Object.values(api)) fn.mockReset();
  api.listMyWords.mockResolvedValue({
    content: WORDS,
    page: 0,
    size: 500,
    totalElements: WORDS.length,
    totalPages: 1,
    first: true,
    last: true,
  });
  api.listSentences.mockResolvedValue(SENTENCES);
  api.aiStatus.mockResolvedValue(AI_ON);
  // jsdom không có scrollIntoView; đổi bộ câu thì trang cuộn lên đầu nên cần hàm giả.
  Element.prototype.scrollIntoView = vi.fn();
});

/** Dựng trang rồi chờ máy chủ giả trả về từ và câu. */
async function renderReady(): Promise<void> {
  render(<SentencesPage />);
  await screen.findByText(/89 từ bạn đã học và 90 câu ghép từ chính những từ đó\./);
}

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

describe('trang Câu của tôi — đăng nhập', () => {
  it('chưa đăng nhập thì tự vào bằng tài khoản khách 1111 rồi hiện từ và câu', async () => {
    auth.setUser(null);
    // Giữ yêu cầu đăng nhập treo để thấy vòng chờ, rồi mới cho máy chủ trả lời.
    let finishLogin: () => void = () => undefined;
    auth.login.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishLogin = () => {
            auth.setUser(GUEST);
            resolve();
          };
        }),
    );
    render(<SentencesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Câu của tôi' })).toBeInTheDocument();
    expect(screen.getByText('Đang vào bằng tài khoản khách')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(auth.login).toHaveBeenCalledWith('1111', '1111');
    // Chưa vào được thì chưa động tới dữ liệu.
    expect(api.listMyWords).not.toHaveBeenCalled();
    expect(api.listSentences).not.toHaveBeenCalled();

    act(() => finishLogin());
    await screen.findByText(/89 từ bạn đã học và 90 câu ghép từ chính những từ đó\./);
    expect(api.listMyWords).toHaveBeenCalledWith({ size: 500 });
    expect(api.listSentences).toHaveBeenCalledTimes(1);
    // Đúng một lần: vào rồi thì không gọi lại dù trang vẽ lại nhiều lần.
    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/tài khoản khách \(1111\)/)).toBeInTheDocument();
  });

  it('không tự vào được thì hiện lỗi và ô đăng nhập có sẵn hai tài khoản', async () => {
    auth.setUser(null);
    auth.login.mockRejectedValueOnce(new TypeError('fetch failed'));
    render(<SentencesPage />);

    expect(await screen.findByText('Không tự đăng nhập được')).toBeInTheDocument();
    expect(screen.getByText('Không kết nối được máy chủ')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByText(LOGIN_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText('Tài khoản có sẵn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng nhập 2222' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng nhập 1111' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Nghe câu' })).not.toBeInTheDocument();

    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(api.listMyWords).not.toHaveBeenCalled();
    expect(api.listSentences).not.toHaveBeenCalled();
    expect(api.aiStatus).not.toHaveBeenCalled();
  });

  it('ô đăng nhập hiện ra sau lỗi vẫn vào được bằng nút một-bấm', async () => {
    auth.setUser(null);
    auth.login.mockRejectedValueOnce(new TypeError('fetch failed'));
    const user = userEvent.setup();
    render(<SentencesPage />);
    await screen.findByText('Tài khoản có sẵn');

    await user.click(screen.getByRole('button', { name: 'Đăng nhập 2222' }));
    expect(auth.login).toHaveBeenLastCalledWith('2222', '2222');
    await screen.findByText(/89 từ bạn đã học và 90 câu/);
    expect(screen.queryByText(/tài khoản khách/)).not.toBeInTheDocument();
  });

  it('đang là khách thì có thông báo và nút chuyển sang tài khoản 2222', async () => {
    auth.setUser(GUEST);
    const user = userEvent.setup();
    await renderReady();

    expect(
      screen.getByText(
        'Bạn đang dùng tài khoản khách (1111) — từ và câu ở đây dùng chung với mọi khách.',
      ),
    ).toBeInTheDocument();
    // Đã có phiên thì không tự đăng nhập gì cả.
    expect(auth.login).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Dùng tài khoản của tôi (2222)' }));

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(auth.login).toHaveBeenCalledWith('2222', '2222');
    expect(auth.logout.mock.invocationCallOrder[0]).toBeLessThan(
      auth.login.mock.invocationCallOrder[0],
    );

    // Sang tài khoản 2222 thì thông báo khách biến mất và dữ liệu nạp lại.
    await waitFor(() => {
      expect(screen.queryByText(/tài khoản khách \(1111\)/)).not.toBeInTheDocument();
    });
    await screen.findByText(/89 từ bạn đã học và 90 câu/);
    expect(api.listMyWords).toHaveBeenCalledTimes(2);
  });

  it('đang là 2222 thì không có thông báo khách', async () => {
    await renderReady();

    expect(screen.queryByText(/tài khoản khách/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Dùng tài khoản của tôi (2222)' }),
    ).not.toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('đăng nhập rồi thì lấy từ và câu từ máy chủ, hiện đủ số', async () => {
    await renderReady();

    expect(api.listMyWords).toHaveBeenCalledWith({ size: 500 });
    expect(api.listSentences).toHaveBeenCalledTimes(1);
    expect(api.aiStatus).toHaveBeenCalledTimes(1);
    await screen.findByText(/· AI: claude-opus-5/);

    // Nhóm mới nhất đứng đầu, rồi đến nhóm theo cấp; một từ ở nhóm đầu và một
    // từ ở nhóm cuối, để chắc là dựng hết chứ không cắt.
    expect(screen.getByRole('heading', { name: /10 từ mới nhất/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /HSK 1/ })).toBeInTheDocument();
    expect(screen.getByText('开车')).toBeInTheDocument();
    expect(screen.getByText('水果')).toBeInTheDocument();
  });

  it('báo lỗi kèm nút thử lại khi máy chủ không trả lời', async () => {
    api.listSentences.mockRejectedValueOnce(new TypeError('fetch failed'));
    const user = userEvent.setup();
    render(<SentencesPage />);

    expect(await screen.findByText('Không lấy được từ và câu của bạn')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await screen.findByText(/89 từ bạn đã học và 90 câu/);
    expect(api.listSentences).toHaveBeenCalledTimes(2);
  });
});

describe('trang Câu của tôi — bảng từ', () => {
  it('ô tìm lọc bảng từ theo chữ Hán, pinyin hoặc nghĩa không dấu', async () => {
    const user = userEvent.setup();
    await renderReady();

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

  it('bỏ một từ thì gọi máy chủ rồi nạp lại danh sách', async () => {
    api.deleteMyWord.mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderReady();

    await user.type(screen.getByRole('searchbox', { name: 'Tìm từ' }), '开车');
    await user.click(screen.getByRole('button', { name: 'Bỏ khỏi danh sách đã học' }));

    const kaiche = WORDS.find((word) => word.simplified === '开车');
    expect(api.deleteMyWord).toHaveBeenCalledWith(kaiche?.wordId);
    await waitFor(() => expect(api.listMyWords).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Đã bỏ 开车 khỏi danh sách đã học.')).toBeInTheDocument();
  });
});

describe('trang Câu của tôi — nghe câu', () => {
  it('mở ra một bộ 20 câu, không lộ chữ Hán, pinyin hay nghĩa', async () => {
    const user = userEvent.setup();
    await renderReady();
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
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    await user.click(screen.getByRole('radio', { name: 'Hiện hết' }));

    const before = shownHanzi();
    expect(before.size).toBe(20);

    await user.click(screen.getByRole('button', { name: 'Đổi câu khác' }));
    const after = shownHanzi();
    expect(after.size).toBe(20);
    for (const hanzi of after) expect(before.has(hanzi)).toBe(false);
  });

  it('đổi cỡ bộ thì rút lại đúng số câu, "Tất cả" thì hiện hết', async () => {
    const user = userEvent.setup();
    await renderReady();
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
    await renderReady();
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
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    const expected = MY_SENTENCES.filter((sentence) => sentence.hanzi.includes('现在')).length;
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '现在');
    expect(screen.getAllByRole('article')).toHaveLength(expected);
    // Tìm không được lộ nội dung: vẫn phải bấm mới thấy chữ.
    expect(shownHanzi().size).toBe(0);
  });

  it('câu có sẵn không có nút xoá, câu AI và câu tự thêm thì có', async () => {
    api.listSentences.mockResolvedValue([
      ...SENTENCES,
      aiSentence(501, '我在家喝茶。', 'Wǒ zài jiā hē chá.', 'Tôi uống trà ở nhà.'),
    ]);
    api.deleteSentence.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SentencesPage />);
    await screen.findByText(/89 từ bạn đã học và 91 câu/);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '现在几点');
    expect(screen.queryByRole('button', { name: /Xoá câu/ })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Tìm câu' }));
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '我在家喝茶');
    expect(screen.getByRole('heading', { name: /Câu AI tạo/ })).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xoá câu 我在家喝茶。' }));
    expect(api.deleteSentence).toHaveBeenCalledWith(501);
    await waitFor(() => expect(screen.queryAllByRole('article')).toHaveLength(0));
  });
});

describe('trang Câu của tôi — AI', () => {
  it('nút tạo câu bị khoá khi máy chủ chưa bật AI', async () => {
    api.aiStatus.mockResolvedValue(AI_OFF);
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    const button = screen.getByRole('button', { name: 'Tạo câu mới bằng AI' });
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute('title', 'Chưa cấu hình AI trên máy chủ');
    expect(screen.queryByText(/· AI:/)).not.toBeInTheDocument();

    // Thẻ thêm câu giải thích lý do và cách bật, thay vì giấu nút đi.
    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    expect(screen.getByText('Máy chủ chưa bật AI')).toBeInTheDocument();
    expect(screen.getByText(/Chưa cấu hình ANTHROPIC_API_KEY/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tạo bằng AI' })).not.toBeInTheDocument();
  });

  it('nút tạo câu mở khi AI bật, và gửi đúng một bộ 20 câu', async () => {
    api.generateSentences.mockResolvedValue({
      requested: 20,
      generated: 0,
      rejected: 0,
      duplicates: 0,
      sentences: [],
      rejectedSamples: [],
      model: 'claude-opus-5',
    });
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));

    const button = screen.getByRole('button', { name: 'Tạo câu mới bằng AI' });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    expect(api.generateSentences).toHaveBeenCalledWith({ count: 20 });
  });

  it('"Tạo bằng AI" gửi đúng số câu và cấp đã chọn, rồi đưa câu mới lên đầu phần nghe', async () => {
    const created = [
      aiSentence(601, '妈妈在喝茶。', 'Māma zài hē chá.', 'Mẹ đang uống trà.'),
      aiSentence(602, '我明天开车。', 'Wǒ míngtiān kāichē.', 'Ngày mai tôi lái xe.'),
    ];
    api.generateSentences.mockResolvedValue({
      requested: 10,
      generated: 2,
      rejected: 1,
      duplicates: 3,
      sentences: created,
      rejectedSamples: ['他很高兴。 (lạ: 高兴)'],
      model: 'claude-opus-5',
    });
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await screen.findByRole('button', { name: 'Tạo bằng AI' });

    await user.click(screen.getByRole('radio', { name: '10' }));
    await user.click(screen.getByRole('radio', { name: 'Cấp 2' }));
    await user.click(screen.getByRole('button', { name: 'Tạo bằng AI' }));

    expect(api.generateSentences).toHaveBeenCalledWith({ count: 10, level: 2 });

    // Xong thì sang thẻ nghe, báo kết quả kể cả câu bị loại, và câu mới thành
    // mục riêng ở đầu bộ đang xem.
    expect(await screen.findByText('Đã thêm 2 câu.')).toBeInTheDocument();
    expect(
      screen.getByText('1 câu bị loại vì dùng chữ chưa học. 3 câu trùng.'),
    ).toBeInTheDocument();
    expect(screen.getByText('他很高兴。 (lạ: 高兴)')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Nghe câu' })).toBeChecked();

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings[0]).toHaveTextContent('Câu AI vừa tạo');
    expect(headings[0]).toHaveTextContent('2 câu');
    expect(screen.getAllByRole('article')).toHaveLength(22);
    expect(screen.getByText(/91 từ bạn đã học|89 từ bạn đã học và 92 câu/)).toBeInTheDocument();

    // Chưa mở gì cả: câu mới cũng phải đoán trước rồi mới xem.
    expect(shownHanzi().size).toBe(0);
    await user.click(screen.getAllByRole('button', { name: 'Hiện Chữ Hán' })[0]);
    expect(['妈妈在喝茶。', '我明天开车。']).toContain([...shownHanzi()][0]);
  });

  it('AI báo lỗi thì hiện lỗi tại chỗ, không đổi thẻ', async () => {
    api.generateSentences.mockRejectedValue(new TypeError('fetch failed'));
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await user.click(await screen.findByRole('button', { name: 'Tạo bằng AI' }));

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Thêm từ & câu' })).toBeChecked();
  });
});

describe('trang Câu của tôi — thêm câu và từ', () => {
  it('dán câu thì gửi lên máy chủ với đủ ba phần và cấp suy từ độ dài', async () => {
    api.addSentences.mockResolvedValue({
      added: 1,
      duplicates: 0,
      sentences: [
        {
          id: 700,
          hanzi: '他很忙。',
          pinyin: 'Tā hěn máng.',
          meaningVi: 'Anh ấy rất bận.',
          level: 1,
          source: 'MANUAL',
          createdAt: '2026-03-01T00:00:00Z',
        },
      ],
    });
    const user = userEvent.setup();
    await renderReady();

    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await user.click(screen.getByLabelText('Dán câu do AI tạo'));
    await user.paste('他很忙。 | Tā hěn máng. | Anh ấy rất bận.\n我回家。 | Wǒ huí jiā.');
    // Câu thiếu nghĩa bị giữ lại và nói rõ, vì máy chủ không nhận câu thiếu phần.
    expect(screen.getByText(/1 câu thiếu pinyin hoặc nghĩa/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Thêm 1 câu/ }));
    expect(api.addSentences).toHaveBeenCalledWith([
      { hanzi: '他很忙。', pinyin: 'Tā hěn máng.', meaningVi: 'Anh ấy rất bận.', level: 1 },
    ]);

    // Thêm xong thì nhảy sang phần nghe để dùng được ngay; câu mới tìm được như
    // mọi câu khác và mang nhãn "Tự thêm".
    expect(await screen.findByText('Đã thêm 1 câu.')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), '他很忙');
    await user.click(screen.getByRole('radio', { name: 'Hiện hết' }));
    expect(screen.getByText('他很忙。')).toBeInTheDocument();
    expect(screen.getByText('Tự thêm')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('câu đã có sẵn thì máy chủ báo trùng và trang nói ra', async () => {
    api.addSentences.mockResolvedValue({ added: 0, duplicates: 1, sentences: [] });
    const user = userEvent.setup();
    await renderReady();

    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await user.click(screen.getByLabelText('Dán câu do AI tạo'));
    await user.paste('现在几点？ | Xiànzài jǐ diǎn? | Bây giờ mấy giờ?');
    await user.click(screen.getByRole('button', { name: /Thêm 1 câu/ }));

    expect(await screen.findByText('1 câu đã có sẵn nên bỏ qua.')).toBeInTheDocument();
  });

  it('xoá hết câu AI gọi đúng nguồn', async () => {
    api.listSentences.mockResolvedValue([
      ...SENTENCES,
      aiSentence(501, '我在家喝茶。', 'Wǒ zài jiā hē chá.', 'Tôi uống trà ở nhà.'),
    ]);
    api.deleteSentencesBySource.mockResolvedValue({ message: 'Đã xoá 1 câu' });
    const user = userEvent.setup();
    render(<SentencesPage />);
    await screen.findByText(/89 từ bạn đã học và 91 câu/);

    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await user.click(screen.getByRole('button', { name: 'Xoá hết câu AI' }));
    expect(api.deleteSentencesBySource).toHaveBeenCalledWith('AI');
    expect(await screen.findByText('Đã xoá 1 câu')).toBeInTheDocument();
    await screen.findByText(/89 từ bạn đã học và 90 câu/);
  });

  it('thêm từ: dán → kiểm tra → duyệt → thêm, rồi nạp lại bảng từ', async () => {
    const preview: ImportPreviewResponse = {
      summary: { total: 1, willCreate: 1, existing: 0, needsAttention: 0, errors: 0 },
      rows: [
        {
          index: 0,
          input: { simplified: '学习', pinyin: 'xuéxí', meaningVi: 'học' },
          simplified: '学习',
          traditional: '學習',
          pinyin: 'xuéxí',
          pinyinNumbered: 'xue2 xi2',
          meaningVi: 'học',
          meaningEn: 'to study',
          hskLevel: 1,
          dictionaryFound: true,
          pinyinMatchesDictionary: true,
          dictionaryPinyin: 'xuéxí',
          dictionarySenses: [],
          candidates: [],
          existingWord: null,
          status: 'OK',
          suggestedAction: 'CREATE',
          messages: [],
        },
      ],
    };
    api.previewImport.mockResolvedValue(preview);
    api.confirmImport.mockResolvedValue({
      created: 1,
      updated: 0,
      linked: 0,
      skipped: 0,
      markedLearned: 1,
      wordIds: [42],
      errors: [],
    });
    const user = userEvent.setup();
    await renderReady();

    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await user.click(screen.getByLabelText('Dán từ mới'));
    await user.paste('学习 xuéxí học');
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }));

    expect(api.previewImport).toHaveBeenCalledWith({
      defaultHskLevel: 1,
      rows: [{ simplified: '学习', pinyin: 'xuéxí', meaningVi: 'học' }],
    });
    expect(await screen.findByText('學習')).toBeInTheDocument();
    expect(screen.getByText('1 từ · tạo mới 1 · đã có 0 · cần xem 0 · lỗi 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Nghĩa tiếng Anh')).toHaveValue('to study');

    await user.click(screen.getByRole('button', { name: 'Thêm 1 từ vào danh sách đã học' }));
    await waitFor(() => expect(api.confirmImport).toHaveBeenCalledTimes(1));
    const body = api.confirmImport.mock.calls[0][0] as {
      markAsLearned: boolean;
      rows: { action: string; simplified?: string; pinyinNumbered?: string; hskLevel?: number }[];
    };
    expect(body.markAsLearned).toBe(true);
    expect(body.rows[0]).toMatchObject({
      action: 'CREATE',
      simplified: '学习',
      pinyinNumbered: 'xue2 xi2',
      hskLevel: 1,
    });

    expect(
      await screen.findByText('Đã tạo mới 1; 1 từ được đánh dấu là đã học.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(api.listMyWords).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText('Dán từ mới')).toHaveValue('');
  });

  it('thiếu chữ Hán thì hiện gợi ý; chọn gợi ý là kiểm tra lại', async () => {
    api.previewImport
      .mockResolvedValueOnce({
        summary: { total: 1, willCreate: 0, existing: 0, needsAttention: 1, errors: 0 },
        rows: [
          {
            index: 0,
            input: { pinyin: 'wǒ', meaningVi: 'tôi' },
            dictionaryFound: false,
            dictionarySenses: [],
            candidates: [
              { simplified: '我', traditional: '我', pinyinMarked: 'wǒ', meaningEn: 'I', inSystem: true },
            ],
            status: 'WARNING',
            suggestedAction: 'NEEDS_INPUT',
            messages: ['Thiếu chữ Hán — chọn một trong các gợi ý'],
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: { total: 1, willCreate: 0, existing: 1, needsAttention: 0, errors: 0 },
        rows: [
          {
            index: 0,
            input: { simplified: '我', pinyin: 'wǒ', meaningVi: 'tôi', meaningEn: 'I' },
            simplified: '我',
            pinyin: 'wǒ',
            meaningVi: 'tôi',
            dictionaryFound: true,
            dictionarySenses: [],
            candidates: [],
            existingWord: {
              id: 7,
              simplified: '我',
              pinyin: 'wǒ',
              meaningVi: 'tôi',
              hskLevel: 1,
              alreadyLearned: true,
            },
            status: 'EXISTS',
            suggestedAction: 'LINK',
            messages: ['Đã có trong hệ thống (id 7)'],
          },
        ],
      });
    const user = userEvent.setup();
    await renderReady();

    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await user.click(screen.getByLabelText('Dán từ mới'));
    await user.paste('wǒ tôi');
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }));

    const candidate = await screen.findByRole('button', { name: /我.*wǒ.*I.*đã có/ });
    expect(screen.getByText('Cần xem')).toBeInTheDocument();
    await user.click(candidate);

    await waitFor(() => expect(api.previewImport).toHaveBeenCalledTimes(2));
    expect(api.previewImport.mock.calls[1][0]).toEqual({
      defaultHskLevel: 1,
      rows: [{ simplified: '我', pinyin: 'wǒ', meaningVi: 'tôi', meaningEn: 'I' }],
    });
    expect(await screen.findByText('Đã có')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('LINK');
  });
});
