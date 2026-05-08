export class RoundTracker {
  private counts = new Map<string, number>();
  private lastTouchMs = 0;

  constructor(private idleResetMs = 90_000) {}

  start(advisorId: string, atMs: number): number {
    if (atMs - this.lastTouchMs > this.idleResetMs) this.counts.clear();
    this.lastTouchMs = atMs;
    const next = (this.counts.get(advisorId) ?? 0) + 1;
    this.counts.set(advisorId, next);
    return next;
  }

  current(advisorId: string): number {
    return this.counts.get(advisorId) ?? 0;
  }

  reset(): void {
    this.counts.clear();
    this.lastTouchMs = 0;
  }
}

export const rounds = new RoundTracker();
