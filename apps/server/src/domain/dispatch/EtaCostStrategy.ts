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
    const disruption = this.disruptionCost(view, call);
    return eta + disruption + this.stopPenaltyMs * (view.carCalls.length + view.hallCalls.length);
  }

  /**
   * Extra wait this assignment would impose on hall calls the elevator already holds.
   * A raw ETA-to-the-new-call can look cheap on a car that's mid-route simply because it
   * happens to be passing by right now — while forcing it to skip past (LOOK: something is
   * "beyond" in its travel direction) a call it already promised, adding many extra seconds
   * to that other passenger's wait. This measures that added wait directly and prices it in,
   * rather than relying on the flat per-stop penalty to (under-)approximate it.
   */
  private disruptionCost(view: PlanningView, call: HallCall): number {
    let total = 0;
    for (const existing of view.hallCalls) {
      const others = view.hallCalls.filter((h) => h !== existing);
      const before = this.estimator.estimateMs({ ...view, hallCalls: others }, existing);
      const after = this.estimator.estimateMs({ ...view, hallCalls: [...others, call] }, existing);
      if (Number.isFinite(before) && Number.isFinite(after)) {
        total += Math.max(0, after - before);
      }
    }
    return total;
  }
}
