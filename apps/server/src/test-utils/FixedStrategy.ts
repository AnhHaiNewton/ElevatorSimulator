import { DispatchStrategy } from '../domain/dispatch/DispatchStrategy';
import type { HallCall } from '../domain/requests/HallCall';
import type { PlanningView } from '../domain/scheduling/PlanningView';

export class FixedStrategy extends DispatchStrategy {
  override readonly name = 'fixed';
  target: number;

  constructor(target: number) {
    super();
    this.target = target;
  }

  protected override cost(view: PlanningView, _call: HallCall): number {
    return view.id === this.target ? 0 : 1;
  }
}
