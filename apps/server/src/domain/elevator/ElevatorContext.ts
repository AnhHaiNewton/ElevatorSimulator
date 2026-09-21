import type { ElevatorStateName, Heading, SimulationConfig } from '@elevator/shared';

import type { RouteState } from '../scheduling/RouteState';

export interface ElevatorContext {
  readonly config: SimulationConfig;
  readonly doorHeld: boolean;
  route(): RouteState;
  setHeading(heading: Heading): void;
  setDoorHeld(held: boolean): void;
  moveOneFloor(): void;
  stopAndOpenDoors(): void;
  transitionTo(state: ElevatorStateName): void;
  log(message: string): void;
}

export interface ElevatorListener {
  onStop(elevatorId: number, floor: number, heading: Heading): void;
  onLog(message: string): void;
}
