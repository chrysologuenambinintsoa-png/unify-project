const fs = require('fs');
const path = 'app/pages/[pageId]/page.tsx';
const s = fs.readFileSync(path, 'utf8');
function count(re){return (s.match(re)||[]).length}
console.log('chars', s.length);
console.log('braces { }', count(/\{/g), count(/\}/g));
console.log('parens ( )', count(/\(/g), count(/\)/g));
console.log('brackets [ ]', count(/\[/g), count(/\]/g));
console.log('backticks `', count(/`/g));
console.log('angle < >', count(/</g), count(/>/g));
// print min balance for braces
let bal=0, min=Infinity, minIdx=0;
for(let i=0;i<s.length;i++){if(s[i]==='{')bal++; if(s[i]==='}')bal--; if(bal<min){min=bal;minIdx=i;}}
console.log('brace min balance', min, 'at', minIdx);
// angle bracket balance
let balA=0, minA=Infinity, minAIdx=0;
for(let i=0;i<s.length;i++){if(s[i]=='<')balA++; if(s[i]=='>')balA--; if(balA<minA){minA=balA;minAIdx=i;}}
console.log('angle min balance', minA, 'at', minAIdx);
const lines = s.substring(0, minAIdx).split(/\r?\n/);
console.log('angle issue around line', lines.length);
const start = Math.max(0, minAIdx - 200);
const ctx = s.substring(start, minAIdx + 200);
console.log('---context---');
console.log(ctx);
console.log('---end context---');
