/**
 * Dựng thật nút "Tra từ nhanh" cùng hộp tra từ nó mở ra.
 *
 * Hai điều dễ vỡ nhất nằm ở đây: phím tắt Ctrl/⌘ + K phải mở hộp từ mọi nơi
 * nhưng KHÔNG được cướp phím của người đang gõ, và khung ứng dụng đặt hai bản
 * của nút cùng lúc nên một lần bấm phím chỉ được mở đúng một hộp.
 *
 * Phần dưới kiểm mục "Từ điển lớn (CC-CEDICT)" qua đúng lối người học đi tới
 * nó: bấm nút, gõ vào ô tìm, rồi lưu một mục. Máy chủ được giả lập ở tầng
 * `apiFetch` / `endpoints` nên không có yêu cầu mạng nào thật.
 */
import 'fake-indexeddb/auto';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QuickLookupButton } from './QuickLookupButton.tsx';
import { SettingsContext } from '../hooks/settings-context.ts';
import { VocabularyContext } from '../hooks/vocabulary-context.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { apiFetch } from '../lib/api/client.ts';
import { confirmImport, previewImport } from '../lib/api/endpoints.ts';
import { buildIndex } from '../lib/vocabulary/store.ts';
import { DEFAULT_SETTINGS } from '../types/settings.ts';
import type { DictionaryEntry, ImportPreviewResponse } from '../lib/api/types.ts';
import type { LevelDataFile, VocabularyWord } from '../types/vocabulary.ts';

vi.mock('../hooks/useAuth.ts', () => ({ useAuth: vi.fn() }));
vi.mock('../lib/api/client.ts', () => ({
  apiFetch: vi.fn(),
  describeApiError: (err: unknown) => (err instanceof Error ? err.message : 'Lỗi không rõ'),
}));
vi.mock('../lib/api/endpoints.ts', () => ({
  previewImport: vi.fn(),
  confirmImport: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedApiFetch = vi.mocked(apiFetch);
const mockedPreview = vi.mocked(previewImport);
const mockedConfirm = vi.mocked(confirmImport);

type AuthState = ReturnType<typeof useAuth>;

function anonymous(): AuthState {
  return {
    user: null,
    status: 'anonymous',
    login: async () => undefined,
    logout: async () => undefined,
    isAdmin: false,
  } as AuthState;
}

function authenticated(): AuthState {
  return {
    user: {
      id: 1,
      email: 'admin@hoctiengtrung.vn',
      username: 'admin',
      displayName: 'Admin',
      roles: ['ADMIN'],
      currentHskLevel: 2,
    },
    status: 'authenticated',
    login: async () => undefined,
    logout: async () => undefined,
    isAdmin: true,
  } as AuthState;
}

/** Bộ từ cục bộ nhỏ, cố ý không khớp các truy vấn tiếng Anh dùng bên dưới. */
function makeWord(index: number): VocabularyWord {
  return {
    id: `L1-${String(index).padStart(4, '0')}`,
    simplified: `字${index}`,
    pinyin: 'zì',
    pinyinPlain: 'zi',
    hskLevel: 1,
    meanings: { vi: [`nghĩa ${index}`], en: [`meaning ${index}`] },
    aliases: { vi: [], en: [], pinyin: [] },
    examples: [],
    source: 'kiểm thử',
    datasetVersion: '1.0.0',
    translationStatus: 'machine',
    lessonId: 'L1-B01',
  };
}

const WORDS = [makeWord(1), makeWord(2)];

const FILE: LevelDataFile = {
  level: 1,
  datasetVersion: '1.0.0',
  words: WORDS,
  lessons: [
    {
      id: 'L1-B01',
      level: 1,
      index: 1,
      wordIds: WORDS.map((word) => word.id),
      range: { from: WORDS[0].simplified, to: WORDS[1].simplified },
    },
  ],
};

const index = buildIndex([FILE]);

function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsContext.Provider
      value={{
        settings: DEFAULT_SETTINGS,
        loading: false,
        update: async () => undefined,
        resolvedTheme: 'light',
      }}
    >
      <VocabularyContext.Provider
        value={{ index, loading: false, error: null, reload: () => undefined }}
      >
        {children}
      </VocabularyContext.Provider>
    </SettingsContext.Provider>
  );
}

const XUEXI: DictionaryEntry = {
  traditional: '學習',
  simplified: '学习',
  pinyinNumbered: 'xue2 xi2',
  pinyinMarked: 'xuéxí',
  definitions: ['to learn', 'to study', 'CL:個|个[ge4]'],
};

const HAO: DictionaryEntry = {
  traditional: '好',
  simplified: '好',
  pinyinNumbered: 'hao3',
  pinyinMarked: 'hǎo',
  definitions: ['good', 'well'],
};

function previewOf(overrides: Partial<ImportPreviewResponse['rows'][number]>): ImportPreviewResponse {
  return {
    summary: { total: 1, willCreate: 1, existing: 0, needsAttention: 0, errors: 0 },
    rows: [
      {
        index: 0,
        input: { simplified: '学习', pinyin: 'xuéxí', meaningVi: 'học', meaningEn: 'to learn; to study' },
        simplified: '学习',
        traditional: '學習',
        pinyin: 'xuéxí',
        pinyinNumbered: 'xue2 xi2',
        meaningVi: 'học',
        meaningEn: 'to learn; to study',
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
        ...overrides,
      },
    ],
  };
}

/** Mở hộp bằng nút rồi trả về ô tìm kiếm bên trong. */
async function openSheet(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: 'Tra từ nhanh' }));
  const dialog = await screen.findByRole('dialog', { name: 'Tra từ' });
  return within(dialog).getByRole('searchbox', { name: 'Tìm từ trong bộ HSK' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue(anonymous());
  mockedApiFetch.mockResolvedValue([]);
});

describe('nút Tra từ nhanh', () => {
  it('bấm nút thì mở hộp tra từ', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    const button = screen.getByRole('button', { name: 'Tra từ nhanh' });
    expect(button).toHaveAttribute('title', 'Tra từ Anh ↔ Trung');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(button);

    expect(await screen.findByRole('dialog', { name: 'Tra từ' })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('đóng hộp thì nút trở lại trạng thái chưa mở', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="sidebar" />
      </Providers>,
    );

    await user.click(screen.getByRole('button', { name: 'Tra từ nhanh' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tra từ' });
    await user.click(within(dialog).getByRole('button', { name: 'Đóng' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Tra từ nhanh' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('Ctrl + K mở hộp khi không gõ ở đâu cả', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.keyboard('{Control>}k{/Control}');

    expect(await screen.findByRole('dialog', { name: 'Tra từ' })).toBeInTheDocument();
  });

  it('⌘ + K trên máy Apple cũng mở', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="sidebar" />
      </Providers>,
    );

    await user.keyboard('{Meta>}K{/Meta}');

    expect(await screen.findByRole('dialog', { name: 'Tra từ' })).toBeInTheDocument();
  });

  it('không mở khi tiêu điểm đang ở ô nhập, ô văn bản hay vùng soạn thảo', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
        <input aria-label="Ô nhập thử" />
        <textarea aria-label="Ô văn bản thử" />
        <div
          contentEditable="true"
          tabIndex={0}
          aria-label="Vùng soạn thảo thử"
          role="textbox"
        />
      </Providers>,
    );

    await user.click(screen.getByRole('textbox', { name: 'Ô nhập thử' }));
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: 'Ô văn bản thử' }));
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    screen.getByRole('textbox', { name: 'Vùng soạn thảo thử' }).focus();
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('phím K trần hay kèm Shift/Alt không mở', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.keyboard('k');
    await user.keyboard('{Control>}{Shift>}k{/Shift}{/Control}');
    await user.keyboard('{Control>}{Alt>}k{/Alt}{/Control}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('khung ứng dụng có hai bản của nút thì Ctrl + K chỉ mở đúng một hộp', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="sidebar" />
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.keyboard('{Control>}k{/Control}');

    expect(await screen.findAllByRole('dialog', { name: 'Tra từ' })).toHaveLength(1);
  });

  it('bản cột trái có nhãn nhìn thấy và gợi ý phím tắt cho người đọc bằng mắt', () => {
    render(
      <Providers>
        <QuickLookupButton variant="sidebar" />
      </Providers>,
    );

    const button = screen.getByRole('button', { name: 'Tra từ nhanh' });
    expect(button).toHaveTextContent('Tra từ nhanh');
    expect(button.querySelector('kbd')).toHaveTextContent(/Ctrl K|⌘ K/);
  });
});

describe('mục Từ điển lớn (CC-CEDICT) trong hộp', () => {
  it('chưa đăng nhập thì không hỏi máy chủ và không hiện mục này', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.type(await openSheet(user), 'study');
    // Đợi qua nhịp hoãn 300 ms của hook để chắc là không có yêu cầu nào lọt ra.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockedApiFetch).not.toHaveBeenCalled();
    expect(screen.queryByText('Từ điển lớn (CC-CEDICT)')).not.toBeInTheDocument();
  });

  it('đã đăng nhập: gõ xong mới hỏi máy chủ một lần, rồi hiện mục kèm phồn thể và pinyin', async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedApiFetch.mockResolvedValue([XUEXI, HAO]);
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.type(await openSheet(user), 'study');

    expect(await screen.findByText('学习')).toBeInTheDocument();
    // Năm phím gõ liền nhau nằm trong một nhịp hoãn nên chỉ có một chuyến đi.
    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/dictionary/search?q=study&limit=15',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    const section = screen.getByRole('region', { name: 'Từ điển lớn (CC-CEDICT)' });
    expect(within(section).getByText('學習')).toBeInTheDocument();
    expect(within(section).getByText('xuéxí')).toBeInTheDocument();
    // Dòng "CL:…" là lượng từ, không phải nghĩa, nên không hiện.
    expect(within(section).getByText('to learn; to study')).toBeInTheDocument();
    expect(within(section).queryByText(/CL:/)).not.toBeInTheDocument();
    // Phồn thể trùng giản thể thì chỉ hiện một lần.
    expect(within(section).getAllByText('好')).toHaveLength(1);
    expect(
      within(section).getByRole('button', { name: 'Lưu 学习 vào từ đã học' }),
    ).toBeInTheDocument();
  });

  it('gõ tiếp thì yêu cầu cũ bị huỷ', async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    const signals: AbortSignal[] = [];
    mockedApiFetch.mockImplementation((_path, init) => {
      if (init?.signal) signals.push(init.signal);
      // Không bao giờ trả lời, để yêu cầu còn "đang bay" khi người học gõ tiếp.
      return new Promise(() => undefined);
    });
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    const input = await openSheet(user);
    await user.type(input, 'go');
    await waitFor(() => {
      expect(signals).toHaveLength(1);
    });
    expect(signals[0].aborted).toBe(false);

    await user.type(input, ' home');
    await waitFor(() => {
      expect(signals).toHaveLength(2);
    });
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    expect(mockedApiFetch).toHaveBeenLastCalledWith(
      '/dictionary/search?q=go%20home&limit=15',
      expect.anything(),
    );
  });

  it('mất mạng thì mục lặng lẽ ẩn đi, không che kết quả cục bộ', async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedApiFetch.mockRejectedValue(new Error('Không kết nối được máy chủ'));
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.type(await openSheet(user), 'study');
    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByText('Từ điển lớn (CC-CEDICT)')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Không kết nối được máy chủ')).not.toBeInTheDocument();
  });

  it('lưu một mục: hỏi nghĩa tiếng Việt, duyệt rồi xác nhận, và báo Đã thêm', async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedApiFetch.mockResolvedValue([XUEXI]);
    mockedPreview.mockResolvedValue(previewOf({}));
    mockedConfirm.mockResolvedValue({
      created: 1,
      updated: 0,
      linked: 0,
      skipped: 0,
      markedLearned: 1,
      wordIds: [10],
      errors: [],
    });
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.type(await openSheet(user), 'study');
    await user.click(await screen.findByRole('button', { name: 'Lưu 学习 vào từ đã học' }));

    // Chưa có nghĩa thì chưa lưu được.
    const saveButton = screen.getByRole('button', { name: 'Lưu' });
    expect(saveButton).toBeDisabled();
    expect(mockedPreview).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox', { name: 'Nghĩa tiếng Việt của 学习' }), 'học');
    await user.click(saveButton);

    expect(await screen.findByText('Đã thêm')).toBeInTheDocument();
    expect(mockedPreview).toHaveBeenCalledWith({
      defaultHskLevel: 2,
      rows: [{ simplified: '学习', pinyin: 'xuéxí', meaningVi: 'học', meaningEn: 'to learn; to study' }],
    });
    expect(mockedConfirm).toHaveBeenCalledWith({
      markAsLearned: true,
      rows: [
        {
          action: 'CREATE',
          simplified: '学习',
          traditional: '學習',
          pinyin: 'xuéxí',
          pinyinNumbered: 'xue2 xi2',
          meaningVi: 'học',
          meaningEn: 'to learn; to study',
          hskLevel: 2,
        },
      ],
    });
    // Người dùng bàn phím và trình đọc màn hình cũng nhận được câu báo.
    expect(screen.getByText('Đã thêm 学习 vào từ đã học.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lưu 学习 vào từ đã học' })).not.toBeInTheDocument();
  });

  it('Enter trong ô nghĩa cũng lưu; từ đã có trong hệ thống thì chỉ liên kết', async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedApiFetch.mockResolvedValue([XUEXI]);
    mockedPreview.mockResolvedValue(
      previewOf({
        status: 'EXISTS',
        suggestedAction: 'LINK',
        existingWord: {
          id: 7,
          simplified: '学习',
          pinyin: 'xuéxí',
          meaningVi: 'học',
          hskLevel: 1,
          alreadyLearned: false,
        },
      }),
    );
    mockedConfirm.mockResolvedValue({
      created: 0,
      updated: 0,
      linked: 1,
      skipped: 0,
      markedLearned: 1,
      wordIds: [7],
      errors: [],
    });
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.type(await openSheet(user), 'study');
    await user.click(await screen.findByRole('button', { name: 'Lưu 学习 vào từ đã học' }));
    await user.type(screen.getByRole('textbox', { name: 'Nghĩa tiếng Việt của 学习' }), 'học{Enter}');

    expect(await screen.findByText('Đã thêm')).toBeInTheDocument();
    expect(mockedConfirm).toHaveBeenCalledWith({
      markAsLearned: true,
      rows: [{ action: 'LINK', existingWordId: 7 }],
    });
  });

  it('máy chủ từ chối thì báo lý do ngay dưới mục và cho thử lại', async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedApiFetch.mockResolvedValue([XUEXI]);
    mockedPreview.mockRejectedValue(new Error('Phiên đăng nhập đã hết hạn'));
    const user = userEvent.setup();
    render(
      <Providers>
        <QuickLookupButton variant="header" />
      </Providers>,
    );

    await user.type(await openSheet(user), 'study');
    await user.click(await screen.findByRole('button', { name: 'Lưu 学习 vào từ đã học' }));
    await user.type(screen.getByRole('textbox', { name: 'Nghĩa tiếng Việt của 学习' }), 'học{Enter}');

    expect(await screen.findByText('Phiên đăng nhập đã hết hạn')).toBeInTheDocument();
    expect(mockedConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Lưu 学习 vào từ đã học' })).toBeInTheDocument();
  });
});
