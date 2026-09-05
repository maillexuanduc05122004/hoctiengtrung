/**
 * Rà các quy ước giao diện của dự án trên toàn bộ mã nguồn.
 *
 * Chỉ soi nội dung bên trong chuỗi lớp Tailwind nên không báo nhầm những chỗ như
 * khoá đối tượng `sm:` hay biến CSS `safe-area-inset-bottom`.
 *
 * Chạy: npm run check:ui
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from './lib/sources.ts';

interface Violation {
  file: string;
  line: number;
  rule: string;
  detail: string;
}

const SOURCE_DIRS = ['src'];
const EXTENSIONS = new Set(['.ts', '.tsx']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry))) out.push(full);
  }
  return out;
}

/** Lấy mọi chuỗi lớp Tailwind: nội dung của className, cùng các chuỗi trong mảng lớp. */
function classStrings(line: string): string[] {
  const found: string[] = [];
  const attribute = /className\s*=\s*["'`]([^"'`]*)["'`]/g;
  let match = attribute.exec(line);
  while (match) {
    found.push(match[1]);
    match = attribute.exec(line);
  }
  // Chuỗi lớp rời nằm trong mảng hoặc bảng tra, nhận diện qua các tiền tố quen thuộc.
  if (found.length === 0) {
    const bare = /["'`]([^"'`]*\b(?:flex|grid|px-|py-|mt-|mb-|text-|bg-|border|w-|h-|gap-|space-[xy]-|absolute|relative|fixed|sticky)[^"'`]*)["'`]/g;
    let hit = bare.exec(line);
    while (hit) {
      found.push(hit[1]);
      hit = bare.exec(line);
    }
  }
  return found;
}

const TAILWIND_BREAKPOINTS = /(?:^|\s)(?:sm|md|lg|xl|2xl):/;
const GAP_UTILITY = /(?:^|\s)(?:xsm:)?gap(?:-[xy])?-/;
const INSET_UTILITY = /(?:^|\s)-?(?:xsm:)?inset(?:-[xy])?-/;
const PIXEL_VALUE = /\[[^\]]*?\d+(?:\.\d+)?px[^\]]*?\]/;

const OTHER_ATTRIBUTE = /\b[a-zA-Z][a-zA-Z0-9-]*\s*=\s*["'{]/;

/**
 * Trả về đoạn vi phạm nếu `className` dùng chung dòng với thuộc tính JSX khác,
 * hoặc `null` khi dòng này hợp lệ.
 *
 * Cần loại trừ hai trường hợp không phải JSX: tham số hàm có `className = ''`
 * và giá trị nhiều dòng mở bằng `className={[`, vì cả hai đều đã đúng quy ước.
 */
function checkClassNameAlone(line: string): string | null {
  const index = line.indexOf('className');
  if (index < 0) return null;

  // Destructuring trong khai báo hàm, không phải thuộc tính JSX.
  if (/(function|=>|\(\{|\}\s*:|\}\)\s*\{)/.test(line.slice(0, index))) return null;
  if (/className\s*[,:}]/.test(line.slice(index))) return null;

  const before = line.slice(0, index);
  if (OTHER_ATTRIBUTE.test(before)) return line.trim().slice(0, 90);

  const after = line.slice(index + 'className'.length).replace(/^\s*=\s*/, '');
  // Giá trị mở ngoặc mà chưa đóng trên cùng dòng thì phần còn lại vẫn là giá trị.
  const closed =
    /^(["'`])[^"'`]*\1/.exec(after) ??
    (after.startsWith('{') && after.includes('}') ? /^\{[^}]*\}/.exec(after) : null);
  if (!closed) return null;

  const rest = after.slice(closed[0].length);
  return OTHER_ATTRIBUTE.test(rest) ? line.trim().slice(0, 90) : null;
}

function checkFile(file: string): Violation[] {
  const relative = path.relative(PROJECT_ROOT, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  const violations: Violation[] = [];

  lines.forEach((line, i) => {
    const lineNumber = i + 1;

    for (const classes of classStrings(line)) {
      if (TAILWIND_BREAKPOINTS.test(classes)) {
        violations.push({
          file: relative,
          line: lineNumber,
          rule: 'chỉ dùng tiền tố xsm:',
          detail: classes.trim().slice(0, 90),
        });
      }
      if (INSET_UTILITY.test(classes)) {
        violations.push({
          file: relative,
          line: lineNumber,
          rule: 'không dùng tiện ích inset',
          detail: classes.trim().slice(0, 90),
        });
      }
      if (PIXEL_VALUE.test(classes)) {
        violations.push({
          file: relative,
          line: lineNumber,
          rule: 'kích thước phải bằng rem',
          detail: classes.trim().slice(0, 90),
        });
      }
      if (GAP_UTILITY.test(classes) && !/\bgrid\b/.test(classes)) {
        violations.push({
          file: relative,
          line: lineNumber,
          rule: 'gap chỉ dùng với grid',
          detail: classes.trim().slice(0, 90),
        });
      }
    }

    // className phải nằm trên một dòng riêng, không chung với thuộc tính JSX khác.
    const solo = checkClassNameAlone(line);
    if (solo !== null) {
      violations.push({
        file: relative,
        line: lineNumber,
        rule: 'className phải ở dòng riêng',
        detail: solo,
      });
    }
  });

  return violations;
}

function main(): void {
  const files = SOURCE_DIRS.flatMap((dir) => walk(path.join(PROJECT_ROOT, dir)));
  const violations = files.flatMap(checkFile);

  console.log(`Rà quy ước giao diện trên ${files.length} tệp\n`);

  if (violations.length === 0) {
    console.log('Không có vi phạm.');
    return;
  }

  const byRule = new Map<string, Violation[]>();
  for (const violation of violations) {
    const bucket = byRule.get(violation.rule);
    if (bucket) bucket.push(violation);
    else byRule.set(violation.rule, [violation]);
  }

  for (const [rule, items] of byRule) {
    console.log(`${rule} — ${items.length} chỗ`);
    for (const item of items.slice(0, 25)) {
      console.log(`  ${item.file}:${item.line}  ${item.detail}`);
    }
    if (items.length > 25) console.log(`  … còn ${items.length - 25} chỗ nữa`);
    console.log('');
  }

  process.exit(1);
}

main();
