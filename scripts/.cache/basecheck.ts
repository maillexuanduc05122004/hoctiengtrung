import { readCachedText } from '../lib/sources.ts';
import { parseCedict } from '../lib/cedict.ts';
import { normalizeHsk, splitIntoLessons } from '../lib/hsk.ts';

const cedict = parseCedict(readCachedText('cedict.txt'));
const { words, warnings } = normalizeHsk(readCachedText('hsk30.csv'), cedict);

console.log('tổng số từ:', words.length);
console.log('theo cấp:', [1, 2, 3].map((l) => `${l}=${words.filter((w) => w.hskLevel === l).length}`).join(' '));
console.log('ID trùng:', words.length - new Set(words.map((w) => w.id)).size);
console.log('giản thể trùng:', words.length - new Set(words.map((w) => w.simplified)).size);
console.log('thiếu pinyin:', words.filter((w) => !w.pinyin).length);
console.log('thiếu nghĩa EN:', words.filter((w) => w.meaningsEn.length === 0).length);
console.log('thiếu POS:', words.filter((w) => w.partOfSpeech.length === 0).length);
console.log('có writtenVariants:', words.filter((w) => w.writtenVariants.length > 0).length);
console.log('có affixExample:', words.filter((w) => w.affixExample).length);
console.log('chữ không phải Hán:', words.filter((w) => /[^㐀-鿿豈-﫿〇]/.test(w.simplified)).map((w) => w.id + ':' + w.simplified));
console.log('\ncảnh báo (' + warnings.length + '):');
warnings.slice(0, 20).forEach((w) => console.log('  ', w));

console.log('\n--- mẫu 12 từ ---');
for (const w of [words[0], words[3], words[74], words[215], words[324], words[443], words[499], words[561], words[876], words[1271], words[1272], words[2244]]) {
  console.log(`${w.id} ${w.simplified}${w.traditional ? '/' + w.traditional : ''} [${w.pinyin}] (${w.pinyinPlain}) L${w.hskLevel} ${w.partOfSpeech.join('/')} vars=${JSON.stringify(w.writtenVariants)} pyAlias=${JSON.stringify(w.pinyinAliases)} :: ${w.meaningsEn.slice(0, 3).join(' | ')}`);
}

console.log('\n--- buổi học ---');
for (const level of [1, 2, 3] as const) {
  const inLevel = words.filter((w) => w.hskLevel === level);
  const lessons = splitIntoLessons(inLevel, 10);
  const sizes = new Map<number, number>();
  for (const l of lessons) sizes.set(l.length, (sizes.get(l.length) ?? 0) + 1);
  console.log(`HSK ${level}: ${inLevel.length} từ -> ${lessons.length} buổi, kích thước: ${[...sizes.entries()].map(([s, c]) => `${s}từ×${c}`).join(', ')}`);
}
