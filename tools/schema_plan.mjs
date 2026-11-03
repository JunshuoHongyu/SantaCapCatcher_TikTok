import { listTools } from './mcp.mjs';

const r = await listTools();
const t = r.tools.find(x => x.name === 'save_plan');
console.log(JSON.stringify(t.inputSchema, null, 2));
