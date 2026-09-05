import fs from 'node:fs';
function parseCsv(text){const rows=[];let row=[],field='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else q=false;} else field+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(field);field='';}
      else if(c==='\n'){row.push(field);field='';rows.push(row);row=[];}
      else if(c==='\r'){} else field+=c; } }
  if(field||row.length){row.push(field);rows.push(row);} return rows;}
const rows=parseCsv(fs.readFileSync('scripts/.cache/hsk30.csv','utf8'));
const head=rows[0],idx=Object.fromEntries(head.map((h,i)=>[h,i]));
const data=rows.slice(1).filter(r=>r[0]).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]])));
const l13=data.filter(r=>['1','2','3'].includes(r.Level));
console.log('--- rows with Variants (all L1-3) ---');
for(const r of l13.filter(r=>r.Variants.trim())) console.log(r.ID, r.Simplified, '|', r.Pinyin, '|', r.Variants.slice(0,220));
console.log('\n--- rows with no CEDICT ---');
for(const r of l13.filter(r=>!r.CEDICT.trim())) console.log(r.ID, r.Simplified, r.Pinyin, r.POS);
console.log('\n--- rows with paren but no Variants ---');
for(const r of l13.filter(r=>/[（）]/.test(r.Simplified) && !r.Variants.trim())) console.log(r.ID, r.Simplified, r.Pinyin);
console.log('\n--- rows with … ---');
for(const r of l13.filter(r=>/…/.test(r.Simplified))) console.log(r.ID, JSON.stringify(r.Simplified), r.Pinyin, r.CEDICT, r.Variants.slice(0,200));
console.log('\n--- rows with digits ---');
for(const r of l13.filter(r=>/[0-9]/.test(r.Simplified))) console.log(r.ID, r.Simplified, r.Pinyin, r.CEDICT);
