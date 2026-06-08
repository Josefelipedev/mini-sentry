interface FingerprintInput {
  message: string;
  stack?: string;
  appName: string;
  environment: string;
}

export function computeFingerprint(input: FingerprintInput): string {
  const normalized = normalizeMessage(input.message);
  const frame = input.stack ? extractMainFrame(input.stack) : '';
  const raw = [input.appName, input.environment, normalized, frame].join('|');
  return djb2Hash(raw).toString(36);
}

function normalizeMessage(msg: string): string {
  return msg
    .replace(/\b\d+\b/g, 'N')
    .replace(/"[^"]*"/g, '"?"')
    .replace(/'[^']*'/g, "'?'")
    .replace(/0x[0-9a-fA-F]+/g, '0xN')
    .trim()
    .slice(0, 300);
}

function extractMainFrame(stack: string): string {
  const lines = stack.split('\n').slice(1);
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.includes('node_modules')) continue;
    if (/at (eval|Function)\b/.test(t)) continue;
    if (t.includes('<anonymous>')) continue;
    return t.replace(/:\d+:\d+\)?$/, '').replace(/\?.*$/, '');
  }
  return lines[0]?.trim() ?? '';
}

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}
