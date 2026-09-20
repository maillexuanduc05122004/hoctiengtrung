/**
 * Dựng thật trang "Câu của tôi" với máy chủ giả.
 *
 * Trọng tâm vẫn là lời hứa dễ vỡ nhất của trang: mở phần nghe thì KHÔNG được
 * thấy chữ Hán, pinyin hay nghĩa — chỉ có nút phát. Cộng thêm các lời hứa kể
 * từ khi trang nối máy chủ: KHÔNG có bước đăng nhập — trang nạp từ và câu ngay,
 * phiên khách còn sót từ bản cũ thì tự bỏ; KHÔNG BAO GIỜ chờ máy chủ để hiện
 * màn hình đầu — lần mở đầu hiện bộ 89 từ / 90 câu đóng gói sẵn, lần sau hiện
 * bản chụp lần trước, và trong lúc đó mọi nút ghi (xoá, thêm, AI) bị giấu hay
 * khoá kèm lời giải thích cho tới khi máy chủ trả lời; máy chủ đang dậy (lỗi
 * mạng) thì tự gọi lại chứ không bắt bấm tay; nút AI khoá khi máy chủ chưa bật
 * AI; bấm "Tạo bằng AI" thì gửi đúng số câu, đúng cấp và nhóm từ mới nhất để
 * AI ưu tiên; và "Điền bằng AI" ở phần thêm từ đổ thẳng kết quả vào bảng duyệt.
 *
 * `endpoints.ts` được giả lập nguyên tệp nên không có yêu cầu mạng nào; dữ liệu
 * mẫu lấy từ `corpus.ts` (89 từ, 90 câu) để bộ câu ngẫu nhiên có cùng kích cỡ
 * với dữ liệu thật. `useAuth` được giả bằng một kho nhỏ có đăng ký lắng nghe,
 * để `logout` giả đổi được trạng thái và trang vẽ lại như với provider thật.
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
import { OUTDATED_SERVER_LINE, SentencesPage } from './SentencesPage.tsx';
import { MY_SENTENCES, MY_WORDS } from '../features/sentences/corpus.ts';
import { WAITING_HINT } from '../features/sentences/SentenceDrill.tsx';
import type { AuthUser } from '../lib/api/auth.ts';
import { ApiError } from '../lib/api/client.ts';
import type * as Retry from '../lib/api/retry.ts';
import type {
  AiStatus,
  ImportAiResponse,
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
  completeImportWithAi: vi.fn(),
  confirmImport: vi.fn(),
  listSentences: vi.fn(),
  addSentences: vi.fn(),
  deleteSentence: vi.fn(),
  deleteSentencesBySource: vi.fn(),
  generateSentences: vi.fn(),
  aiStatus: vi.fn(),
}));

vi.mock('../lib/api/endpoints.ts', () => api);

// Vòng tự thử lại giữ nguyên logic nhưng không chờ thật giữa hai lần — lịch
// chờ 2 s… 15 s đã được `retry.test.ts` kiểm riêng; ở đây chỉ cần biết trang
// có gọi lại hay không.
vi.mock('../lib/api/retry.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof Retry>();
  return {
    ...actual,
    withRetry: <T,>(task: (signal?: AbortSignal) => Promise<T>, options = {}) =>
      actual.withRetry(task, { ...options, delays: [0, 0] }),
  };
});

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
  // Mặc định không đăng nhập: máy chủ tự dùng tài khoản chủ trang.
  auth.setUser(null);
  auth.login.mockReset();
  auth.logout.mockReset();
  auth.logout.mockImplementation(async () => {
    await Promise.resolve();
    auth.setUser(null);
  });
  // Bản chụp của test trước không được rò sang test sau.
  localStorage.clear();
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

describe('trang Câu của tôi — không cần đăng nhập', () => {
  it('chưa đăng nhập vẫn nạp từ và câu ngay, không hiện ô đăng nhập, không tự đăng nhập', async () => {
    render(<SentencesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Câu của tôi' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    await screen.findByText(/89 từ bạn đã học và 90 câu ghép từ chính những từ đó\./);
    expect(api.listMyWords).toHaveBeenCalledWith({ size: 500 }, expect.any(AbortSignal));
    expect(api.listSentences).toHaveBeenCalledTimes(1);
    expect(api.aiStatus).toHaveBeenCalledTimes(1);
    expect(auth.login).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(screen.queryByText(/tài khoản khách/)).not.toBeInTheDocument();
    await screen.findByText(/· AI: claude-opus-5/);

    // Nhóm mới nhất đứng đầu, rồi đến nhóm theo cấp; một từ ở nhóm đầu và một
    // từ ở nhóm cuối, để chắc là dựng hết chứ không cắt.
    expect(screen.getByRole('heading', { name: /10 từ mới nhất/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /HSK 1/ })).toBeInTheDocument();
    expect(screen.getByText('开车')).toBeInTheDocument();
    expect(screen.getByText('水果')).toBeInTheDocument();
  });

  it('phiên khách 1111 còn sót từ bản cũ thì tự đăng xuất; tài khoản khác thì giữ', async () => {
    auth.setUser(GUEST);
    const first = render(<SentencesPage />);
    await screen.findByText(/89 từ bạn đã học và 90 câu/);
    await waitFor(() => expect(auth.logout).toHaveBeenCalledTimes(1));
    first.unmount();

    auth.logout.mockClear();
    auth.setUser(OWNER);
    await renderReady();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('lần mở sau hiện ngay bản chụp lần trước rồi mới cập nhật từ máy chủ', async () => {
    // Lần 1: nạp bình thường, để lại bản chụp.
    const first = render(<SentencesPage />);
    await screen.findByText(/89 từ bạn đã học và 90 câu/);
    first.unmount();

    // Lần 2: máy chủ chậm (treo) — trang vẫn hiện 89 từ / 90 câu ngay lập tức,
    // nói rõ đây là dữ liệu lần trước và chưa ghi được.
    let finish: (value: Sentence[]) => void = () => undefined;
    api.listSentences.mockImplementationOnce(
      () =>
        new Promise<Sentence[]>((resolve) => {
          finish = resolve;
        }),
    );
    render(<SentencesPage />);
    expect(screen.getByText(/89 từ bạn đã học và 90 câu/)).toBeInTheDocument();
    expect(screen.getByText('Máy chủ đang thức dậy…')).toBeInTheDocument();
    expect(screen.getByText(/Đang hiện dữ liệu của lần mở trước\./)).toBeInTheDocument();
    expect(screen.queryByText('Đang lấy từ và câu của bạn')).not.toBeInTheDocument();

    // Máy chủ về tới với một câu mới: số câu đổi và khung "đang thức dậy" biến mất.
    act(() => finish([...SENTENCES, aiSentence(501, '我在家喝茶。', 'Wǒ zài jiā hē chá.', 'Tôi uống trà ở nhà.')]));
    await screen.findByText(/89 từ bạn đã học và 91 câu/);
    await waitFor(() => {
      expect(screen.queryByText('Máy chủ đang thức dậy…')).not.toBeInTheDocument();
    });
  });
});

describe('trang Câu của tôi — bộ dự phòng khi chưa có máy chủ', () => {
  it('lần mở đầu (chưa có bản chụp) hiện ngay 89 từ / 90 câu đóng gói sẵn, khoá mọi nút ghi tới khi máy chủ trả lời', async () => {
    let finishWords: (value: unknown) => void = () => undefined;
    let finishSentences: (value: Sentence[]) => void = () => undefined;
    api.listMyWords.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishWords = resolve;
        }),
    );
    api.listSentences.mockImplementationOnce(
      () =>
        new Promise<Sentence[]>((resolve) => {
          finishSentences = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<SentencesPage />);

    // Không vòng chờ: bảng từ hiện đủ, đúng nhóm mới nhất của corpus đứng đầu.
    expect(screen.getByText(/89 từ bạn đã học và 90 câu/)).toBeInTheDocument();
    expect(screen.queryByText('Đang lấy từ và câu của bạn')).not.toBeInTheDocument();
    expect(screen.getByText('Máy chủ đang thức dậy…')).toBeInTheDocument();
    expect(screen.getByText(/Đang hiện bộ từ và câu có sẵn trong ứng dụng\./)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /10 từ mới nhất/ })).toBeInTheDocument();
    expect(screen.getByText('现在')).toBeInTheDocument();
    expect(screen.getByText('水果')).toBeInTheDocument();

    // Mã dự phòng là mã giả: không có nút bỏ từ để không gửi mã đó lên máy chủ.
    expect(screen.queryByRole('button', { name: 'Bỏ khỏi danh sách đã học' })).not.toBeInTheDocument();

    // Phần nghe: có câu để nghe, nút AI khoá với lý do "đang thức dậy" chứ không phải "chưa có AI".
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    const generate = screen.getByRole('button', { name: 'Tạo câu mới bằng AI' });
    expect(generate).toBeDisabled();
    expect(generate).toHaveAttribute('title', WAITING_HINT);

    // Thẻ thêm chỉ có lời nhắc, không có ô dán.
    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    expect(screen.getByText('Phần thêm từ và câu cần máy chủ')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kiểm tra' })).not.toBeInTheDocument();

    // Máy chủ trả lời cả hai: dữ liệu thật thay vào, mọi thứ mở ra.
    act(() => {
      finishWords({
        content: WORDS,
        page: 0,
        size: 500,
        totalElements: WORDS.length,
        totalPages: 1,
        first: true,
        last: true,
      });
      finishSentences([...SENTENCES, aiSentence(501, '我在家喝茶。', 'Wǒ zài jiā hē chá.', 'Tôi uống trà ở nhà.')]);
    });
    await screen.findByText(/89 từ bạn đã học và 91 câu/);
    expect(screen.queryByText('Máy chủ đang thức dậy…')).not.toBeInTheDocument();
    expect(screen.queryByText('Phần thêm từ và câu cần máy chủ')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    expect(screen.getByRole('button', { name: 'Tạo câu mới bằng AI' })).toBeEnabled();

    await user.click(screen.getByRole('radio', { name: 'Từ vựng' }));
    expect(screen.getAllByRole('button', { name: 'Bỏ khỏi danh sách đã học' }).length).toBeGreaterThan(0);
    expect(api.deleteMyWord).not.toHaveBeenCalled();
    // Test này dựng đủ 89 từ lẫn 90 câu rồi đi qua ba thẻ hai lượt; chạy song song
    // với 35 tệp khác thì vượt hạn 5 giây mặc định nên cần hạn rộng hơn.
  }, 15_000);

  it('máy chủ đang dậy (lỗi mạng, rồi 503) thì tự gọi lại, không bắt bấm tay', async () => {
    api.listSentences
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new ApiError(503));
    render(<SentencesPage />);

    expect(screen.getByText(/89 từ bạn đã học và 90 câu/)).toBeInTheDocument();
    expect(screen.getByText('Máy chủ đang thức dậy…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Máy chủ đang thức dậy…')).not.toBeInTheDocument();
    });
    expect(api.listSentences).toHaveBeenCalledTimes(3);
    expect(screen.queryByText('Chưa lấy được từ và câu từ máy chủ')).not.toBeInTheDocument();
  });

  it('hết lượt tự thử lại mà máy chủ vẫn im thì mới báo lỗi và đưa nút thử lại', async () => {
    // Lịch giả có 2 khoảng chờ ⇒ 3 lần gọi rồi chịu thua.
    api.listSentences.mockRejectedValue(new TypeError('fetch failed'));
    const user = userEvent.setup();
    render(<SentencesPage />);

    expect(await screen.findByText('Chưa lấy được từ và câu từ máy chủ')).toBeInTheDocument();
    expect(screen.getByText('Không kết nối được máy chủ')).toBeInTheDocument();
    expect(api.listSentences).toHaveBeenCalledTimes(3);
    // Vẫn đang hiện bộ dự phòng để nghe được, chỉ không ghi được.
    expect(screen.getByText(/89 từ bạn đã học và 90 câu/)).toBeInTheDocument();
    expect(screen.getByText(/Đang hiện bộ từ và câu có sẵn trong ứng dụng\./)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bỏ khỏi danh sách đã học' })).not.toBeInTheDocument();

    api.listSentences.mockResolvedValue(SENTENCES);
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => {
      expect(screen.queryByText('Chưa lấy được từ và câu từ máy chủ')).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: 'Bỏ khỏi danh sách đã học' }).length).toBeGreaterThan(0);
  });

  it('máy chủ trả lời lỗi thật thì báo ngay trên nền dữ liệu dự phòng, kèm nút thử lại', async () => {
    api.listSentences.mockRejectedValueOnce(new ApiError(500, { detail: 'Lỗi máy chủ nội bộ' }));
    const user = userEvent.setup();
    render(<SentencesPage />);

    expect(await screen.findByText('Chưa lấy được từ và câu từ máy chủ')).toBeInTheDocument();
    expect(screen.getByText('Lỗi máy chủ nội bộ')).toBeInTheDocument();
    expect(screen.getByText(/89 từ bạn đã học và 90 câu/)).toBeInTheDocument();
    expect(api.listSentences).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => {
      expect(screen.queryByText('Chưa lấy được từ và câu từ máy chủ')).not.toBeInTheDocument();
    });
    expect(api.listSentences).toHaveBeenCalledTimes(2);
    // Máy chủ đã trả lời cả hai phía: xoá từ mở lại.
    expect(screen.getAllByRole('button', { name: 'Bỏ khỏi danh sách đã học' }).length).toBeGreaterThan(0);
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
      reordered: 0,
      replaced: 0,
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
    // Kèm 10 từ mới nhất (learnedAt giảm dần) để AI ưu tiên ghép chúng với từ cũ.
    const newest = [...WORDS]
      .sort((a, b) => b.learnedAt.localeCompare(a.learnedAt))
      .slice(0, 10)
      .map((word) => word.simplified);
    // Bộ mới THAY bộ AI cũ: bấm nút này là đã nghe chán bộ đang có.
    expect(api.generateSentences).toHaveBeenCalledWith({
      count: 20,
      focusWords: newest,
      replaceAi: true,
    });
  });

  it('bộ AI mới thay bộ AI cũ: câu AI cũ biến khỏi phần nghe, thông báo nói rõ đã bỏ bao nhiêu', async () => {
    api.listSentences.mockResolvedValue([
      ...SENTENCES,
      aiSentence(501, '我在家喝茶。', 'Wǒ zài jiā hē chá.', 'Tôi uống trà ở nhà.'),
    ]);
    api.generateSentences.mockResolvedValue({
      requested: 20,
      generated: 1,
      rejected: 0,
      duplicates: 0,
      reordered: 0,
      replaced: 1,
      sentences: [aiSentence(601, '妈妈在喝茶。', 'Māma zài hē chá.', 'Mẹ đang uống trà.')],
      rejectedSamples: [],
      model: 'gemini-3.6-flash',
    });
    const user = userEvent.setup();
    render(<SentencesPage />);
    await screen.findByText(/89 từ bạn đã học và 91 câu/);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    const button = screen.getByRole('button', { name: 'Tạo câu mới bằng AI' });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);

    expect(await screen.findByText('Đã thêm 1 câu.')).toBeInTheDocument();
    expect(screen.getByText('Đã bỏ 1 câu AI cũ để thay bằng bộ này.')).toBeInTheDocument();
    // Máy chủ đã xác nhận thay (`replaced` có mặt) nên không có lời cảnh báo bản cũ.
    expect(screen.queryByText(OUTDATED_SERVER_LINE)).not.toBeInTheDocument();
    // 90 câu có sẵn − 1 AI cũ + 1 AI mới = 91: kho không phình ra.
    expect(screen.getByText(/89 từ bạn đã học và 91 câu/)).toBeInTheDocument();
    // Câu AI cũ không còn đâu để tìm; câu AI mới thì có.
    const search = screen.getByRole('searchbox', { name: 'Tìm câu' });
    await user.type(search, '我在家喝茶');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    await user.clear(search);
    await user.type(search, '妈妈在喝茶');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Hiện Chữ Hán' }));
    expect(shownHanzi()).toEqual(new Set(['妈妈在喝茶。']));
  });

  it('máy chủ bản cũ (không trả `replaced`) thì giữ nguyên câu AI cũ và cảnh báo, dù đã xin thay', async () => {
    api.listSentences.mockResolvedValue([
      ...SENTENCES,
      aiSentence(501, '我在家喝茶。', 'Wǒ zài jiā hē chá.', 'Tôi uống trà ở nhà.'),
    ]);
    // Bản cũ không biết `replaceAi` lẫn `replaced`: chỉ cộng thêm bộ mới.
    api.generateSentences.mockResolvedValue({
      requested: 20,
      generated: 1,
      rejected: 0,
      duplicates: 0,
      reordered: 0,
      sentences: [aiSentence(601, '妈妈在喝茶。', 'Māma zài hē chá.', 'Mẹ đang uống trà.')],
      rejectedSamples: [],
      model: 'gemini-3.6-flash',
    });
    const user = userEvent.setup();
    render(<SentencesPage />);
    await screen.findByText(/89 từ bạn đã học và 91 câu/);
    await user.click(screen.getByRole('radio', { name: 'Nghe câu' }));
    const button = screen.getByRole('button', { name: 'Tạo câu mới bằng AI' });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);

    // Nói thẳng máy chủ cần cập nhật, bằng giọng cảnh báo, chứ không im lặng
    // để người học tưởng nút hỏng.
    expect(await screen.findByText('Đã thêm 1 câu.')).toBeInTheDocument();
    const warning = screen.getByText(OUTDATED_SERVER_LINE);
    expect(warning.closest('[role="status"]')).toHaveClass('bg-partial-soft');
    expect(screen.queryByText(/Đã bỏ .* câu AI cũ/)).not.toBeInTheDocument();
    // UI khớp DB: 90 có sẵn + 1 AI cũ + 1 AI mới = 92, bộ cũ vẫn tìm thấy.
    expect(screen.getByText(/89 từ bạn đã học và 92 câu/)).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Tìm câu' }), 'uong tra o nha');
    expect(screen.getAllByRole('article')).toHaveLength(1);
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
      reordered: 2,
      replaced: 0,
      sentences: created,
      rejectedSamples: ['他很高兴。 (lạ: 高兴)', '学生是我。 (đổi chỗ câu đã có)'],
      model: 'claude-opus-5',
    });
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await screen.findByRole('button', { name: 'Tạo bằng AI' });

    // Mặc định ưu tiên từ mới: trang nói rõ 10 từ nào sẽ được ưu tiên.
    expect(screen.getByRole('radio', { name: 'Ưu tiên từ mới' })).toBeChecked();
    expect(screen.getByText(/Mỗi câu sẽ có ít nhất một trong 10 từ mới nhất/)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: '10' }));
    await user.click(screen.getByRole('radio', { name: 'Cấp 2' }));
    await user.click(screen.getByRole('radio', { name: 'Mọi từ' }));
    // Mặc định "Thay" bộ AI cũ; chọn "Giữ" thì không gửi cờ thay.
    expect(screen.getByRole('radio', { name: 'Thay' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Giữ' }));
    await user.click(screen.getByRole('button', { name: 'Tạo bằng AI' }));

    expect(api.generateSentences).toHaveBeenCalledWith({ count: 10, level: 2 });

    // Xong thì sang thẻ nghe, báo kết quả kể cả câu bị loại (chữ lạ, trùng, đổi
    // chỗ), và câu mới thành mục riêng ở đầu bộ đang xem.
    expect(await screen.findByText('Đã thêm 2 câu.')).toBeInTheDocument();
    expect(
      screen.getByText(
        '1 câu bị loại vì dùng chữ chưa học. 3 câu trùng. 2 câu chỉ là câu cũ đổi chỗ hay thay một chữ nên bỏ.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('学生是我。 (đổi chỗ câu đã có)')).toBeInTheDocument();
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

  it('thêm từ bằng AI: gõ đại → Điền bằng AI → bảng duyệt → thêm', async () => {
    const preview: ImportPreviewResponse = {
      summary: { total: 2, willCreate: 2, existing: 0, needsAttention: 0, errors: 0 },
      rows: [
        {
          index: 0,
          input: { simplified: '学习', pinyin: 'xué xí', meaningVi: 'học', meaningEn: 'to study' },
          simplified: '学习',
          traditional: '學習',
          pinyin: 'xué xí',
          pinyinNumbered: 'xue2 xi2',
          meaningVi: 'học',
          meaningEn: 'to study',
          hskLevel: 2,
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
        {
          index: 1,
          input: { simplified: '朋友', pinyin: 'péng you', meaningVi: 'bạn bè', meaningEn: 'friend' },
          simplified: '朋友',
          traditional: '朋友',
          pinyin: 'péng you',
          pinyinNumbered: 'peng2 you5',
          meaningVi: 'bạn bè',
          meaningEn: 'friend',
          hskLevel: 2,
          dictionaryFound: true,
          pinyinMatchesDictionary: true,
          dictionaryPinyin: 'péngyou',
          dictionarySenses: [],
          candidates: [],
          existingWord: null,
          status: 'OK',
          suggestedAction: 'CREATE',
          messages: [],
        },
      ],
    };
    const aiResponse: ImportAiResponse = { model: 'claude-opus-5', aiWords: 2, preview };
    api.completeImportWithAi.mockResolvedValue(aiResponse);
    // Bấm Thêm thì đối chiếu lại bằng nội dung đã duyệt rồi mới ghi.
    api.previewImport.mockResolvedValue(preview);
    api.confirmImport.mockResolvedValue({
      created: 2,
      updated: 0,
      linked: 0,
      skipped: 0,
      markedLearned: 2,
      wordIds: [42, 43],
      errors: [],
    });
    const user = userEvent.setup();
    await renderReady();

    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await user.click(screen.getByRole('radio', { name: 'HSK 2' }));
    await user.click(screen.getByLabelText('Dán từ mới'));
    // Chỉ tiếng Việt: bộ đọc thường chỉ thấy nghĩa, "Kiểm tra" sẽ toàn lỗi thiếu
    // chữ Hán — trang chỉ thẳng sang nút AI.
    await user.paste('học\nbạn bè');
    expect(
      screen.getByText('Đọc được 2 dòng, chưa có chữ Hán hay pinyin — bấm Điền bằng AI.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Điền bằng AI' }));
    expect(api.completeImportWithAi).toHaveBeenCalledWith({ text: 'học\nbạn bè', defaultHskLevel: 2 });
    expect(api.previewImport).not.toHaveBeenCalled();

    expect(await screen.findByText('學習')).toBeInTheDocument();
    expect(screen.getByText('朋友')).toBeInTheDocument();
    expect(
      screen.getByText('AI (claude-opus-5) đọc được 2 từ — duyệt lại từng dòng rồi mới thêm.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 từ · tạo mới 2 · đã có 0 · cần xem 0 · lỗi 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Thêm 2 từ vào danh sách đã học' }));
    await waitFor(() => expect(api.confirmImport).toHaveBeenCalledTimes(1));
    // Đối chiếu lại bằng đúng bốn phần AI đã điền, không phải bằng ô dán.
    expect(api.previewImport).toHaveBeenCalledWith({
      defaultHskLevel: 2,
      rows: [
        { simplified: '学习', pinyin: 'xué xí', meaningVi: 'học', meaningEn: 'to study' },
        { simplified: '朋友', pinyin: 'péng you', meaningVi: 'bạn bè', meaningEn: 'friend' },
      ],
    });
    expect(
      await screen.findByText('Đã tạo mới 2; 2 từ được đánh dấu là đã học.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(api.listMyWords).toHaveBeenCalledTimes(2));
  });

  it('máy chủ chưa bật AI thì phần thêm từ không có nút AI, vẫn Kiểm tra được', async () => {
    api.aiStatus.mockResolvedValue(AI_OFF);
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole('radio', { name: 'Thêm từ & câu' }));
    await screen.findByText('Máy chủ chưa bật AI');

    expect(screen.queryByRole('button', { name: 'Điền bằng AI' })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Dán từ mới'));
    await user.paste('学习 xuéxí học');
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeEnabled();
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
