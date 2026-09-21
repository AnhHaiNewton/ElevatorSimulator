import type { Direction } from '@elevator/shared';

import type { StopContext } from './Request';
import { Request } from './Request';

export class HallCall extends Request {
  readonly direction: Direction;
  readonly createdAtMs: number;
  private assignee: number | null = null;

  constructor(floor: number, direction: Direction, createdAtMs: number) {
    super(floor);
    this.direction = direction;
    this.createdAtMs = createdAtMs;
  }

  static keyOf(floor: number, direction: Direction): string {
    return `${floor}:${direction}`;
  }

  get key(): string {
    return HallCall.keyOf(this.floor, this.direction);
  }

  get assignedTo(): number | null {
    return this.assignee;
  }

  assignTo(elevatorId: number): void {
    this.assignee = elevatorId;
  }

  matches(floor: number, direction: Direction): boolean {
    return this.floor === floor && this.direction === direction;
  }

  // The brief's rule: a moving car only stops for a hall call going its own
  // direction, unless this floor is the turnaround point (nothing left beyond it).
  override shouldStopAt(ctx: StopContext): boolean {
    if (ctx.floor !== this.floor) return false;
    if (ctx.heading === 'idle' || ctx.heading === this.direction) return true;
    return !ctx.hasRequestsBeyond;
  }

  override describe(): string {
    return `${this.floor}${this.direction === 'up' ? '▲' : '▼'}`;
  }
}
