import type { ElevatorStateName, SimulationConfig } from '@elevator/shared';

import type { ElevatorContext } from '../ElevatorContext';

export type Phase = 'idle' | 'moving' | 'doors';

export abstract class ElevatorState {
  protected elapsedMs = 0;

  abstract readonly name: ElevatorStateName;
  abstract readonly phase: Phase;

  abstract tick(ctx: ElevatorContext, dtMs: number): void;
  /** Time until this state stops blocking the elevator (used by the ETA estimator). Never negative. */
  abstract remainingBusyMs(config: SimulationConfig, doorHeld: boolean): number;

  onDoorOpenPressed(_ctx: ElevatorContext): void {}
  onDoorOpenReleased(_ctx: ElevatorContext): void {}
  onDoorClosePressed(_ctx: ElevatorContext): void {}
  onBoardingRequest(_ctx: ElevatorContext): void {}
}
