// Minimal MCP client for the local Effect House automation server.
// Usage: node tools/mcp.mjs <toolName> '<jsonArgs>'
import fs from 'node:fs';

const PORT_FILE = 'C:/Users/ywx1551497/AppData/Roaming/EffectHouse/Instances/Instance1/MCP/mcp_port.json';

async function getEndpoint() {
  const info = JSON.parse(fs.readFileSync(PORT_FILE, 'utf8'));
  return { url: `http://${info.host}:${info.port}${info.mcpPath}`, info };
}

async function rpc(method, params, id = 1, sessionId) {
  const { url } = await getEndpoint();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const sid = res.headers.get('mcp-session-id');
  const text = await res.text();
  let payload = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('data: ')) {
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.id === id) payload = parsed;
      } catch { /* ignore */ }
    }
  }
  if (!payload) {
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  }
  return { payload, sid };
}

let sessionId;

async function init() {
  const { payload, sid } = await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'hatgame-builder', version: '1.0' },
  }, 1);
  sessionId = sid;
  // Best-effort initialized notification.
  const { url } = await getEndpoint();
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  }).catch(() => {});
}

export async function callTool(name, args = {}) {
  if (!sessionId) await init();
  const { payload } = await rpc('tools/call', { name, arguments: args }, 2, sessionId);
  if (payload?.error) throw new Error(JSON.stringify(payload.error));
  return payload?.result;
}

export async function listTools() {
  if (!sessionId) await init();
  const { payload } = await rpc('tools/list', {}, 3, sessionId);
  return payload?.result;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const [tool, argsJson] = process.argv.slice(2);
  if (tool === '--list') {
    const r = await listTools();
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  }
  const result = await callTool(tool, argsJson ? JSON.parse(argsJson) : {});
  console.log(JSON.stringify(result, null, 2));
}
