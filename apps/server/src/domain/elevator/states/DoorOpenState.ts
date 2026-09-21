import type { ElevatorStateName, SimulationConfig } from '@elevator/shared';

import type { ElevatorContext } from '../ElevatorContext';
import { ElevatorState } from './ElevatorState';
import type { Phase } from './ElevatorState';

export class DoorOpenState extends ElevatorState {
  override readonly name: ElevatorStateName = 'DOOR_OPEN';
  override readonly phase: Phase = 'doors';
  private holdMs = 0;

  override tick(ctx: ElevatorContext, dtMs: number): void {
    if (ctx.doorHeld) {
      this.holdMs += dtMs;
      if (this.holdMs >= ctx.config.maxDoorHoldMs) {
        ctx.setDoorHeld(false);
        this.elapsedMs = 0;
        ctx.log('door hold timed out');
      }
      return;
    }
    this.elapsedMs += dtMs;
    if (this.elapsedMs >= ctx.config.doorDwellMs) {
      ctx.transitionTo('DOOR_CLOSING');
    }
  }

  override onDoorOpenPressed(): void {
    this.elapsedMs = 0;
    this.holdMs = 0;
  }

  override onDoorOpenReleased(): void {
    this.elapsedMs = 0;
    this.holdMs = 0;
  }

  override onDoorClosePressed(ctx: ElevatorContext): void {
    if (!ctx.doorHeld) ctx.transitionTo('DOOR_CLOSING');
  }

  override onBoardingRequest(): void {
    this.elapsedMs = 0;
  }

  override remainingBusyMs(config: SimulationConfig, doorHeld: boolean): number {
    const dwellRemaining = doorHeld ? config.doorDwellMs : Math.max(0, config.doorDwellMs - this.elapsedMs);
    return dwellRemaining + config.doorTransitionMs;
  }
}
