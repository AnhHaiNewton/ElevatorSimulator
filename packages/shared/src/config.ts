export interface SimulationConfig {
  floors: number;
  elevatorCount: number;
  initialFloors: readonly number[];
  floorTravelMs: number;
  doorTransitionMs: number;
  doorDwellMs: number;
  maxDoorHoldMs: number;
  tickMs: number;
  stopPenaltyMs: number;
}

export const DEFAULT_CONFIG: SimulationConfig = {
  floors: 10,
  elevatorCount: 3,
  initialFloors: [1, 1, 1],
  floorTravelMs: 1500,
  doorTransitionMs: 1000,
  doorDwellMs: 3000,
  maxDoorHoldMs: 20000,
  tickMs: 100,
  stopPenaltyMs: 500,
};
