import type { SimulationConfig } from '@elevator/shared';

export const TEST_CONFIG: SimulationConfig = {
  floors: 10,
  elevatorCount: 3,
  initialFloors: [1, 1, 1],
  floorTravelMs: 1000,
  doorTransitionMs: 500,
  doorDwellMs: 2000,
  maxDoorHoldMs: 10000,
  tickMs: 100,
  stopPenaltyMs: 500,
};
