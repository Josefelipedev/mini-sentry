interface FingerprintInput {
  message: string;
  stack?: string;
  appName: string;
  environment: string;
}

export function generateFingerprint(input: FingerprintInput): string {
  const normalizedMessage = normalizeMessage(input.message);
  const mainFrame = input.stack ? extractMainFrame(input.stack) : '';

  const raw = [input.appName, input.environment, normalizedMessage, mainFrame].join('|');

  return djb2Hash(raw).toString(36);
}

function normalizeMessage(message: string): string {
  return message
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
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.includes('node_modules')) continue;
    if (/at (eval|Function)\b/.test(trimmed)) continue;
    if (trimmed.includes('<anonymous>')) continue;
    return trimmed.replace(/:\d+:\d+\)?$/, '').replace(/\?.*$/, '');
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
