import fs from 'node:fs';
function parseCsv(text){
  const rows=[];let row=[],field='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else q=false; } else field+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(field);field='';}
      else if(c==='\n'){row.push(field);field='';rows.push(row);row=[];}
      else if(c==='\r'){} else field+=c; } }
  if(field||row.length){row.push(field);rows.push(row);}
  return rows;
}
const rows=parseCsv(fs.readFileSync('scripts/.cache/hsk30.csv','utf8'));
const head=rows[0]; const idx=Object.fromEntries(head.map((h,i)=>[h,i]));
const data=rows.slice(1).filter(r=>r.length>=head.length&&r[0]);
console.log('total rows', data.length);
const byLevel={};
for(const r of data){ const L=r[idx.Level]; byLevel[L]=(byLevel[L]||0)+1; }
console.log('by level', byLevel);
const l13=data.filter(r=>['1','2','3'].includes(r[idx.Level]));
console.log('L1-3 rows', l13.length);
console.log('unique IDs', new Set(l13.map(r=>r[idx.ID])).size);
console.log('unique simplified(raw)', new Set(l13.map(r=>r[idx.Simplified])).size);
console.log('missing pinyin', l13.filter(r=>!r[idx.Pinyin].trim()).length);
console.log('missing POS', l13.filter(r=>!r[idx.POS].trim()).length);
console.log('missing CEDICT', l13.filter(r=>!r[idx.CEDICT].trim()).length);
console.log('with Variants', l13.filter(r=>r[idx.Variants].trim()).length);
console.log('simplified containing non-hanzi', l13.filter(r=>/[^\u3400-\u9fff\uf900-\ufaff]/.test(r[idx.Simplified])).map(r=>r[idx.ID]+':'+r[idx.Simplified]).slice(0,40));
