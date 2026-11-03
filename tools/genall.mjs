import fs from 'node:fs';
import path from 'node:path';
import { callTool } from './mcp.mjs';

const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const cacheDir = path.join(process.cwd(), '.cache');
fs.mkdirSync(cacheDir, { recursive: true });

const results = [];
const CONCURRENCY = 2;
let idx = 0;

async function worker() {
  while (idx < jobs.length) {
    const job = jobs[idx++];
    const t0 = Date.now();
    try {
      const r = await callTool('generate_image', {
        asset_type: job.asset_type,
        prompt: job.prompt,
        style: job.style ?? '2D Cartoon',
        aspect_ratio: job.aspect_ratio ?? '1:1',
        name: job.name,
        intention: job.intention ?? `Create the ${job.name} visual for Santa Cap Catcher`,
      });
      const texts = (r?.content ?? []).filter(b => b.type === 'text').map(b => b.text);
      console.log(`\n=== ${job.name} (${((Date.now() - t0) / 1000).toFixed(0)}s) ===`);
      console.log(texts.join('\n').slice(0, 2200));
      results.push({ name: job.name, texts });
    } catch (e) {
      console.log(`\n=== ${job.name} FAILED ===\n${e.message}`);
      results.push({ name: job.name, error: e.message });
    }
    fs.writeFileSync(path.join(cacheDir, 'gen-results.json'), JSON.stringify(results, null, 2), 'utf8');
  }
}

await Promise.all([worker(), worker()]);
