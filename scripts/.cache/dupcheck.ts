import { readCachedText } from '../lib/sources.ts';
import { parseCedict } from '../lib/cedict.ts';
import { normalizeHsk } from '../lib/hsk.ts';
const cedict = parseCedict(readCachedText('cedict.txt'));
const { words } = normalizeHsk(readCachedText('hsk30.csv'), cedict);
const map = new Map<string, typeof words>();
for (const w of words) {
  const b = map.get(w.simplified);
  if (b) b.push(w); else map.set(w.simplified, [w]);
}
const dups = [...map.entries()].filter(([, v]) => v.length > 1);
console.log('nhóm trùng:', dups.length, '| tổng bản ghi thừa:', dups.reduce((a, [, v]) => a + v.length - 1, 0));
for (const [s, v] of dups) {
  console.log(s, '::', v.map((w) => `${w.id} L${w.hskLevel} [${w.pinyin}] ${w.partOfSpeech.join('/')} = ${w.meaningsEn[0] ?? '-'}`).join('  ||  '));
}
