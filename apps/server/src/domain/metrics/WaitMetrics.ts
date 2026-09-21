export class WaitMetrics {
  private count = 0;
  private totalMs = 0;
  private maxMs = 0;

  record(waitMs: number): void {
    this.count += 1;
    this.totalMs += waitMs;
    this.maxMs = Math.max(this.maxMs, waitMs);
  }

  reset(): void {
    this.count = 0;
    this.totalMs = 0;
    this.maxMs = 0;
  }

  get servedHallCalls(): number {
    return this.count;
  }

  get avgWaitMs(): number {
    return this.count === 0 ? 0 : this.totalMs / this.count;
  }

  get maxWaitMs(): number {
    return this.maxMs;
  }
}
