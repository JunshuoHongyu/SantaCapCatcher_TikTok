// Quick balance check for TS file (no compiler available).
import fs from 'node:fs';

const file = process.argv[2];
const s = fs.readFileSync(file, 'utf8');
let bal = 0, paren = 0, brack = 0, inStr = null, line = 1;
const errs = [];
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (c === '\n') line++;
  if (inStr) {
    if (c === '\\') { i++; continue; }
    if (c === inStr) inStr = null;
    continue;
  }
  // edge: template literal without backtick handling — treat backtick as string too
  if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
  if (c === '{') bal++;
  if (c === '}') bal--;
  if (c === '(') paren++;
  if (c === ')') paren--;
  if (c === '[') brack++;
  if (c === ']') brack--;
  if (bal < 0 || paren < 0 || brack < 0) errs.push(`${line}: negative at '${c}'`);
}
if (inStr) errs.push('unterminated string');
console.log(`braces=${bal} parens=${paren} brackets=${brack} strings=${inStr ? 'OPEN' : 'closed'}`);
console.log(errs.length ? errs.join('\n') : 'SYNTAX BALANCE OK');
