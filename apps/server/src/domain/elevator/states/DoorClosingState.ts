import type { ElevatorStateName, SimulationConfig } from '@elevator/shared';

import type { ElevatorContext } from '../ElevatorContext';
import { ElevatorState } from './ElevatorState';
import type { Phase } from './ElevatorState';

export class DoorClosingState extends ElevatorState {
  override readonly name: ElevatorStateName = 'DOOR_CLOSING';
  override readonly phase: Phase = 'doors';

  override tick(ctx: ElevatorContext, dtMs: number): void {
    this.elapsedMs += dtMs;
    if (this.elapsedMs >= ctx.config.doorTransitionMs) {
      ctx.transitionTo('IDLE');
    }
  }

  override onDoorOpenPressed(ctx: ElevatorContext): void {
    ctx.transitionTo('DOOR_OPENING');
  }

  override onBoardingRequest(ctx: ElevatorContext): void {
    ctx.transitionTo('DOOR_OPENING');
  }

  override remainingBusyMs(config: SimulationConfig): number {
    return Math.max(0, config.doorTransitionMs - this.elapsedMs);
  }
}
