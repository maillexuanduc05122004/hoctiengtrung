/**
 * Trang tra từ.
 *
 * Hai cách dùng nằm chung một trang vì cùng trả lời một câu hỏi "từ này là gì":
 * gõ vài chữ để tra một từ, hoặc dán cả đoạn để xem đoạn đó gồm những từ nào.
 * Phần tìm kiếm dùng chung <DictionarySearch> với hộp trượt giữa giờ học nên
 * hai nơi luôn tìm giống hệt nhau.
 *
 * Mở chi tiết một từ ở đâu cũng được ghi vào lịch sử tra từ, và lịch sử đó nằm
 * ngay dưới ô tìm kiếm khi ô còn trống.
 *
 * Không tự lấy tiêu điểm cho ô nhập: trên điện thoại việc đó bật bàn phím ngay
 * khi mở trang và che mất danh sách bên dưới.
 */
import { useCallback, useState } from 'react';
import { Segmented, type SegmentedOption } from '../components/ui/Controls.tsx';
import { recordLookup } from '../db/index.ts';
import { DictionarySearch } from '../features/dictionary/DictionarySearch.tsx';
import { TextScanner } from '../features/dictionary/TextScanner.tsx';
import { WordDetailSheet } from '../features/dictionary/WordDetailSheet.tsx';
import type { LookupSource } from '../types/study.ts';
import type { VocabularyWord } from '../types/vocabulary.ts';

type DictionaryTab = 'search' | 'scan';

const TABS: readonly SegmentedOption<DictionaryTab>[] = [
  { value: 'search', label: 'Tra từ' },
  { value: 'scan', label: 'Quét đoạn văn' },
];

/** Thẻ nào đang mở thì lượt tra được ghi nhận là đến từ đó. */
const TAB_SOURCE: Record<DictionaryTab, LookupSource> = {
  search: 'search',
  scan: 'scan',
};

export function DictionaryPage() {
  const [tab, setTab] = useState<DictionaryTab>('search');
  const [selected, setSelected] = useState<VocabularyWord | null>(null);

  /**
   * Mở chi tiết một từ chính là hành động "tra từ" của người học, nên đây là chỗ
   * ghi lịch sử. Ghi xuống kho là việc chạy nền: hộp chi tiết phải mở ra ngay
   * chứ không đợi IndexedDB, và lỗi ghi không được làm hỏng thao tác đang làm.
   */
  const handleSelect = useCallback(
    (word: VocabularyWord) => {
      setSelected(word);
      void recordLookup(word.id, { source: TAB_SOURCE[tab] });
    },
    [tab],
  );

  return (
    <div
      className="mx-auto w-full max-w-[46rem] min-w-0"
    >
      <h1
        className="mb-3 text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Tra từ
      </h1>

      <div
        className="mb-4"
      >
        <Segmented
          legend="Cách tra"
          options={TABS}
          value={tab}
          onChange={setTab}
          hideLegend
        />
      </div>

      {tab === 'search' ? (
        <DictionarySearch onSelect={handleSelect} />
      ) : (
        <TextScanner onSelect={handleSelect} />
      )}

      <WordDetailSheet
        word={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

export default DictionaryPage;
