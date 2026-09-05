import fs from 'node:fs';
const all=new Map(require0());
function require0(){return JSON.parse(fs.readFileSync('scripts/.cache/syllables.json','utf8'));}
const INITIALS=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','y','w',''];
const FINALS=['a','o','e','ai','ei','ao','ou','an','en','ang','eng','ong','er',
 'i','ia','ie','iao','iu','ian','in','iang','ing','iong',
 'u','ua','uo','uai','ui','uan','un','uang','ueng',
 'u:','u:e','u:an','u:n','io','ê'];
const STANDALONE=new Set(['m','n','ng','hm','hng','ê']);
function structural(s){
  if(STANDALONE.has(s))return true;
  for(const ini of INITIALS){
    if(!s.startsWith(ini))continue;
    const fin=s.slice(ini.length);
    if(FINALS.includes(fin))return true;
  }
  return false;
}
const valid=[...all.keys()].filter(structural).sort();
const rejected=[...all.entries()].filter(([s])=>!structural(s)).sort((a,b)=>b[1]-a[1]);
console.log('structurally valid:',valid.length);
console.log('REJECTED (top 40):',rejected.slice(0,40).map(x=>x[0]+':'+x[1]).join(' '));
const f5=new Set([...all.entries()].filter(x=>x[1]>=5).map(x=>x[0]));
console.log('valid but freq<5:',valid.filter(s=>!f5.has(s)).join(' '));
console.log('freq>=5 but structurally invalid:',[...f5].filter(s=>!structural(s)).join(' '));
fs.writeFileSync('scripts/.cache/valid-syllables.json',JSON.stringify(valid));
