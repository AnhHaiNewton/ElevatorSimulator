import type { SimulationConfig } from '@elevator/shared';

import type { HallCall } from '../requests/HallCall';
import type { PlanningView } from '../scheduling/PlanningView';
import { DispatchStrategy } from './DispatchStrategy';

export class NearestCarStrategy extends DispatchStrategy {
  override readonly name = 'nearest';
  private readonly floors: number;

  constructor(config: SimulationConfig) {
    super();
    this.floors = config.floors;
  }

  protected override cost(view: PlanningView, call: HallCall): number {
    const distance = Math.abs(view.floor - call.floor);
    if (view.heading === 'idle') return distance;
    const approaching = view.heading === 'up' ? call.floor >= view.floor : call.floor <= view.floor;
    return approaching && view.heading === call.direction ? distance : distance + 2 * this.floors;
  }
}
