/**
 * Trang nguồn dữ liệu.
 *
 * Mọi con số trên trang này đều đọc thẳng từ public/data/manifest.json, không có
 * số nào viết cứng trong mã: bộ dữ liệu nhập lại thì trang tự đổi theo. Trang có
 * mục đích nói rõ dữ liệu đến từ đâu, giấy phép nào, và phần nào chưa đáng tin.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button.tsx';
import { Notice, ProgressBar, Spinner } from '../components/ui/Feedback.tsx';
import { loadManifest } from '../lib/vocabulary/store.ts';
import type { DatasetManifest } from '../types/vocabulary.ts';

const numberFormat = new Intl.NumberFormat('vi-VN');

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Ngày nhập dữ liệu ở dạng dễ đọc; giữ nguyên chuỗi gốc nếu không đọc được. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
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

interface InfoRowProps {
  label: string;
  children: ReactNode;
}

/** Một dòng "nhãn — giá trị", phân tách bằng kẻ mảnh thay vì bọc thẻ. */
function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-baseline justify-between border-b border-line py-2.5"
    >
      <dt
        className="mr-4 shrink-0 text-[0.875rem] text-ink-soft"
      >
        {label}
      </dt>
      <dd
        className="m-0 min-w-0 text-[0.875rem] font-medium break-words text-ink"
      >
        {children}
      </dd>
    </div>
  );
}

interface SourceFieldProps {
  label: string;
  mono?: boolean;
  children: ReactNode;
}

function SourceField({ label, mono = false, children }: SourceFieldProps) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-baseline"
    >
      <span
        className="mr-2 shrink-0 text-[0.75rem] font-semibold tracking-wide text-ink-faint uppercase"
      >
        {label}
      </span>
      <span
        className={
          mono
            ? 'min-w-0 font-mono text-[0.75rem] break-all text-ink-soft'
            : 'min-w-0 text-[0.8125rem] break-words text-ink-soft'
        }
      >
        {children}
      </span>
    </div>
  );
}

export function DataSourcePage() {
  const [manifest, setManifest] = useState<DatasetManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadManifest()
      .then((data) => {
        if (active) setManifest(data);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error ? cause.message : 'Không đọc được tệp manifest.json của bộ dữ liệu.',
        );
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  // Xoá lỗi ngay lúc bấm "Thử lại" chứ không xoá trong thân effect, để mỗi lần
  // thử lại chỉ gây một lượt vẽ lại.
  const retry = (): void => {
    setError(null);
    setAttempt((value) => value + 1);
  };

  return (
    <div
      className="mx-auto w-full max-w-[46rem] min-w-0"
    >
      <header
        className="mb-5"
      >
        <h1
          className="text-[1.375rem] font-semibold tracking-tight text-ink"
        >
          Nguồn dữ liệu
        </h1>
        <p
          className="mt-1 text-[0.875rem] text-ink-faint"
        >
          Bộ từ nằm sẵn trong ứng dụng. Trang này ghi rõ dữ liệu lấy từ đâu, theo giấy phép nào và
          phần nào chưa được kiểm duyệt.
        </p>
      </header>

      {error !== null ? (
        <Notice
          tone="error"
          title="Chưa đọc được thông tin bộ dữ liệu"
        >
          <p
            className="break-words"
          >
            {error}
          </p>
          <div
            className="mt-2.5"
          >
            <Button
              variant="secondary"
              icon="refresh"
              onClick={retry}
            >
              Thử lại
            </Button>
          </div>
        </Notice>
      ) : manifest === null ? (
        <Spinner label="Đang đọc thông tin bộ dữ liệu" />
      ) : (
        <div
          className="min-w-0 space-y-6"
        >
          <div
            className="min-w-0 space-y-3"
          >
            <Notice
              tone="warn"
              title="Nghĩa tiếng Việt là bản dịch máy"
            >
              Nghĩa tiếng Việt và bản dịch câu ví dụ do máy dịch, chưa qua kiểm duyệt của người bản
              ngữ. Hãy đối chiếu thêm nghĩa tiếng Anh khi thấy một nghĩa đáng ngờ.
            </Notice>
            <Notice
              tone="info"
              title="Đây là danh sách HSK 3.0 năm 2021"
            >
              Bộ từ theo chuẩn HSK 3.0 công bố năm 2021, gồm cấp 1 đến cấp 3. Đây không phải danh
              sách HSK 2026.
            </Notice>
          </div>

          <Section
            title="Bộ dữ liệu"
          >
            <dl
              className="m-0 min-w-0 border-t border-line"
            >
              <InfoRow
                label="Phiên bản bộ dữ liệu"
              >
                {manifest.datasetVersion}
              </InfoRow>
              <InfoRow
                label="Ngày nhập dữ liệu"
              >
                <time dateTime={manifest.importedAt}>{formatDate(manifest.importedAt)}</time>
              </InfoRow>
              <InfoRow
                label="Chuẩn"
              >
                {manifest.standard}
              </InfoRow>
              <InfoRow
                label="Tổng số từ"
              >
                {`${numberFormat.format(manifest.totalWords)} từ`}
              </InfoRow>
            </dl>
          </Section>

          <Section
            title="Từng cấp"
          >
            <div
              className="min-w-0 overflow-x-auto"
            >
              <table
                className="w-full min-w-[17rem] border-collapse text-[0.8125rem]"
              >
                <caption
                  className="sr-only"
                >
                  Số từ, số buổi học và tệp dữ liệu của từng cấp HSK
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="border-b border-line-strong py-2 pr-3 text-left font-medium text-ink-soft"
                    >
                      Cấp
                    </th>
                    <th
                      scope="col"
                      className="border-b border-line-strong py-2 pr-3 text-right font-medium text-ink-soft"
                    >
                      Số từ
                    </th>
                    <th
                      scope="col"
                      className="border-b border-line-strong py-2 pr-3 text-right font-medium text-ink-soft"
                    >
                      Số buổi
                    </th>
                    <th
                      scope="col"
                      className="border-b border-line-strong py-2 text-left font-medium text-ink-soft"
                    >
                      Tệp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.levels.map((level) => (
                    <tr key={level.level}>
                      <th
                        scope="row"
                        className="border-b border-line py-2.5 pr-3 text-left font-medium whitespace-nowrap text-ink"
                      >
                        {`HSK ${level.level}`}
                      </th>
                      <td
                        className="border-b border-line py-2.5 pr-3 text-right text-ink-soft tabular-nums"
                      >
                        {numberFormat.format(level.words)}
                      </td>
                      <td
                        className="border-b border-line py-2.5 pr-3 text-right text-ink-soft tabular-nums"
                      >
                        {numberFormat.format(level.lessons)}
                      </td>
                      <td
                        className="border-b border-line py-2.5 font-mono text-[0.75rem] break-all text-ink-faint"
                      >
                        {level.file}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            title="Mức độ tin cậy của bản dịch"
            description="Số từ đã có người kiểm duyệt nghĩa tiếng Việt so với tổng số từ."
          >
            <ProgressBar
              value={manifest.reviewedTranslations}
              max={manifest.totalWords}
              label="Nghĩa tiếng Việt đã kiểm duyệt"
              hint={`${numberFormat.format(manifest.reviewedTranslations)} / ${numberFormat.format(manifest.totalWords)}`}
              tone="teal"
            />
            <dl
              className="m-0 mt-3 min-w-0 border-t border-line"
            >
              <InfoRow
                label="Từ có nghĩa tiếng Việt do máy dịch"
              >
                {`${numberFormat.format(manifest.machineTranslated)} từ`}
              </InfoRow>
              <InfoRow
                label="Từ đã được người kiểm duyệt"
              >
                {`${numberFormat.format(manifest.reviewedTranslations)} từ`}
              </InfoRow>
            </dl>
          </Section>

          <Section
            title="Nguồn và giấy phép"
            description="Mỗi nguồn được ghim ở một phiên bản cụ thể để dữ liệu nhập lại vẫn ra kết quả cũ."
          >
            <ul
              className="m-0 min-w-0 list-none border-t border-line p-0"
            >
              {manifest.sources.map((source) => (
                <li
                  key={source.url}
                  className="min-w-0 border-b border-line py-3.5"
                >
                  <h3
                    className="text-[0.9375rem] font-semibold break-words text-ink"
                  >
                    {source.name}
                  </h3>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block min-w-0 text-[0.8125rem] break-all text-teal underline underline-offset-2"
                  >
                    {source.url}
                  </a>
                  <div
                    className="mt-2 min-w-0 space-y-1"
                  >
                    <SourceField
                      label="Giấy phép"
                    >
                      {source.license}
                    </SourceField>
                    <SourceField
                      label="Phiên bản đã ghim"
                      mono
                    >
                      {source.version}
                    </SourceField>
                    <SourceField
                      label="Dùng cho"
                    >
                      {source.usedFor}
                    </SourceField>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          {manifest.notes.length > 0 ? (
            <Section
              title="Ghi chú"
            >
              <ul
                className="m-0 min-w-0 list-disc space-y-2 pl-5 text-[0.875rem] text-ink-soft"
              >
                {manifest.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          <p
            className="border-t border-line pt-5"
          >
            <Link
              to="/cai-dat"
              className="text-[0.875rem] font-medium text-teal underline underline-offset-2"
            >
              Về trang cài đặt
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default DataSourcePage;
