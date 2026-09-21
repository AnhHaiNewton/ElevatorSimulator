import type { Heading } from '@elevator/shared';

import type { CarCall } from '../requests/CarCall';
import type { HallCall } from '../requests/HallCall';
import type { Phase } from '../elevator/states/ElevatorState';

export interface PlanningView {
  id: number;
  floor: number;
  heading: Heading;
  phase: Phase;
  remainingMs: number;
  carCalls: readonly CarCall[];
  hallCalls: readonly HallCall[];
}
