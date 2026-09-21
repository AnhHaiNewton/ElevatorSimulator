import type { LogEntry } from '@elevator/shared';

export class EventLog {
  private readonly capacity: number;
  private entries: LogEntry[] = [];
  private nextId = 1;

  constructor(capacity = 100) {
    this.capacity = capacity;
  }

  add(simTimeMs: number, message: string): LogEntry {
    const entry: LogEntry = { id: this.nextId, simTimeMs, message };
    this.nextId += 1;
    this.entries.push(entry);
    if (this.entries.length > this.capacity) this.entries.shift();
    return entry;
  }

  recent(): LogEntry[] {
    return [...this.entries];
  }

  reset(): void {
    this.entries = [];
    this.nextId = 1;
  }
}
