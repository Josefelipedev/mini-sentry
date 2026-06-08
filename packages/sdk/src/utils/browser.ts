import type { BrowserInfo } from '../types';

export function getBrowserInfo(): BrowserInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  return {
    name: detectBrowserName(ua),
    version: detectBrowserVersion(ua),
    os: detectOS(ua),
    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
    },
    timezone:
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'unknown',
  };
}

function detectBrowserName(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';
  return 'Unknown';
}

function detectBrowserVersion(ua: string): string {
  const matchers = [
    /Firefox\/([\d.]+)/,
    /Edg\/([\d.]+)/,
    /OPR\/([\d.]+)/,
    /Chrome\/([\d.]+)/,
    /Version\/([\d.]+).*Safari/,
    /MSIE ([\d.]+)/,
    /rv:([\d.]+).*Trident/,
  ];
  for (const re of matchers) {
    const m = ua.match(re);
    if (m) return m[1];
  }
  return 'Unknown';
}

function detectOS(ua: string): string {
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}
