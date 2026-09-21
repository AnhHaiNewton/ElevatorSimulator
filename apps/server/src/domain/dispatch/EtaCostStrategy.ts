import type { SimulationConfig } from '@elevator/shared';

import type { HallCall } from '../requests/HallCall';
import { EtaEstimator } from '../scheduling/EtaEstimator';
import type { PlanningView } from '../scheduling/PlanningView';
import { DispatchStrategy } from './DispatchStrategy';

export class EtaCostStrategy extends DispatchStrategy {
  override readonly name = 'eta';
  private readonly estimator: EtaEstimator;
  private readonly stopPenaltyMs: number;

  constructor(config: SimulationConfig) {
    super();
    this.estimator = new EtaEstimator(config);
    this.stopPenaltyMs = config.stopPenaltyMs;
  }

  protected override cost(view: PlanningView, call: HallCall): number {
    const eta = this.estimator.estimateMs(view, call);
    return eta + this.stopPenaltyMs * (view.carCalls.length + view.hallCalls.length);
  }
}
