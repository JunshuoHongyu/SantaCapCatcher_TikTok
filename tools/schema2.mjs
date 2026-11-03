import { listTools } from './mcp.mjs';
const r = await listTools();
for (const n of ['generate_image','capture_preview','interact_by_dsl','edit_by_dsl','import_source']) {
  const t = r.tools.find(x => x.name === n);
  console.log('###', n);
  console.log(JSON.stringify(t.inputSchema, null, 1).slice(0, 3000));
}
