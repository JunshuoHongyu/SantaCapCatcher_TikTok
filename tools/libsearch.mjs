import fs from 'node:fs';
import { callTool } from './mcp.mjs';

const queries = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const q of queries) {
  try {
    const r = await callTool('search_library', { query: q.query, category: q.category, max_results: q.max ?? 8, interactive: false, intention: q.intention ?? `Find a ${q.query} visual` });
    const texts = (r?.content ?? []).filter(b => b.type === 'text').map(b => b.text);
    console.log(`\n===== ${q.query} =====`);
    console.log(texts.join('\n').slice(0, 2500));
  } catch (e) {
    console.log(`\n===== ${q.query} FAILED =====\n${e.message}`);
  }
}
