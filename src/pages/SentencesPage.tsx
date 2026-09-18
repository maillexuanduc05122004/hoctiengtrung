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
 * Không bắt ai gõ tài khoản: mở trang khi chưa đăng nhập thì tự vào bằng tài
 * khoản khách (`ACCOUNTS.guest`) đúng một lần cho mỗi lần dựng trang. Chỉ khi
 * không vào được mới hiện ô đăng nhập — ô đó liệt kê sẵn cả hai tài khoản. Chủ
 * trang đang ở tài khoản khách thì có một nút để chuyển sang tài khoản của mình.
 *
 * Ba thẻ theo đúng nhịp dùng: xem lại vốn từ, nghe câu ghép từ vốn từ đó, rồi
 * khi thêm từ mới hay nghe hết câu thì sang thẻ thứ ba.
 *
 * Tốc độ đọc đặt ở đây chứ không lấy từ trang cài đặt: luyện nghe câu cần chậm
 * hơn nhiều so với nghe một từ, mà đổi cài đặt chung thì ảnh hưởng cả bốn chế độ
 * luyện tập kia.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../components/ui/Controls.tsx';
import { Notice, Spinner } from '../components/ui/Feedback.tsx';
import { LiveMessage } from '../components/ui/LiveMessage.tsx';
import { ACCOUNTS } from '../features/account/accounts.ts';
import { LoginCard } from '../features/account/LoginCard.tsx';
import { describeLoginError } from '../features/account/login-error.ts';
import { SearchField } from '../features/dictionary/SearchField.tsx';
import { SentenceDrill } from '../features/sentences/SentenceDrill.tsx';
import { SentenceImport } from '../features/sentences/SentenceImport.tsx';
import { WordImport } from '../features/sentences/WordImport.tsx';
import { WordTable } from '../features/sentences/WordTable.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { useLiveMessage } from '../hooks/useLiveMessage.ts';
import { useMySentences } from '../hooks/useMySentences.ts';
import { useMyWords } from '../hooks/useMyWords.ts';
import { describeApiError } from '../lib/api/client.ts';
import { aiStatus, deleteMyWord } from '../lib/api/endpoints.ts';
import type {
  AiStatus,
  GenerateSentencesRequest,
  GenerateSentencesResponse,
  SentenceInput,
  SentenceSource,
} from '../lib/api/types.ts';

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

/** Nút AI trong phần nghe không hỏi gì thêm: xin đúng một bộ, trộn cả ba cấp. */
const DRILL_GENERATE_COUNT = 20;

const LOGIN_DESCRIPTION =
  'Phần này lưu từ bạn đã học trên máy chủ và dùng AI viết câu mới, nên cần đăng nhập.';

const GUEST_NOTICE =
  `Bạn đang dùng tài khoản khách (${ACCOUNTS.guest.username}) — ` +
  'từ và câu ở đây dùng chung với mọi khách.';

const NO_IDS: readonly number[] = [];

/** Thông báo kết quả của một thao tác dài, đứng lại cho đến khi người học đóng. */
interface PageNotice {
  tone: 'info' | 'warn' | 'error';
  title?: string;
  lines: string[];
  /** Những câu AI bị loại, kèm chữ lạ — để người học thấy bộ lọc đã chặn ở đâu. */
  samples?: string[];
}

function describeGeneration(result: GenerateSentencesResponse): PageNotice {
  return {
    tone: result.generated > 0 ? 'info' : 'warn',
    title: `Đã thêm ${result.generated} câu.`,
    lines: [
      `${result.rejected} câu bị loại vì dùng chữ chưa học. ${result.duplicates} câu trùng.`,
      ...(result.model ? [`Mô hình: ${result.model}.`] : []),
    ],
    samples: result.rejectedSamples,
  };
}

export function SentencesPage() {
  const { status, user, login, logout } = useAuth();
  // Tự vào bằng tài khoản khách đúng một lần cho mỗi lần dựng trang. Ref chứ
  // không phải state: StrictMode chạy effect hai lần nhưng ref thì giữ nguyên.
  const guestTried = useRef(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (status !== 'anonymous' || guestTried.current) return;
    guestTried.current = true;
    login(ACCOUNTS.guest.username, ACCOUNTS.guest.password).catch((cause: unknown) => {
      setAuthError(describeLoginError(cause));
    });
  }, [login, status]);

  const switchToOwner = async (): Promise<void> => {
    if (switching) return;
    // Đăng xuất làm trang về trạng thái chưa đăng nhập; đánh dấu để effect
    // trên không nhảy vào tranh đăng nhập lại bằng tài khoản khách.
    guestTried.current = true;
    setSwitching(true);
    setAuthError(null);
    try {
      await logout();
      await login(ACCOUNTS.owner.username, ACCOUNTS.owner.password);
    } catch (cause: unknown) {
      setAuthError(describeLoginError(cause));
    } finally {
      setSwitching(false);
    }
  };

  const isGuest = user !== null && user.username === ACCOUNTS.guest.username;

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <h1
        className="text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Câu của tôi
      </h1>

      {status === 'anonymous' ? (
        authError === null ? (
          <Spinner
            label={
              switching
                ? `Đang chuyển sang tài khoản ${ACCOUNTS.owner.username}`
                : 'Đang vào bằng tài khoản khách'
            }
          />
        ) : (
          <div
            className="mt-4 max-w-[28rem]"
          >
            <div
              className="mb-4"
            >
              <Notice
                tone="error"
                title="Không tự đăng nhập được"
              >
                {authError}
              </Notice>
            </div>
            <LoginCard description={LOGIN_DESCRIPTION} />
          </div>
        )
      ) : (
        <>
          {isGuest ? (
            <div
              className="mt-3"
            >
              <Notice
                tone="info"
              >
                <p>{GUEST_NOTICE}</p>
                <div
                  className="mt-2"
                >
                  <Button
                    variant="secondary"
                    disabled={switching}
                    onClick={() => void switchToOwner()}
                  >
                    {`Dùng tài khoản của tôi (${ACCOUNTS.owner.username})`}
                  </Button>
                </div>
              </Notice>
            </div>
          ) : null}
          <Workspace />
        </>
      )}
    </div>
  );
}

/** Phần trang dành cho người đã đăng nhập; tách riêng để hook dữ liệu chỉ chạy khi cần. */
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

  // Hỏi máy chủ về AI đúng một lần. Không hỏi được thì coi như tắt và nói rõ
  // lý do, chứ không để nút tạo câu bấm được rồi báo lỗi.
  useEffect(() => {
    let active = true;
    aiStatus()
      .then((result) => {
        if (active) setAi(result);
      })
      .catch((cause: unknown) => {
        if (active) setAi({ enabled: false, model: '', reason: describeApiError(cause) });
      });
    return () => {
      active = false;
    };
  }, []);

  const runGenerate = useCallback(
    async (request: GenerateSentencesRequest): Promise<void> => {
      setGenerating(true);
      setNotice(null);
      try {
        const result = await generate(request);
        setFreshIds(result.sentences.map((sentence) => sentence.id));
        setNotice(describeGeneration(result));
        setTab('drill');
      } catch (cause: unknown) {
        setNotice({ tone: 'error', lines: [describeApiError(cause)] });
      } finally {
        setGenerating(false);
      }
    },
    [generate],
  );

  const generateFromDrill = useCallback(() => {
    if (!generating) void runGenerate({ count: DRILL_GENERATE_COUNT });
  }, [generating, runGenerate]);

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
      const word = myWords.words.find((item) => item.wordId === wordId);
      deleteMyWord(wordId)
        .then(() => {
          announce(
            word ? `Đã bỏ ${word.simplified} khỏi danh sách đã học.` : 'Đã bỏ từ khỏi danh sách.',
          );
          reloadWords();
        })
        .catch((cause: unknown) => setNotice({ tone: 'error', lines: [describeApiError(cause)] }));
    },
    [announce, myWords.words, reloadWords],
  );

  const handleImported = useCallback(() => {
    reloadWords();
  }, [reloadWords]);

  const ready = myWords.ready && mySentences.ready;
  const initialError = !ready ? (myWords.error ?? mySentences.error) : null;

  if (!ready) {
    if (initialError !== null) {
      return (
        <div
          className="mt-4"
        >
          <Notice
            tone="error"
            title="Không lấy được từ và câu của bạn"
          >
            {initialError}
          </Notice>
          <div
            className="mt-3"
          >
            <Button
              variant="secondary"
              icon="refresh"
              onClick={() => {
                myWords.reload();
                mySentences.reload();
              }}
            >
              Thử lại
            </Button>
          </div>
        </div>
      );
    }
    return <Spinner label="Đang lấy từ và câu của bạn" />;
  }

  const words = myWords.words;
  const sentences = mySentences.sentences;
  const laterError = myWords.error ?? mySentences.error;

  return (
    <>
      <p
        className="mt-1 mb-4 text-[0.9375rem] text-ink-soft"
      >
        {words.length} từ bạn đã học và {sentences.length} câu ghép từ chính những từ đó.
        {ai?.enabled ? ` · AI: ${ai.model}` : ''}
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

      <LiveMessage
        message={liveMessage}
        token={liveToken}
      />

      {laterError !== null ? (
        <div
          className="mb-4"
        >
          <Notice tone="error">{laterError}</Notice>
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
          onRemove={handleRemoveWord}
        />
      ) : null}

      {tab === 'drill' ? (
        <SentenceDrill
          sentences={sentences}
          rate={Number(rate)}
          query={query}
          onRemove={handleRemoveSentence}
          aiEnabled={ai?.enabled === true}
          onGenerate={generateFromDrill}
          generating={generating}
          freshIds={freshIds}
        />
      ) : null}

      {tab === 'add' ? (
        <>
          <WordImport onImported={handleImported} />
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
