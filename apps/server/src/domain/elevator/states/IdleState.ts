import type { ElevatorStateName } from '@elevator/shared';

import { RoutePlanner } from '../../scheduling/RoutePlanner';
import type { ElevatorContext } from '../ElevatorContext';
import { ElevatorState } from './ElevatorState';
import type { Phase } from './ElevatorState';

export class IdleState extends ElevatorState {
  override readonly name: ElevatorStateName = 'IDLE';
  override readonly phase: Phase = 'idle';

  override tick(ctx: ElevatorContext): void {
    const route = ctx.route();
    if (RoutePlanner.shouldStop(route)) {
      ctx.stopAndOpenDoors();
      return;
    }
    const heading = RoutePlanner.nextHeading(route);
    ctx.setHeading(heading);
    if (heading !== 'idle') ctx.transitionTo('MOVING');
  }

  override onDoorOpenPressed(ctx: ElevatorContext): void {
    ctx.transitionTo('DOOR_OPENING');
  }

  override remainingBusyMs(): number {
    return 0;
  }
}
