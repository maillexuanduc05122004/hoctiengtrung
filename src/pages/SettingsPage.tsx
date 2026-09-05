/**
 * Trang cài đặt.
 *
 * Không có nút "Lưu": mỗi thay đổi ghi thẳng qua useSettings().update, vì người
 * học thường sửa một mục rồi thoát ngay, một nút lưu chỉ thêm cơ hội mất thay đổi.
 *
 * Các mục xếp theo thứ tự hay dùng nhất trước, phân tách bằng đường kẻ mảnh chứ
 * không bọc từng nhóm vào một thẻ bo tròn riêng.
 */
import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button.tsx';
import { Segmented, Toggle, type SegmentedOption } from '../components/ui/Controls.tsx';
import { Notice, Spinner } from '../components/ui/Feedback.tsx';
import { useSettings } from '../hooks/settings-context.ts';
import { useSpeech } from '../hooks/useSpeech.ts';
import {
  SPEECH_RATES,
  type DisplayMode,
  type SpeechRate,
  type ThemePreference,
} from '../types/settings.ts';
import type { HskLevel } from '../types/vocabulary.ts';

const DISPLAY_OPTIONS: readonly SegmentedOption<DisplayMode>[] = [
  { value: 'vi-zh', label: 'Việt + Trung' },
  { value: 'en-zh', label: 'Anh + Trung' },
  { value: 'vi-en-zh', label: 'Việt + Anh + Trung' },
];

const THEME_OPTIONS: readonly SegmentedOption<ThemePreference>[] = [
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
  { value: 'system', label: 'Theo hệ thống' },
];

const LEVELS: readonly HskLevel[] = [1, 2, 3];

const RATE_LABELS: Record<SpeechRate, string> = {
  0.7: '0,7× chậm',
  0.85: '0,85× vừa',
  1: '1× thường',
};

const RATE_OPTIONS: readonly SegmentedOption<string>[] = SPEECH_RATES.map((rate) => ({
  value: String(rate),
  label: RATE_LABELS[rate],
}));

/** Giới hạn hợp lý cho hai ô nhập số: đủ rộng mà không thành mục tiêu viển vông. */
const GOAL_MIN = 5;
const GOAL_MAX = 200;
const NEW_MIN = 0;
const NEW_MAX = 50;

/** Câu mẫu của nút nghe thử: đủ ngắn để nghe hết ngay, đủ dài để nhận ra giọng. */
const VOICE_SAMPLE = '你好，很高兴认识你。';

/** Đổi giá trị chuỗi của nhóm nút thành tốc độ đọc mà không phải ép kiểu. */
function toSpeechRate(value: string): SpeechRate {
  switch (value) {
    case '0.7':
      return 0.7;
    case '1':
      return 1;
    default:
      return 0.85;
  }
}

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section
      className="min-w-0 border-t border-line pt-5"
    >
      <h2
        className="text-[1rem] font-semibold text-ink"
      >
        {title}
      </h2>
      {description ? (
        <p
          className="mt-0.5 text-[0.8125rem] text-ink-faint"
        >
          {description}
        </p>
      ) : null}
      <div
        className="mt-3 min-w-0"
      >
        {children}
      </div>
    </section>
  );
}

interface NumberFieldProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}

/**
 * Ô nhập số cho mục tiêu mỗi ngày và số từ mới mỗi ngày.
 *
 * Giữ nội dung đang gõ ở dạng chuỗi để người dùng xoá trắng ô rồi gõ lại được;
 * chỉ ghi xuống cài đặt khi rời ô, và luôn kéo con số về trong khoảng cho phép.
 */
function NumberField({ label, hint, value, min, max, onCommit }: NumberFieldProps) {
  const id = useId();
  const hintId = `${id}-mo-ta`;
  const [draft, setDraft] = useState(String(value));

  const commit = (raw: string): void => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <div
      className="flex min-w-0 items-center justify-between border-b border-line py-2.5"
    >
      <div
        className="min-w-0 pr-4"
      >
        <label
          htmlFor={id}
          className="block text-[0.9375rem] font-medium text-ink"
        >
          {label}
        </label>
        <p
          id={hintId}
          className="mt-0.5 text-[0.8125rem] text-ink-faint"
        >
          {hint}
        </p>
      </div>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={draft}
        aria-describedby={hintId}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value);
        }}
        className="tap w-[5.5rem] shrink-0 rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2 text-right text-ink tabular-nums"
      />
    </div>
  );
}

export function SettingsPage() {
  const { settings, loading, update } = useSettings();
  const { supported, chineseVoices, speaking, speak, cancel } = useSpeech();
  const voiceFieldId = useId();

  // Chờ đọc xong cài đặt rồi mới vẽ, nếu không các ô sẽ nhảy từ giá trị mặc
  // định sang giá trị thật ngay trước mắt người dùng.
  if (loading) {
    return <Spinner label="Đang mở cài đặt" />;
  }

  const toggleLevel = (level: HskLevel): void => {
    const selected = settings.activeLevels.includes(level);
    // Luôn giữ lại ít nhất một cấp, nếu không hàng đợi học rỗng mà không rõ lý do.
    if (selected && settings.activeLevels.length === 1) return;
    const next = selected
      ? settings.activeLevels.filter((item) => item !== level)
      : [...settings.activeLevels, level];
    void update({ activeLevels: [...next].sort((a, b) => a - b) });
  };

  const savedVoice = settings.preferredVoiceUri;
  const savedVoiceMissing =
    savedVoice !== null && !chineseVoices.some((voice) => voice.voiceURI === savedVoice);

  const handleSample = (): void => {
    if (speaking) {
      cancel();
      return;
    }
    // speak không bao giờ reject nên chỉ cần thả trôi lời hứa.
    void speak(VOICE_SAMPLE, 'zh-CN');
  };

  return (
    <div
      className="mx-auto w-full max-w-[44rem] min-w-0"
    >
      <header
        className="mb-5"
      >
        <h1
          className="text-[1.375rem] font-semibold tracking-tight text-ink"
        >
          Cài đặt
        </h1>
        <p
          className="mt-1 text-[0.875rem] text-ink-faint"
        >
          Thay đổi được lưu ngay trên máy bạn, không gửi đi đâu cả.
        </p>
      </header>

      <div
        className="min-w-0 space-y-6"
      >
        <Section
          title="Cách hiển thị nghĩa"
          description="Chọn ngôn ngữ hiện cùng chữ Hán trên thẻ từ và trong danh sách."
        >
          <Segmented
            legend="Cách hiển thị nghĩa"
            hideLegend
            options={DISPLAY_OPTIONS}
            value={settings.displayMode}
            onChange={(displayMode) => void update({ displayMode })}
          />
        </Section>

        <Section
          title="Giao diện"
        >
          <Segmented
            legend="Chế độ sáng tối"
            options={THEME_OPTIONS}
            value={settings.theme}
            onChange={(theme) => void update({ theme })}
          />
          <div
            className="mt-3 min-w-0 border-t border-line"
          >
            <div
              className="border-b border-line"
            >
              <Toggle
                label="Ẩn pinyin"
                description="Chỉ hiện pinyin khi bạn bấm vào, để tự nhớ cách đọc trước."
                checked={settings.hidePinyin}
                onChange={(hidePinyin) => void update({ hidePinyin })}
              />
            </div>
            <div
              className="border-b border-line"
            >
              <Toggle
                label="Hiện thêm chữ phồn thể"
                description="Hiện chữ phồn thể nhỏ bên dưới khi từ viết khác chữ giản thể."
                checked={settings.showTraditional}
                onChange={(showTraditional) => void update({ showTraditional })}
              />
            </div>
          </div>
        </Section>

        <Section
          title="Cấp HSK đang học"
          description="Chọn nhiều cấp để trộn từ của các cấp với nhau."
        >
          <div
            className="flex flex-wrap items-center space-x-2"
          >
            {LEVELS.map((level) => {
              const selected = settings.activeLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleLevel(level)}
                  className={[
                    'tap rounded-[0.375rem] border px-4 py-1.5 text-[0.875rem] font-medium transition-colors duration-150',
                    selected
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line-strong bg-surface text-ink-soft hover:border-ink-faint',
                  ].join(' ')}
                >
                  {`HSK ${level}`}
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          title="Khối lượng mỗi ngày"
        >
          <div
            className="min-w-0 border-t border-line"
          >
            <NumberField
              label="Mục tiêu mỗi ngày"
              hint={`Số lượt ôn muốn hoàn thành, từ ${GOAL_MIN} đến ${GOAL_MAX}.`}
              value={settings.dailyGoal}
              min={GOAL_MIN}
              max={GOAL_MAX}
              onCommit={(dailyGoal) => void update({ dailyGoal })}
            />
            <NumberField
              label="Số từ mới mỗi ngày"
              hint={`Nhiều nhất ${NEW_MAX} từ mới mỗi ngày. Đặt 0 nếu chỉ muốn ôn.`}
              value={settings.newPerDay}
              min={NEW_MIN}
              max={NEW_MAX}
              onCommit={(newPerDay) => void update({ newPerDay })}
            />
          </div>
        </Section>

        <Section
          title="Phát âm"
          description="Giọng đọc do hệ điều hành cung cấp, ứng dụng chỉ chọn trong số đã có sẵn."
        >
          <Segmented
            legend="Tốc độ đọc"
            options={RATE_OPTIONS}
            value={String(settings.speechRate)}
            onChange={(value) => void update({ speechRate: toSpeechRate(value) })}
          />

          <div
            className="mt-4 min-w-0"
          >
            <label
              htmlFor={voiceFieldId}
              className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft"
            >
              Giọng đọc tiếng Trung
            </label>
            <select
              id={voiceFieldId}
              value={savedVoice ?? ''}
              disabled={!supported || chineseVoices.length === 0}
              onChange={(event) =>
                void update({
                  preferredVoiceUri: event.target.value === '' ? null : event.target.value,
                })
              }
              className="tap w-full min-w-0 rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2 text-ink disabled:opacity-45"
            >
              <option value="">Giọng mặc định của thiết bị</option>
              {chineseVoices.map((voice) => (
                <option
                  key={`${voice.voiceURI}|${voice.lang}`}
                  value={voice.voiceURI}
                >
                  {`${voice.name} · ${voice.lang}`}
                </option>
              ))}
              {savedVoice !== null && savedVoiceMissing ? (
                <option
                  value={savedVoice}
                >
                  Giọng đã lưu — không có trên thiết bị này
                </option>
              ) : null}
            </select>

            <div
              className="mt-3 flex min-w-0 flex-wrap items-center"
            >
              <Button
                variant="secondary"
                icon={speaking ? 'stop' : 'volume'}
                disabled={!supported}
                onClick={handleSample}
                className="mr-3"
              >
                {speaking ? 'Dừng đọc' : 'Nghe thử'}
              </Button>
              <span
                className="han min-w-0 break-words text-[1.0625rem] text-ink-soft"
              >
                {VOICE_SAMPLE}
              </span>
            </div>
          </div>

          {!supported ? (
            <div
              className="mt-4"
            >
              <Notice
                tone="warn"
                title="Trình duyệt này không đọc thành tiếng được"
              >
                Trình duyệt không có phần đọc thành tiếng của Web Speech API nên các nút nghe đều
                mờ đi. Thử mở lại bằng Chrome, Edge hoặc Safari bản mới.
              </Notice>
            </div>
          ) : chineseVoices.length === 0 ? (
            <div
              className="mt-4"
            >
              <Notice
                tone="warn"
                title="Thiết bị chưa có giọng tiếng Trung"
              >
                <p>
                  Ứng dụng chỉ dùng được giọng đã cài trong hệ điều hành. Cách thêm giọng tiếng
                  Trung:
                </p>
                <ul
                  className="mt-1.5 list-disc space-y-1 pl-5"
                >
                  <li>
                    Windows: Cài đặt → Thời gian và ngôn ngữ → Ngôn ngữ và khu vực → thêm 中文
                    (giản thể, Trung Quốc) kèm gói Giọng nói.
                  </li>
                  <li>
                    Android: Cài đặt → Quản lý chung → Văn bản sang giọng nói → tải thêm tiếng
                    Trung giản thể cho Google Text-to-speech.
                  </li>
                  <li>
                    iPhone, iPad: Cài đặt → Trợ năng → Nội dung được nói → Giọng nói → tiếng Trung
                    (Trung Quốc đại lục).
                  </li>
                </ul>
                <p
                  className="mt-1.5"
                >
                  Cài xong thì tải lại trang này để danh sách giọng hiện ra.
                </p>
              </Notice>
            </div>
          ) : null}
        </Section>

        <Section
          title="Giới hạn của Web Speech API"
          description="Nói rõ để bạn không kỳ vọng nhầm vào phần nghe và phần nói."
        >
          <ul
            className="min-w-0 list-disc space-y-2 pl-5 text-[0.875rem] text-ink-soft"
          >
            <li>
              Nhận dạng giọng nói phụ thuộc hoàn toàn vào trình duyệt. Chrome, Edge và Safari bản
              mới có hỗ trợ, Firefox thì chưa. Trên máy không hỗ trợ, phần luyện nói sẽ báo rõ là
              không dùng được chứ không im lặng bỏ qua.
            </li>
            <li>
              Ở Chrome và Edge, đoạn thu âm được gửi lên máy chủ nhận dạng của trình duyệt nên
              phần luyện nói cần có mạng. Các phần còn lại của ứng dụng vẫn chạy ngoại tuyến.
            </li>
            <li>
              Kết quả trả về chỉ là chuỗi chữ mà máy nghe được. Ứng dụng so chuỗi đó với câu mẫu
              chứ không chấm điểm phát âm chi tiết: không có điểm thanh điệu, không phân tích
              từng âm tiết.
            </li>
            <li>
              Chất lượng giọng đọc khác nhau giữa các thiết bị, vì đó là giọng của hệ điều hành
              chứ không phải giọng do ứng dụng tải về.
            </li>
            <li>
              Micro chỉ bật sau khi bạn bấm nút thu trong phần luyện nói, và tắt ngay khi xong.
            </li>
          </ul>
        </Section>

        <Section
          title="Về dữ liệu"
        >
          <p
            className="text-[0.875rem] text-ink-soft"
          >
            Nghĩa tiếng Việt trong ứng dụng là bản dịch máy, chưa qua kiểm duyệt của người bản ngữ.
          </p>
          <p
            className="mt-2"
          >
            <Link
              to="/nguon-du-lieu"
              className="text-[0.875rem] font-medium text-teal underline underline-offset-2"
            >
              Xem nguồn dữ liệu và giấy phép
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
}

export default SettingsPage;
