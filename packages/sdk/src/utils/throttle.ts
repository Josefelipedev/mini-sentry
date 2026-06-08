interface ThrottleEntry {
  count: number;
  windowStart: number;
}

export class Throttle {
  private entries = new Map<string, ThrottleEntry>();
  private sessionCount = 0;

  constructor(
    private maxPerFingerprint = 3,
    private windowMs = 60_000,
    private maxPerSession = 50
  ) {}

  shouldAllow(fingerprint: string): boolean {
    if (this.sessionCount >= this.maxPerSession) return false;

    const now = Date.now();
    const entry = this.entries.get(fingerprint);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.entries.set(fingerprint, { count: 1, windowStart: now });
      this.sessionCount++;
      return true;
    }

    if (entry.count >= this.maxPerFingerprint) return false;

    entry.count++;
    this.sessionCount++;
    return true;
  }

  reset(): void {
    this.entries.clear();
    this.sessionCount = 0;
  }
}
