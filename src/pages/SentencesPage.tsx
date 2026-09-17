/**
 * Trang "Câu của tôi".
 *
 * Tách hẳn khỏi phần còn lại của ứng dụng vì nó chạy trên MỘT VỐN TỪ KHÁC: 89 từ
 * người học khai là mình đã học, chứ không phải bộ HSK 3.0 chia buổi sẵn. Trộn
 * hai thứ vào nhau thì mất cả hai — bộ HSK mất tính chuẩn, còn danh sách riêng
 * thì lạc giữa 2.245 từ.
 *
 * Ba thẻ theo đúng nhịp dùng: xem lại vốn từ, nghe câu ghép từ vốn từ đó, rồi
 * khi nghe hết thì xin thêm câu mới.
 *
 * Tốc độ đọc đặt ở đây chứ không lấy từ trang cài đặt: luyện nghe câu cần chậm
 * hơn nhiều so với nghe một từ, mà đổi cài đặt chung thì ảnh hưởng cả bốn chế độ
 * luyện tập kia.
 */
import { useCallback, useMemo, useState } from 'react';
import { Segmented, type SegmentedOption } from '../components/ui/Controls.tsx';
import { MY_SENTENCES, MY_WORDS } from '../features/sentences/corpus.ts';
import { sentenceKey } from '../features/sentences/parse.ts';
import type { ParsedSentence } from '../features/sentences/parse.ts';
import { SentenceDrill } from '../features/sentences/SentenceDrill.tsx';
import { SentenceImport } from '../features/sentences/SentenceImport.tsx';
import {
  addStoredSentences,
  clearStoredSentences,
  loadStoredSentences,
  removeStoredSentence,
} from '../features/sentences/store.ts';
import type { StoredSentence } from '../features/sentences/store.ts';
import { WordTable } from '../features/sentences/WordTable.tsx';

type Tab = 'words' | 'drill' | 'add';

const TABS: readonly SegmentedOption<Tab>[] = [
  { value: 'words', label: 'Từ vựng' },
  { value: 'drill', label: 'Nghe câu' },
  { value: 'add', label: 'Thêm câu' },
];

/** Bốn mức người học đã nêu tên. Giá trị là chuỗi vì `Segmented` nhận chuỗi. */
const RATES: readonly SegmentedOption<string>[] = [
  { value: '0.6', label: '0,6×' },
  { value: '0.75', label: '0,75×' },
  { value: '0.9', label: '0,9×' },
  { value: '1', label: '1×' },
];

export function SentencesPage() {
  const [tab, setTab] = useState<Tab>('words');
  const [rate, setRate] = useState('0.75');
  // Đọc ngay ở lần dựng đầu tiên. Ứng dụng không dựng phía máy chủ nên
  // localStorage đã sẵn sàng, và làm thế thì danh sách không nháy từ rỗng sang
  // đủ câu ngay sau lần vẽ đầu.
  const [stored, setStored] = useState<StoredSentence[]>(loadStoredSentences);
  const [notice, setNotice] = useState('');

  const all = useMemo(() => [...MY_SENTENCES, ...stored], [stored]);

  const handleAdd = useCallback(
    (incoming: readonly ParsedSentence[]) => {
      const keys = new Set(all.map((sentence) => sentenceKey(sentence.hanzi)));
      const result = addStoredSentences(incoming, keys);
      if (result.added.length > 0) setStored((current) => [...current, ...result.added]);
      // Kể cả khi không thêm được câu nào cũng phải nói ra, nếu không người học
      // bấm "Thêm" rồi thấy màn hình y như cũ và không hiểu vì sao.
      const parts: string[] = [];
      if (result.added.length > 0) parts.push(`Đã thêm ${result.added.length} câu.`);
      if (result.duplicates > 0) parts.push(`${result.duplicates} câu đã có sẵn nên bỏ qua.`);
      if (result.overflow > 0) parts.push(`${result.overflow} câu vượt giới hạn kho.`);
      if (!result.saved) parts.push('Trình duyệt không cho lưu — câu chỉ còn trong phiên này.');
      if (parts.length === 0) parts.push('Không có câu nào mới.');
      setNotice(parts.join(' '));
      setTab('drill');
    },
    [all],
  );

  const handleRemove = useCallback((id: string) => {
    setStored(removeStoredSentence(id));
  }, []);

  const handleClear = useCallback(() => {
    clearStoredSentences();
    setStored([]);
    setNotice('Đã xoá hết câu tự thêm.');
  }, []);

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <h1
        className="text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Câu của tôi
      </h1>
      <p
        className="mt-1 mb-4 text-[0.9375rem] text-ink-soft"
      >
        {MY_WORDS.length} từ bạn đã học và {all.length} câu ghép từ chính những từ đó.
      </p>

      <div
        className="mb-4 flex flex-wrap items-end justify-between"
      >
        <span
          className="mr-3 mb-2"
        >
          <Segmented
            legend="Phần"
            options={TABS}
            value={tab}
            onChange={setTab}
            hideLegend
          />
        </span>
        {tab === 'add' ? null : (
          <span
            className="mb-2"
          >
            <Segmented
              legend="Tốc độ đọc"
              options={RATES}
              value={rate}
              onChange={setRate}
            />
          </span>
        )}
      </div>

      {notice === '' ? null : (
        <p
          role="status"
          className="mb-4 border border-line rounded-[0.375rem] bg-sunken px-3 py-2 text-[0.875rem] text-ink-soft"
        >
          {notice}
        </p>
      )}

      {tab === 'words' ? <WordTable rate={Number(rate)} /> : null}

      {tab === 'drill' ? (
        <SentenceDrill
          builtIn={MY_SENTENCES}
          stored={stored}
          rate={Number(rate)}
          onRemoveStored={handleRemove}
        />
      ) : null}

      {tab === 'add' ? (
        <SentenceImport
          existing={all}
          onAdd={handleAdd}
          onClearStored={handleClear}
          storedCount={stored.length}
        />
      ) : null}
    </div>
  );
}

export default SentencesPage;
