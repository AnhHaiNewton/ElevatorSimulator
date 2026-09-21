import type { Direction, Heading } from '@elevator/shared';

export interface StopContext {
  floor: number;
  heading: Heading;
  hasRequestsBeyond: boolean;
}

export abstract class Request {
  readonly floor: number;

  protected constructor(floor: number) {
    this.floor = floor;
  }

  isBeyond(floor: number, dir: Direction): boolean {
    return dir === 'up' ? this.floor > floor : this.floor < floor;
  }

  abstract shouldStopAt(ctx: StopContext): boolean;
  abstract describe(): string;
}
