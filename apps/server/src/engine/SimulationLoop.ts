import type { SimSpeed } from '@elevator/shared';

export interface Tickable {
  tick(dtMs: number): void;
}

export class SimulationLoop {
  private readonly system: Tickable;
  private readonly tickMs: number;
  private readonly onTick: () => void;
  private _speed: SimSpeed = 1;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(system: Tickable, tickMs: number, onTick: () => void) {
    this.system = system;
    this.tickMs = tickMs;
    this.onTick = onTick;
  }

  get isRunning(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      this.system.tick(this.tickMs * this._speed);
      this.onTick();
    }, this.tickMs);
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  get speed(): SimSpeed {
    return this._speed;
  }

  setSpeed(speed: SimSpeed): void {
    this._speed = speed;
  }
}
