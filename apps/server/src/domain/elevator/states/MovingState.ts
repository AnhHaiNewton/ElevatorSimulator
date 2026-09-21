import type { ElevatorStateName, SimulationConfig } from '@elevator/shared';

import { RoutePlanner } from '../../scheduling/RoutePlanner';
import type { ElevatorContext } from '../ElevatorContext';
import { ElevatorState } from './ElevatorState';
import type { Phase } from './ElevatorState';

export class MovingState extends ElevatorState {
  override readonly name: ElevatorStateName = 'MOVING';
  override readonly phase: Phase = 'moving';

  override tick(ctx: ElevatorContext, dtMs: number): void {
    this.elapsedMs += dtMs;
    if (this.elapsedMs < ctx.config.floorTravelMs) return;

    ctx.moveOneFloor();
    this.elapsedMs = 0;

    const route = ctx.route();
    if (RoutePlanner.shouldStop(route)) {
      ctx.stopAndOpenDoors();
      return;
    }
    if (route.heading === 'idle' || !RoutePlanner.hasRequestsBeyond(route, route.heading)) {
      ctx.transitionTo('IDLE');
    }
  }

  override remainingBusyMs(config: SimulationConfig): number {
    return Math.max(0, config.floorTravelMs - this.elapsedMs);
  }
}
