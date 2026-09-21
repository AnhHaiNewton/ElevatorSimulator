export const DIRECTIONS = ['up', 'down'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type Heading = Direction | 'idle';

export const ELEVATOR_STATES = ['IDLE', 'MOVING', 'DOOR_OPENING', 'DOOR_OPEN', 'DOOR_CLOSING'] as const;
export type ElevatorStateName = (typeof ELEVATOR_STATES)[number];
export const BOARDING_STATES: readonly ElevatorStateName[] = ['DOOR_OPENING', 'DOOR_OPEN', 'DOOR_CLOSING'];

export const STRATEGIES = ['eta', 'nearest'] as const;
export type StrategyName = (typeof STRATEGIES)[number];

export const SPEEDS = [1, 2, 5] as const;
export type SimSpeed = (typeof SPEEDS)[number];
