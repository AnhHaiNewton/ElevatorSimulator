export interface Tickable {
  tick(dtMs: number): void;
}

export function advance(tickable: Tickable, ms: number, step = 100): void {
  let remaining = ms;
  while (remaining > 0) {
    const dt = Math.min(step, remaining);
    tickable.tick(dt);
    remaining -= dt;
  }
}

export function advanceUntil(tickable: Tickable, predicate: () => boolean, maxMs = 60000, step = 100): void {
  let elapsed = 0;
  while (!predicate()) {
    if (elapsed >= maxMs) {
      throw new Error(`advanceUntil: predicate not satisfied within ${maxMs}ms`);
    }
    tickable.tick(step);
    elapsed += step;
  }
}
