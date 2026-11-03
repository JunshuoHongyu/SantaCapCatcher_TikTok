import fs from 'node:fs';
import path from 'node:path';
import { callTool } from './mcp.mjs';

const [tool, argsFile] = process.argv.slice(2);
const strip = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
const args = argsFile ? JSON.parse(strip(fs.readFileSync(argsFile, 'utf8'))) : {};
if (!args.intention) args.intention = 'Inspect project state';

const result = await callTool(tool, args);

const cacheDir = path.join(process.cwd(), '.cache');
fs.mkdirSync(cacheDir, { recursive: true });
const fullPath = path.join(cacheDir, `${tool}-${Date.now()}.json`);
fs.writeFileSync(fullPath, JSON.stringify(result, null, 2), 'utf8');

const textParts = [];
let imageCount = 0;
for (const block of result?.content ?? []) {
  if (block.type === 'text') textParts.push(block.text);
  else if (block.type === 'image') imageCount++;
}
if (textParts.length) console.log(textParts.join('\n\n'));
if (imageCount) console.log(`\n[${imageCount} image block(s) saved in ${fullPath}]`);
if (!textParts.length && !imageCount) console.log(JSON.stringify(result, null, 2));
console.log(`\n[full: ${path.basename(fullPath)}]`);
