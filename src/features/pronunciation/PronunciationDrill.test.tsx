/**
 * Luyện phát âm đi đúng một vòng với AI: bấm ghi âm → đọc → "Xong" → bản ghi
 * gửi đi kèm từng âm tiết của câu → hiện điểm, chữ sai và mẹo sửa, nghe lại
 * được giọng mình. Ghi âm và máy chủ đều được giả lập.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assessPronunciation } from '../../lib/api/endpoints.ts';
import type { PronounceSentence } from './PronunciationDrill.tsx';
import { PronunciationDrill } from './PronunciationDrill.tsx';
import { expectedSyllables } from './syllables.ts';

vi.mock('../../lib/api/endpoints.ts', () => ({ assessPronunciation: vi.fn() }));
vi.mock('../../lib/audio/recorder.ts', () => ({
  isRecordingSupported: () => true,
  describeMicError: () => 'Không mở được micro.',
  createVoiceRecorder: () => ({
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(new Blob(['x'], { type: 'audio/webm' })),
    cancel: () => undefined,
  }),
  recordingToWav: () =>
    Promise.resolve({ base64: 'UklGRg==', mimeType: 'audio/wav', seconds: 4, level: 0.1 }),
}));

const HANZI = '我平常七点起床。';
const PINYIN = 'Wǒ píngcháng qī diǎn qǐchuáng.';
const SENTENCE: PronounceSentence = {
  id: 'bai-06:ghep:18',
  lessonId: 'bai-06',
  lessonNumber: 6,
  source: 'ghep',
  hanzi: HANZI,
  pinyin: PINYIN,
  vi: 'Bình thường tôi dậy lúc bảy giờ.',
  newWords: ['平常'],
  syllables: expectedSyllables(HANZI, PINYIN) ?? [],
};

const mocked = vi.mocked(assessPronunciation);

beforeEach(() => {
  mocked.mockReset();
  URL.createObjectURL = vi.fn(() => 'blob:giong-doc');
  URL.revokeObjectURL = vi.fn();
});

describe('PronunciationDrill', () => {
  it('ghi âm, gửi AI chấm từng âm tiết rồi hiện điểm và mẹo sửa', async () => {
    mocked.mockResolvedValue({
      heardHanzi: '我平常七点起床',
      heardPinyin: 'wǒ píngcháng qì diǎn qǐchuáng',
      score: 86,
      summary: 'Đọc khá tốt, chỉ sai thanh chữ 七.',
      syllables: SENTENCE.syllables.map((syllable, i) => ({
        hanzi: syllable.hanzi,
        expected: syllable.pinyin,
        heard: i === 3 ? 'qì' : syllable.pinyin,
        ok: i !== 3,
        issue: i === 3 ? 'tone' : 'none',
        tip: i === 3 ? '七 là thanh 1: giữ giọng cao và ngang.' : '',
      })),
      model: 'thu',
    });
    const user = userEvent.setup();
    render(
      <PronunciationDrill
        sentences={[SENTENCE]}
        tutor={{ state: 'ready' }}
        onNewRound={vi.fn()}
      />,
    );

    expect(screen.getByText('Bình thường tôi dậy lúc bảy giờ.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bấm rồi đọc to cả câu' }));
    await user.click(await screen.findByRole('button', { name: 'Xong, chấm đi' }));

    expect(await screen.findByText('Đọc khá tốt, chỉ sai thanh chữ 七.')).toBeInTheDocument();
    expect(screen.getByText('86')).toBeInTheDocument();
    expect(screen.getByText('七 là thanh 1: giữ giọng cao và ngang.')).toBeInTheDocument();
    expect(screen.getByText(/bạn đọc thành qì/)).toBeInTheDocument();
    expect(document.querySelector('audio')?.getAttribute('src')).toBe('blob:giong-doc');

    expect(mocked).toHaveBeenCalledWith(
      {
        hanzi: HANZI,
        syllables: SENTENCE.syllables,
        audioBase64: 'UklGRg==',
        mimeType: 'audio/wav',
      },
      expect.any(AbortSignal),
    );
    expect(SENTENCE.syllables[3]).toEqual({ hanzi: '七', pinyin: 'qī' });
  });

  it('máy chủ báo lỗi thì nói rõ và cho đọc lại', async () => {
    mocked.mockRejectedValue(new Error('AI đang quá tải, thử lại sau ít phút'));
    const user = userEvent.setup();
    render(
      <PronunciationDrill
        sentences={[SENTENCE]}
        tutor={{ state: 'ready' }}
        onNewRound={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Bấm rồi đọc to cả câu' }));
    await user.click(await screen.findByRole('button', { name: 'Xong, chấm đi' }));
    expect(await screen.findByText('AI đang quá tải, thử lại sau ít phút')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đọc lại câu này' })).toBeInTheDocument();
  });
});
