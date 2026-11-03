import fs from 'node:fs';
import path from 'node:path';
import { callTool } from './mcp.mjs';

const [tool, file] = process.argv.slice(2);
const stripBom = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
const body = JSON.parse(stripBom(fs.readFileSync(file, 'utf8')));
const result = await callTool(tool, body);

const cacheDir = path.join(process.cwd(), '.cache');
fs.mkdirSync(cacheDir, { recursive: true });
const fullPath = path.join(cacheDir, `${tool}-${Date.now()}.json`);
fs.writeFileSync(fullPath, JSON.stringify(result, null, 2), 'utf8');

const texts = (result?.content ?? []).filter(b => b.type === 'text').map(b => b.text);
const imgs = (result?.content ?? []).filter(b => b.type === 'image').length;
console.log(texts.join('\n'));
if (imgs) console.log(`[${imgs} image(s)]`);
console.log(`\n[full: ${path.basename(fullPath)}]`);
