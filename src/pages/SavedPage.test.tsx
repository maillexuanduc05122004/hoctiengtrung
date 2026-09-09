/**
 * Kiểm thử dựng thật hai màn hình mới của sổ tay.
 *
 * Mục đích không phải soi từng dòng chữ mà là bắt những lỗi chỉ lộ ra khi chạy:
 * hook gọi sai thứ tự, đọc kho hỏng, hay một danh sách rỗng làm vỡ trang. Đây
 * cũng là đường đi mà người học than phiền nhất — lưu xong rồi tìm lại ở đâu.
 */
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { SavedPage } from './SavedPage.tsx';
import { LessonsPage } from './LessonsPage.tsx';
import { SettingsContext } from '../hooks/settings-context.ts';
import { VocabularyContext } from '../hooks/vocabulary-context.ts';
import { buildIndex } from '../lib/vocabulary/store.ts';
import { resetDatabase, saveLesson, toggleStar } from '../db/index.ts';
import { DEFAULT_SETTINGS } from '../types/settings.ts';
import type { HskLevel, LevelDataFile, VocabularyWord } from '../types/vocabulary.ts';

function makeWord(index: number, level: HskLevel = 1): VocabularyWord {
  const id = `L${level}-${String(index).padStart(4, '0')}`;
  return {
    id,
    simplified: `字${index}`,
    pinyin: 'zì',
    pinyinPlain: 'zi',
    hskLevel: level,
    meanings: { vi: [`nghĩa ${index}`], en: [`meaning ${index}`] },
    aliases: { vi: [], en: [], pinyin: [] },
    examples: [],
    source: 'kiểm thử',
    datasetVersion: '1.0.0',
    translationStatus: 'machine',
    lessonId: `L${level}-B0${index <= 10 ? 1 : 2}`,
  };
}

const WORDS = Array.from({ length: 20 }, (_, i) => makeWord(i + 1));

const FILE: LevelDataFile = {
  level: 1,
  datasetVersion: '1.0.0',
  words: WORDS,
  lessons: [
    {
      id: 'L1-B01',
      level: 1,
      index: 1,
      wordIds: WORDS.slice(0, 10).map((word) => word.id),
      range: { from: WORDS[0].simplified, to: WORDS[9].simplified },
    },
    {
      id: 'L1-B02',
      level: 1,
      index: 2,
      wordIds: WORDS.slice(10).map((word) => word.id),
      range: { from: WORDS[10].simplified, to: WORDS[19].simplified },
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
        <MemoryRouter>{children}</MemoryRouter>
      </VocabularyContext.Provider>
    </SettingsContext.Provider>
  );
}

beforeEach(async () => {
  await resetDatabase();
});

describe('trang Sổ tay', () => {
  it('người chưa lưu gì được chỉ đúng việc cần làm để có từ trong sổ tay', async () => {
    render(
      <Providers>
        <SavedPage />
      </Providers>,
    );

    expect(await screen.findByText('Sổ tay còn trống')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mở trang tra từ' })).toBeInTheDocument();
  });

  it('hiện các từ đã lưu kèm đường vào phiên ôn riêng cho chúng', async () => {
    await toggleStar('L1-0003', { at: 1_000 });
    await toggleStar('L1-0007', { at: 2_000 });

    render(
      <Providers>
        <SavedPage />
      </Providers>,
    );

    // Mới lưu trước cũ sau, nên 字7 phải đứng trên 字3.
    const saved = await screen.findAllByText(/^字[37]$/);
    expect(saved.map((node) => node.textContent)).toEqual(['字7', '字3']);

    const study = screen.getByRole('link', { name: 'Ôn các từ đã lưu' });
    expect(study).toHaveAttribute('href', '/the?pool=starred');
  });

  it('bỏ lưu một từ ngay trên danh sách thì từ đó rời sổ tay', async () => {
    await toggleStar('L1-0003', { at: 1_000 });
    const user = userEvent.setup();

    render(
      <Providers>
        <SavedPage />
      </Providers>,
    );

    await user.click(await screen.findByRole('button', { name: 'Bỏ lưu từ 字3' }));

    await waitFor(() => {
      expect(screen.getByText('Sổ tay còn trống')).toBeInTheDocument();
    });
  });

  it('buổi học đã lưu nằm ở thẻ riêng, không lẫn với từ', async () => {
    await saveLesson('L1-B02', { at: 5_000 });
    const user = userEvent.setup();

    render(
      <Providers>
        <SavedPage />
      </Providers>,
    );

    await user.click(await screen.findByRole('radio', { name: /Buổi học đã lưu, 1 buổi/ }));

    expect(await screen.findByRole('link', { name: /Buổi 2/ })).toBeInTheDocument();
  });
});

describe('trang Buổi học', () => {
  it('mời người mới vào buổi đầu tiên và cho lọc theo trạng thái', async () => {
    render(
      <Providers>
        <LessonsPage />
      </Providers>,
    );

    expect(await screen.findByText('Buổi tiếp theo')).toBeInTheDocument();
    // Bộ lọc phải nói ra số buổi chứ không chỉ có nhãn trần — nhưng chỉ sau khi
    // đọc xong tiến độ, vì trước đó mọi con số đều là 0 và sẽ nói sai.
    expect(await screen.findByRole('radio', { name: 'Tất cả, 2 buổi' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Chưa học, 2 buổi' })).toBeInTheDocument();
  });

  it('nhảy thẳng tới buổi số N bằng ô nhập', async () => {
    const user = userEvent.setup();

    render(
      <Providers>
        <LessonsPage />
      </Providers>,
    );

    const field = await screen.findByLabelText('Tới thẳng buổi số (1–2)');
    await user.type(field, '9');
    await user.click(screen.getByRole('button', { name: 'Tới' }));

    expect(await screen.findByText('Cấp này chỉ có 2 buổi')).toBeInTheDocument();
  });

  it('lưu một buổi ngay trên danh sách', async () => {
    const user = userEvent.setup();

    render(
      <Providers>
        <LessonsPage />
      </Providers>,
    );

    await user.click(await screen.findByRole('button', { name: 'Lưu Buổi 2 vào sổ tay' }));

    expect(await screen.findByText('Đã lưu buổi 2 vào sổ tay')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Bỏ lưu Buổi 2' })).toBeInTheDocument();
  });
});
