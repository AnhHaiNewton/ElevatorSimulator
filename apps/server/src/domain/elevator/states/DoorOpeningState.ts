import type { ElevatorStateName, SimulationConfig } from '@elevator/shared';

import type { ElevatorContext } from '../ElevatorContext';
import { ElevatorState } from './ElevatorState';
import type { Phase } from './ElevatorState';

export class DoorOpeningState extends ElevatorState {
  override readonly name: ElevatorStateName = 'DOOR_OPENING';
  override readonly phase: Phase = 'doors';

  override tick(ctx: ElevatorContext, dtMs: number): void {
    this.elapsedMs += dtMs;
    if (this.elapsedMs >= ctx.config.doorTransitionMs) {
      ctx.transitionTo('DOOR_OPEN');
    }
  }

  override onDoorClosePressed(ctx: ElevatorContext): void {
    if (!ctx.doorHeld) ctx.transitionTo('DOOR_CLOSING');
  }

  override remainingBusyMs(config: SimulationConfig): number {
    const openRemaining = Math.max(0, config.doorTransitionMs - this.elapsedMs);
    return openRemaining + config.doorDwellMs + config.doorTransitionMs;
  }
}
