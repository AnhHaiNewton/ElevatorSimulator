import type { StopContext } from './Request';
import { Request } from './Request';

export class CarCall extends Request {
  constructor(floor: number) {
    super(floor);
  }

  override shouldStopAt(ctx: StopContext): boolean {
    return ctx.floor === this.floor;
  }

  override describe(): string {
    return `car→${this.floor}`;
  }
}
