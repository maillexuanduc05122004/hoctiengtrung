/**
 * Bộ chuyển trang HTML bài nghe thành dữ liệu bài.
 *
 * Trang mẫu dưới đây chép đúng khung của tệp gốc (tiêu đề có biểu tượng, khối
 * giới thiệu tách bằng `<br>`, dòng hướng dẫn 🔊, thẻ có `data-text`), chỉ rút
 * còn vài mục. Dựng bằng DOMParser của jsdom như Vitest đang chạy sẵn.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RATE,
  nextLessonId,
  parseLessonDocument,
  renderLessonModule,
} from './fixed-listening.ts';

const SAMPLE = `<!doctype html>
<html lang="vi"><body><div class="wrap">
<h1>🎧 20 từ mới + 50 câu ghép</h1>
<div class="note">
<b>2 từ mới hoàn toàn</b>, tiếp tục sau bài trước.<br>
1 câu ghép ưu tiên từ mới.<br><br>
🔊 Audio kiểu cũ · ⬇️ / ⬆️ chuyển mục · <b>Enter</b> phát mục đang chọn · 0.75×.
</div>
<h2>📚 2 từ mới</h2>
<div class="card" data-text="药">
  <div class="num">Từ mới 01</div>
  <div class="zh">药</div>
  <button onclick="playItem(this.parentElement)">🔊 Nghe</button>
  <div class="py">yào</div>
  <div class="vi">thuốc</div>
</div>
<div class="card" data-text="花">
  <div class="num">Từ mới 02</div>
  <div class="zh">花</div>
  <button onclick="playItem(this.parentElement)">🔊 Nghe</button>
  <div class="py">huā</div>
  <div class="vi">hoa</div>
</div>
<h2>🎧 1 câu ghép</h2>
<div class="card" data-text="我喜欢花">
  <div class="num">Câu ghép 01</div>
  <div class="zh">我喜欢花。</div>
  <button onclick="playItem(this.parentElement)">🔊 Nghe</button>
  <div class="py">Wǒ xǐhuan
    huā.</div>
  <div class="vi">Tôi thích hoa.</div>
</div>
</div>
<script>
function speak(text){ const u=new SpeechSynthesisUtterance(text); u.lang='zh-CN'; u.rate=.8; }
</script>
</body></html>`;

function parse(html: string) {
  return parseLessonDocument(new DOMParser().parseFromString(html, 'text/html'));
}

describe('parseLessonDocument', () => {
  it('đọc tên bài, giới thiệu, tốc độ và từng mục theo đúng thứ tự', () => {
    const lesson = parse(SAMPLE);

    expect(lesson.title).toBe('20 từ mới + 50 câu ghép');
    // Dòng 🔊 là hướng dẫn của trình phát gốc, không phải giới thiệu bài.
    expect(lesson.notes).toEqual(['2 từ mới hoàn toàn, tiếp tục sau bài trước.', '1 câu ghép ưu tiên từ mới.']);
    expect(lesson.rate).toBe(0.8);

    expect(lesson.sections.map((section) => [section.title, section.itemLabel])).toEqual([
      ['2 từ mới', 'Từ mới'],
      ['1 câu ghép', 'Câu ghép'],
    ]);
    expect(lesson.sections[0].items).toEqual([
      { hanzi: '药', pinyin: 'yào', vi: 'thuốc' },
      { hanzi: '花', pinyin: 'huā', vi: 'hoa' },
    ]);
  });

  it('giữ chuỗi đọc riêng khi data-text khác chữ hiển thị, và gộp khoảng trắng', () => {
    const [sentence] = parse(SAMPLE).sections[1].items;
    expect(sentence).toEqual({
      hanzi: '我喜欢花。',
      pinyin: 'Wǒ xǐhuan huā.',
      vi: 'Tôi thích hoa.',
      speak: '我喜欢花',
    });
  });

  it('không có dòng rate thì lấy tốc độ mặc định của trang gốc', () => {
    const lesson = parse(SAMPLE.replace('u.rate=.8;', ''));
    expect(lesson.rate).toBe(DEFAULT_RATE);
  });

  it('thẻ đứng trước mọi tiêu đề mục vẫn được giữ', () => {
    const lesson = parse(
      '<h1>Bài</h1><div class="card" data-text="好"><div class="zh">好</div><div class="py">hǎo</div><div class="vi">tốt</div></div>',
    );
    expect(lesson.sections).toHaveLength(1);
    expect(lesson.sections[0].items[0].hanzi).toBe('好');
    expect(lesson.sections[0].itemLabel).toBe('Mục');
  });

  it('báo lỗi khi tệp không có thẻ nào, thay vì sinh ra một bài rỗng', () => {
    expect(() => parse('<h1>Trống</h1><h2>Mục</h2>')).toThrow(/card/);
  });
});

describe('renderLessonModule', () => {
  it('viết ra tệp TypeScript nháy đơn, thoát đúng dấu nháy trong nội dung', () => {
    const source = renderLessonModule(
      {
        title: "Bài 'thử'",
        notes: ['Một dòng.'],
        rate: 0.75,
        sections: [
          {
            title: 'Mục',
            itemLabel: 'Từ',
            items: [{ hanzi: '好', pinyin: 'hǎo', vi: "it's good", speak: '好的' }],
          },
        ],
      },
      'nguon.html',
    );

    expect(source).toContain("import type { FixedListeningLesson } from '../types.ts';");
    expect(source).toContain("title: 'Bài \\'thử\\'',");
    expect(source).toContain("{ hanzi: '好', pinyin: 'hǎo', vi: 'it\\'s good', speak: '好的' },");
    expect(source).toContain('rate: 0.75,');
    expect(source).toContain('`nguon.html`');
    expect(source.trimEnd().endsWith('export default lesson;')).toBe(true);
  });
});

describe('nextLessonId', () => {
  it('bắt đầu từ bai-01 và đi tiếp sau số lớn nhất, bỏ qua tệp không đúng dạng', () => {
    expect(nextLessonId([])).toBe('bai-01');
    expect(nextLessonId(['bai-01.ts', 'bai-09.ts', 'ghi-chu.ts', 'bai-x.ts'])).toBe('bai-10');
  });
});
