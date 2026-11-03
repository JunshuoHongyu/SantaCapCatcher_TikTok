import { listTools } from './mcp.mjs';

const r = await listTools();
for (const t of r.tools) {
  const props = Object.keys(t.inputSchema?.properties ?? {});
  console.log(`${t.name}(${props.join(', ')})`);
}
