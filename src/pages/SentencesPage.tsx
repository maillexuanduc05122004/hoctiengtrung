/**
 * Trang "Câu của tôi".
 *
 * Tách hẳn khỏi phần còn lại của ứng dụng vì nó chạy trên MỘT VỐN TỪ KHÁC: những
 * từ người học khai là mình đã học, chứ không phải bộ HSK 3.0 chia buổi sẵn.
 * Trộn hai thứ vào nhau thì mất cả hai — bộ HSK mất tính chuẩn, còn danh sách
 * riêng thì lạc giữa 3.245 từ.
 *
 * Đây cũng là phần DUY NHẤT của ứng dụng cần máy chủ: vốn từ và câu nằm trên
 * đó để AI viết câu mới từ đúng những từ đã học. Mọi phần khác của ứng dụng
 * vẫn chạy ngoại tuyến như cũ.
 *
 * KHÔNG có bước đăng nhập. Đây là site một người dùng: bản trước tự đăng nhập
 * bằng tài khoản khách rồi mới nạp dữ liệu, tức là thêm một vòng mạng (và một
 * lần băm mật khẩu) trước khi thấy gì — mà không bảo vệ được gì. Giờ trang nạp
 * từ và câu ngay; máy chủ tự chạy request không mang token dưới tài khoản chủ
 * trang (`DefaultAccountFilter` ở backend). Còn một phiên khách cũ lưu trong
 * máy từ bản trước thì bỏ đi, nếu không dữ liệu hiện ra sẽ là của khách.
 *
 * Máy chủ miễn phí (Render) dậy chậm, nên trang KHÔNG BAO GIỜ chờ máy chủ để
 * hiện màn hình đầu: hook đưa ngay bản chụp lần trước, hoặc bộ 89 từ / 90 câu
 * đóng gói sẵn nếu chưa có bản chụp, rồi tự thử lại cho tới khi máy chủ trả
 * lời và ghi đè. Trong lúc đó chỉ ĐỌC được: bộ dự phòng mang mã giả, gửi lên
 * máy chủ là sai; và thêm từ, thêm câu, AI đằng nào cũng cần máy chủ. Nên các
 * nút ghi bị giấu hoặc khoá kèm một dòng giải thích, và mở ra ngay khi cả từ
 * lẫn câu đều đã về từ máy chủ (`serverAlive`).
 *
 * Ba thẻ theo đúng nhịp dùng: xem lại vốn từ, nghe câu ghép từ vốn từ đó, rồi
 * khi thêm từ mới hay nghe hết câu thì sang thẻ thứ ba.
 *
 * Tốc độ đọc đặt ở đây chứ không lấy từ trang cài đặt: luyện nghe câu cần chậm
 * hơn nhiều so với nghe một từ, mà đổi cài đặt chung thì ảnh hưởng cả bốn chế độ
 * luyện tập kia.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, IconButton } from '../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../components/ui/Controls.tsx';
import { Notice } from '../components/ui/Feedback.tsx';
import { LiveMessage } from '../components/ui/LiveMessage.tsx';
import { ACCOUNTS } from '../features/account/accounts.ts';
import { SearchField } from '../features/dictionary/SearchField.tsx';
import { SentenceDrill } from '../features/sentences/SentenceDrill.tsx';
import { SentenceImport } from '../features/sentences/SentenceImport.tsx';
import { WordImport } from '../features/sentences/WordImport.tsx';
import { WordTable } from '../features/sentences/WordTable.tsx';
import { newestWords } from '../features/sentences/words.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useLiveMessage } from '../hooks/useLiveMessage.ts';
import { useMySentences } from '../hooks/useMySentences.ts';
import { useMyWords } from '../hooks/useMyWords.ts';
import { describeApiError } from '../lib/api/client.ts';
import { aiStatus, deleteMyWord } from '../lib/api/endpoints.ts';
import { withRetry } from '../lib/api/retry.ts';
import type {
  AiStatus,
  GenerateSentencesRequest,
  GenerateSentencesResponse,
  SentenceInput,
  SentenceSource,
} from '../lib/api/types.ts';
import type { DataOrigin } from '../lib/storage/snapshot.ts';

type Tab = 'words' | 'drill' | 'add';

const TABS: readonly SegmentedOption<Tab>[] = [
  { value: 'words', label: 'Từ vựng' },
  { value: 'drill', label: 'Nghe câu' },
  { value: 'add', label: 'Thêm từ & câu' },
];

/** Bốn mức người học đã nêu tên. Giá trị là chuỗi vì `Segmented` nhận chuỗi. */
const RATES: readonly SegmentedOption<string>[] = [
  { value: '0.6', label: '0,6×' },
  { value: '0.75', label: '0,75×' },
  { value: '0.9', label: '0,9×' },
  { value: '1', label: '1×' },
];

/**
 * Nút AI trong phần nghe không hỏi gì thêm: xin đúng một bộ, trộn cả ba cấp, ưu
 * tiên từ mới nhất, và THAY bộ AI cũ — người học bấm nó khi đã nghe chán bộ đang
 * có, nên bộ mới thế chỗ chứ không chất thêm vào kho cho tới khi kho toàn câu cũ.
 */
const DRILL_GENERATE_COUNT = 20;

const NO_IDS: readonly number[] = [];

/** Câu nói dữ liệu đang hiện đến từ đâu khi máy chủ chưa trả lời; `server` không cần nói. */
const ORIGIN_NOTE: Record<Exclude<DataOrigin, 'server'>, string> = {
  builtin: 'Đang hiện bộ từ và câu có sẵn trong ứng dụng.',
  snapshot: 'Đang hiện dữ liệu của lần mở trước.',
};

/** Nhắc chung cho mọi chỗ ghi bị khoá trong lúc chờ. */
const WRITES_LOCKED = 'Thêm, xoá và AI sẽ mở ngay khi máy chủ trả lời.';

/** Thông báo kết quả của một thao tác dài, đứng lại cho đến khi người học đóng. */
interface PageNotice {
  tone: 'info' | 'warn' | 'error';
  title?: string;
  lines: string[];
  /** Những câu AI bị loại, kèm lý do — để người học thấy bộ lọc đã chặn ở đâu. */
  samples?: string[];
}

/** Lời báo khi trang xin thay bộ AI mà máy chủ không xác nhận: chỉ máy chủ bản cũ mới thế. */
export const OUTDATED_SERVER_LINE =
  'Máy chủ đang chạy bản cũ, chưa biết thay bộ AI — bộ mới chỉ được cộng thêm. Cần cập nhật máy chủ.';

/**
 * Dựng thông báo kết quả tạo câu. `wantedReplace` là cờ `replaceAi` trang đã
 * gửi: máy chủ bản mới luôn trả `replaced` (kể cả 0), nên xin thay mà không
 * nhận được trường đó nghĩa là máy chủ bản cũ đã bỏ qua cờ và chỉ cộng thêm.
 * Phải nói thẳng điều đó — im lặng thì người học thấy bộ cũ vẫn còn, tưởng
 * nút hỏng, trong khi lỗi nằm ở máy chủ chưa cập nhật.
 */
function describeGeneration(result: GenerateSentencesResponse, wantedReplace: boolean): PageNotice {
  const filtered: string[] = [];
  if (result.rejected > 0) filtered.push(`${result.rejected} câu bị loại vì dùng chữ chưa học.`);
  if (result.duplicates > 0) filtered.push(`${result.duplicates} câu trùng.`);
  if (result.reordered > 0) {
    filtered.push(`${result.reordered} câu chỉ là câu cũ đổi chỗ hay thay một chữ nên bỏ.`);
  }
  // `== null` vì trường tuỳ chọn có thể về `null` lẫn thiếu hẳn (xem `types.ts`).
  const outdated = wantedReplace && result.replaced == null;
  const replaced =
    (result.replaced ?? 0) > 0 ? `Đã bỏ ${result.replaced} câu AI cũ để thay bằng bộ này.` : null;
  return {
    tone: outdated || result.generated === 0 ? 'warn' : 'info',
    title: `Đã thêm ${result.generated} câu.`,
    lines: [
      ...(outdated ? [OUTDATED_SERVER_LINE] : []),
      ...(replaced !== null ? [replaced] : []),
      ...(filtered.length > 0 ? [filtered.join(' ')] : []),
      ...(result.model ? [`Mô hình: ${result.model}.`] : []),
    ],
    samples: result.rejectedSamples,
  };
}

export function SentencesPage() {
  const { user, logout } = useAuth();

  // Phiên khách còn sót từ bản cũ (trang từng tự vào bằng 1111): bỏ đi để
  // request không mang token và máy chủ dùng tài khoản chủ trang. Chỉ phiên
  // khách; người học tự đăng nhập tài khoản khác ở Cài đặt thì giữ nguyên.
  useEffect(() => {
    if (user !== null && user.username === ACCOUNTS.guest.username) {
      logout().catch(() => {
        // Máy chủ không nhận được đăng xuất cũng không sao: token đã xoá khỏi máy.
      });
    }
  }, [logout, user]);

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <h1
        className="text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Câu của tôi
      </h1>
      <Workspace />
    </div>
  );
}

/** Phần trang làm việc với máy chủ; tách riêng để hook dữ liệu gọn trong một chỗ. */
function Workspace() {
  const [tab, setTab] = useState<Tab>('words');
  const [rate, setRate] = useState('0.75');
  // Một ô tìm dùng chung cho cả từ lẫn câu: đổi thẻ vẫn giữ chữ đang gõ, vì
  // người học hay tra một từ rồi muốn xem ngay từ đó nằm trong câu nào.
  const [query, setQuery] = useState('');

  const myWords = useMyWords();
  const mySentences = useMySentences();
  const { add, remove, removeBySource, generate } = mySentences;
  const reloadWords = myWords.reload;

  const [ai, setAi] = useState<AiStatus | null>(null);
  const [notice, setNotice] = useState<PageNotice | null>(null);
  const [generating, setGenerating] = useState(false);
  // Mã câu AI vừa tạo: giữ nguyên tham chiếu giữa hai lần tạo, vì phần nghe
  // ghi nhớ "đã đổi bộ" theo tham chiếu mảng này.
  const [freshIds, setFreshIds] = useState<readonly number[]>(NO_IDS);
  const { message: liveMessage, token: liveToken, announce } = useLiveMessage();

  // Hỏi máy chủ về AI đúng một lần, kiên nhẫn như hai lượt nạp kia trong lúc
  // máy chủ thức dậy. Không hỏi được thì coi như tắt và nói rõ lý do, chứ
  // không để nút tạo câu bấm được rồi báo lỗi.
  useEffect(() => {
    const controller = new AbortController();
    withRetry((signal) => aiStatus(signal), { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setAi(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setAi({ enabled: false, model: '', reason: describeApiError(cause) });
        }
      });
    return () => controller.abort();
  }, []);

  const runGenerate = useCallback(
    async (request: GenerateSentencesRequest): Promise<void> => {
      setGenerating(true);
      setNotice(null);
      try {
        const result = await generate(request);
        setFreshIds(result.sentences.map((sentence) => sentence.id));
        setNotice(describeGeneration(result, request.replaceAi === true));
        setTab('drill');
      } catch (cause: unknown) {
        setNotice({ tone: 'error', lines: [describeApiError(cause)] });
      } finally {
        setGenerating(false);
      }
    },
    [generate],
  );

  const words = myWords.words;

  // Nút AI ở phần nghe cũng ưu tiên từ mới nhất, giống mặc định của thẻ thêm câu:
  // người học vừa thêm từ rồi sang nghe thì câu mới phải có từ đó.
  const newestHanzi = useMemo(() => newestWords(words).map((word) => word.simplified), [words]);

  const generateFromDrill = useCallback(() => {
    if (generating) return;
    const request: GenerateSentencesRequest = { count: DRILL_GENERATE_COUNT, replaceAi: true };
    if (newestHanzi.length > 0) request.focusWords = newestHanzi;
    void runGenerate(request);
  }, [generating, newestHanzi, runGenerate]);

  const handleAdd = useCallback(
    async (inputs: SentenceInput[]): Promise<boolean> => {
      try {
        const result = await add(inputs);
        // Kể cả khi không thêm được câu nào cũng phải nói ra, nếu không người
        // học bấm "Thêm" rồi thấy màn hình y như cũ và không hiểu vì sao.
        const parts: string[] = [];
        if (result.added > 0) parts.push(`Đã thêm ${result.added} câu.`);
        if (result.duplicates > 0) parts.push(`${result.duplicates} câu đã có sẵn nên bỏ qua.`);
        if (parts.length === 0) parts.push('Không có câu nào mới.');
        setNotice({ tone: result.added > 0 ? 'info' : 'warn', lines: [parts.join(' ')] });
        setTab('drill');
        return true;
      } catch (cause: unknown) {
        setNotice({ tone: 'error', lines: [describeApiError(cause)] });
        return false;
      }
    },
    [add],
  );

  const handleRemoveSentence = useCallback(
    (id: number) => {
      remove(id)
        .then(() => announce('Đã xoá câu.'))
        .catch((cause: unknown) => setNotice({ tone: 'error', lines: [describeApiError(cause)] }));
    },
    [announce, remove],
  );

  const handleRemoveBySource = useCallback(
    async (source: SentenceSource): Promise<void> => {
      try {
        const result = await removeBySource(source);
        announce(result.message);
      } catch (cause: unknown) {
        setNotice({ tone: 'error', lines: [describeApiError(cause)] });
      }
    },
    [announce, removeBySource],
  );

  const handleRemoveWord = useCallback(
    (wordId: number) => {
      const word = words.find((item) => item.wordId === wordId);
      deleteMyWord(wordId)
        .then(() => {
          announce(
            word ? `Đã bỏ ${word.simplified} khỏi danh sách đã học.` : 'Đã bỏ từ khỏi danh sách.',
          );
          reloadWords();
        })
        .catch((cause: unknown) => setNotice({ tone: 'error', lines: [describeApiError(cause)] }));
    },
    [announce, words, reloadWords],
  );

  const handleImported = useCallback(() => {
    reloadWords();
  }, [reloadWords]);

  const reloadSentences = mySentences.reload;
  const reloadAll = useCallback(() => {
    reloadWords();
    reloadSentences();
  }, [reloadSentences, reloadWords]);

  const sentences = mySentences.sentences;
  const loadError = myWords.error ?? mySentences.error;
  const refreshing = myWords.loading || mySentences.loading;
  // Cả từ lẫn câu đều đã về từ máy chủ trong phiên này: mã là mã thật, ghi được.
  const serverAlive = myWords.origin === 'server' && mySentences.origin === 'server';
  // Nguồn đang hiện khi chưa có máy chủ. Hai hook có thể lệch nhau (một bên đã
  // về); lấy bên chưa về để câu giải thích đúng với thứ còn đang là bản tạm.
  const shownOrigin: Exclude<DataOrigin, 'server'> | null =
    myWords.origin !== 'server'
      ? myWords.origin
      : mySentences.origin !== 'server'
        ? mySentences.origin
        : null;

  return (
    <>
      <p
        className="mt-1 mb-4 text-[0.9375rem] text-ink-soft"
      >
        {words.length} từ bạn đã học và {sentences.length} câu ghép từ chính những từ đó.
        {ai?.enabled ? ` · AI: ${ai.model}` : ''}
        {refreshing && serverAlive ? (
          <span
            className="ml-2 text-[0.8125rem] text-ink-faint"
          >
            Đang cập nhật từ máy chủ…
          </span>
        ) : null}
      </p>

      {/*
        Chưa có máy chủ thì nói thẳng đang hiện gì và vì sao chưa ghi được,
        thay vì để nút xoá biến mất không lời. Lỗi hẳn (hết lượt tự thử lại)
        thì đổi giọng và đưa nút thử lại ngay trong khung.
      */}
      {shownOrigin !== null ? (
        <div
          className="mb-4"
        >
          {loadError !== null ? (
            <Notice
              tone="error"
              title="Chưa lấy được từ và câu từ máy chủ"
            >
              <p>{loadError}</p>
              <p>
                {ORIGIN_NOTE[shownOrigin]} {WRITES_LOCKED}
              </p>
              <div
                className="mt-2"
              >
                <Button
                  variant="secondary"
                  icon="refresh"
                  onClick={reloadAll}
                >
                  Thử lại
                </Button>
              </div>
            </Notice>
          ) : (
            <Notice
              tone="info"
              title="Máy chủ đang thức dậy…"
            >
              {ORIGIN_NOTE[shownOrigin]} {WRITES_LOCKED}
            </Notice>
          )}
        </div>
      ) : null}

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

      <LiveMessage
        message={liveMessage}
        token={liveToken}
      />

      {serverAlive && loadError !== null ? (
        <div
          className="mb-4"
        >
          <Notice tone="error">
            <p>{loadError}</p>
            <div
              className="mt-2"
            >
              <Button
                variant="secondary"
                icon="refresh"
                onClick={reloadAll}
              >
                Thử lại
              </Button>
            </div>
          </Notice>
        </div>
      ) : null}

      {notice !== null ? (
        <div
          className="mb-4 flex items-start"
        >
          <div
            className="min-w-0 flex-1"
          >
            <Notice
              tone={notice.tone}
              title={notice.title}
            >
              {notice.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {notice.samples && notice.samples.length > 0 ? (
                <ul
                  className="mt-1 list-disc pl-5"
                >
                  {notice.samples.map((sample, i) => (
                    <li
                      key={`${i}-${sample}`}
                      lang="zh-CN"
                    >
                      {sample}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Notice>
          </div>
          <span
            className="ml-1 shrink-0"
          >
            <IconButton
              icon="close"
              label="Đóng thông báo"
              iconSize={1}
              onClick={() => setNotice(null)}
            />
          </span>
        </div>
      ) : null}

      {/*
        Ô tìm dính ở mép trên khi cuộn. Trên điện thoại phải nằm dưới thanh tiêu
        đề 4rem của khung ứng dụng; z-index thấp hơn thanh đó để phần chồng lấn
        một pixel ở đường viền nằm khuất bên dưới. Nền `paper` để nội dung cuộn
        qua không lộ ra sau ô nhập.
      */}
      {tab === 'add' ? null : (
        <div
          className="sticky top-0 z-10 -mt-2 mb-4 bg-paper pt-2 pb-2 xsm:top-[4rem]"
        >
          <SearchField
            value={query}
            onChange={setQuery}
            label={tab === 'words' ? 'Tìm từ' : 'Tìm câu'}
            placeholder={
              tab === 'words'
                ? 'Chữ Hán, pinyin hoặc nghĩa'
                : 'Tìm câu theo chữ Hán, pinyin hoặc nghĩa'
            }
          />
        </div>
      )}

      {tab === 'words' ? (
        <WordTable
          words={words}
          rate={Number(rate)}
          query={query}
          onRemove={serverAlive ? handleRemoveWord : undefined}
        />
      ) : null}

      {tab === 'drill' ? (
        <SentenceDrill
          sentences={sentences}
          rate={Number(rate)}
          query={query}
          onRemove={handleRemoveSentence}
          aiEnabled={ai?.enabled === true}
          waiting={!serverAlive}
          onGenerate={generateFromDrill}
          generating={generating}
          freshIds={freshIds}
        />
      ) : null}

      {tab === 'add' && !serverAlive ? (
        <Notice
          tone="info"
          title="Phần thêm từ và câu cần máy chủ"
        >
          Máy chủ miễn phí đang thức dậy — thường mất dưới một phút. Phần này tự mở khi máy chủ
          trả lời; trong lúc chờ vẫn xem từ và nghe câu được.
        </Notice>
      ) : null}

      {tab === 'add' && serverAlive ? (
        <>
          <WordImport
            ai={ai}
            onImported={handleImported}
          />
          <SentenceImport
            words={words}
            sentences={sentences}
            ai={ai}
            generating={generating}
            onGenerate={runGenerate}
            onAdd={handleAdd}
            onRemoveBySource={handleRemoveBySource}
          />
        </>
      ) : null}
    </>
  );
}

export default SentencesPage;
