import fs from 'node:fs';
const lines=fs.readFileSync('scripts/.cache/cedict.txt','utf8').split('\n').filter(l=>l&&!l.startsWith('#'));
const freq=new Map();
const re=/^(\S+)\s+(\S+)\s+\[([^\]]*)\]/;
for(const l of lines){const m=re.exec(l);if(!m)continue;
  for(const s of m[3].split(/\s+/)){ if(!s)continue;
    const t=s.toLowerCase().replace(/[0-5]$/,'');
    if(!/^[a-z:]+$/.test(t))continue;
    freq.set(t,(freq.get(t)||0)+1);}}
const all=[...freq.entries()].sort((a,b)=>b[1]-a[1]);
console.log('distinct raw syllables:',all.length);
console.log('freq>=20:',all.filter(x=>x[1]>=20).length);
console.log('freq>=5:',all.filter(x=>x[1]>=5).length);
console.log('--- rare (freq<5) sample ---');
console.log(all.filter(x=>x[1]<5).map(x=>x[0]+':'+x[1]).join(' '));
console.log('--- with u: ---');
console.log(all.filter(x=>x[0].includes(':')).map(x=>x[0]+':'+x[1]).join(' '));
fs.writeFileSync('scripts/.cache/syllables.json',JSON.stringify(all,null,0));
