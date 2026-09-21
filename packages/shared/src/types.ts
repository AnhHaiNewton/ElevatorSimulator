import type { Direction, ElevatorStateName, Heading, SimSpeed } from './constants';
import type { SimulationConfig } from './config';

export interface HallCallDto {
  floor: number;
  direction: Direction;
  assignedTo: number | null;
  waitingMs: number;
}

export interface ElevatorSnapshot {
  id: number;
  floor: number;
  heading: Heading;
  state: ElevatorStateName;
  doorHeld: boolean;
  carCalls: number[];
  assignedHallCalls: { floor: number; direction: Direction }[];
}

export interface MetricsDto {
  servedHallCalls: number;
  avgWaitMs: number;
  maxWaitMs: number;
}

export interface SystemSnapshot {
  config: Pick<
    SimulationConfig,
    'floors' | 'elevatorCount' | 'floorTravelMs' | 'doorTransitionMs' | 'doorDwellMs'
  >;
  simTimeMs: number;
  strategy: string;
  elevators: ElevatorSnapshot[];
  hallCalls: HallCallDto[];
  metrics: MetricsDto;
}

export type StatePayload = SystemSnapshot & { speed: SimSpeed };

export interface LogEntry {
  id: number;
  simTimeMs: number;
  message: string;
}

export type AckResponse = { ok: true } | { ok: false; error: string };
