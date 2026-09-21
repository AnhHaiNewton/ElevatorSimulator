import type { HallCall } from '../requests/HallCall';
import type { PlanningView } from '../scheduling/PlanningView';

export abstract class DispatchStrategy {
  abstract readonly name: string;
  protected abstract cost(view: PlanningView, call: HallCall): number;

  /** Cheapest wins; ties go to an idle elevator with no pending work first, then to the lowest id. */
  select(views: readonly PlanningView[], call: HallCall): number {
    if (views.length === 0) throw new Error('select requires at least one view');
    let best = views[0]!;
    let bestCost = this.cost(best, call);
    for (let i = 1; i < views.length; i++) {
      const view = views[i]!;
      const cost = this.cost(view, call);
      if (this.isBetter(view, cost, best, bestCost)) {
        best = view;
        bestCost = cost;
      }
    }
    return best.id;
  }

  private isBetter(
    candidate: PlanningView,
    candidateCost: number,
    current: PlanningView,
    currentCost: number,
  ): boolean {
    if (candidateCost !== currentCost) return candidateCost < currentCost;
    const candidateIdle = this.isFullyIdle(candidate);
    const currentIdle = this.isFullyIdle(current);
    if (candidateIdle !== currentIdle) return candidateIdle;
    return candidate.id < current.id;
  }

  private isFullyIdle(view: PlanningView): boolean {
    return view.phase === 'idle' && view.carCalls.length === 0 && view.hallCalls.length === 0;
  }
}
