import fs from 'node:fs';
const all=new Map(JSON.parse(fs.readFileSync('scripts/.cache/syllables.json','utf8')));
const INITIALS=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','y','w',''];
const PALATAL=new Set(['j','q','x','y']);
const FINALS=['a','o','e','ai','ei','ao','ou','an','en','ang','eng','ong','er',
 'i','ia','ie','iao','iu','ian','in','iang','ing','iong',
 'u','ua','uo','uai','ui','uan','un','uang','ueng',
 'u:','u:e','u:an','u:n','io'];
const PALATAL_ONLY=['ue','uan','un','u'];
const STANDALONE=new Set(['m','n','ng','hm','hng','ê','o','a','e','ai','ei','ao','ou','an','en','ang','er']);
const RARE_KEEP=new Set(['nin','den','dia','lo','nou','kei','sei','zhei','tei','nun','hm','hng','ng','ê','cei','me','yo','n','m']);
function structural(s){
  if(STANDALONE.has(s))return true;
  for(const ini of INITIALS){
    if(ini!=='' && !s.startsWith(ini))continue;
    const fin=s.slice(ini.length);
    if(FINALS.includes(fin))return true;
    if(PALATAL.has(ini)&&PALATAL_ONLY.includes(fin))return true;
  }
  return false;
}
const keep=[...all.entries()]
  .filter(([s,f])=>structural(s)&&(f>=5||RARE_KEEP.has(s)))
  .map(([s])=>s);
for(const s of RARE_KEEP) if(structural(s)&&!keep.includes(s)) keep.push(s);
const final=[...new Set(keep)].sort();
console.log('final count',final.length);
console.log('sanity — must contain:', ['nin','lu:','lu:e','xue','yue','jue','que','er','zhei','shei','shui','wo','ni','hao','ma','ge','zi','r'].map(s=>s+'='+final.includes(s)).join(' '));
const ts = `// Sinh tự động bởi scripts/.cache khi chuẩn hoá dữ liệu — không sửa tay.
// Nguồn: các âm tiết pinyin xuất hiện trong CC-CEDICT, lọc theo cấu trúc âm tiết Hán ngữ chuẩn.
// Kho âm tiết dùng cho việc tách chuỗi pinyin liền (vd. "nihao" -> "ni hao").

/** Toàn bộ âm tiết pinyin hợp lệ, viết không dấu thanh, dùng "u:" cho "ü". */
export const PINYIN_SYLLABLES: readonly string[] = ${JSON.stringify(final,null,0).replace(/","/g,'", "')};

/** Tập tra cứu nhanh cho ${final.length} âm tiết. */
export const PINYIN_SYLLABLE_SET: ReadonlySet<string> = new Set(PINYIN_SYLLABLES);

/** Độ dài âm tiết dài nhất, dùng cho thuật toán khớp dài nhất. */
export const MAX_SYLLABLE_LENGTH = ${Math.max(...final.map(s=>s.length))};
`;
fs.writeFileSync('src/lib/pinyin/syllables.ts',ts);
console.log('wrote src/lib/pinyin/syllables.ts');
