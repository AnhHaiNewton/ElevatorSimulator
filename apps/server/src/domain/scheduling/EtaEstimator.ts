import type { SimulationConfig } from '@elevator/shared';

import { step } from '../direction';
import type { HallCall } from '../requests/HallCall';
import type { PlanningView } from './PlanningView';
import { RoutePlanner } from './RoutePlanner';

export class EtaEstimator {
  private readonly config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  /** Simulates the elevator's future route (with `target` appended) and returns the ms until doors open for it. */
  estimateMs(view: PlanningView, target: HallCall): number {
    const { floorTravelMs, doorTransitionMs, doorDwellMs, floors } = this.config;
    const doorCycleMs = 2 * doorTransitionMs + doorDwellMs;

    let carCalls = [...view.carCalls];
    let hallCalls = [...view.hallCalls, target];
    let floor = view.floor;
    let heading = view.heading;
    let time = view.remainingMs;
    let skipStopCheck = view.phase === 'doors'; // doors already cycling at this floor
    if (view.phase === 'moving' && heading !== 'idle') floor += step(heading); // committed to next floor

    for (let i = 0; i < floors * 4; i++) {
      const route = { floor, heading, carCalls, hallCalls };
      if (!skipStopCheck && RoutePlanner.shouldStop(route)) {
        const next = RoutePlanner.headingAtStop(route);
        if (next !== 'idle' && target.matches(floor, next)) return time; // ETA = moment doors start opening
        carCalls = carCalls.filter((c) => c.floor !== floor);
        if (next !== 'idle') hallCalls = hallCalls.filter((h) => !h.matches(floor, next));
        heading = next;
        time += doorCycleMs;
      }
      skipStopCheck = false;

      const move = RoutePlanner.nextHeading({ floor, heading, carCalls, hallCalls });
      if (move === 'idle') {
        const pendingHere =
          carCalls.some((c) => c.floor === floor) || hallCalls.some((h) => h.floor === floor);
        if (pendingHere) continue; // doors reopen here for the other direction
        return Number.POSITIVE_INFINITY; // defensive, should not happen
      }
      heading = move;
      floor += step(move);
      time += floorTravelMs;
    }
    return Number.POSITIVE_INFINITY;
  }
}
