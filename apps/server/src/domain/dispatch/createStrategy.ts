import type { SimulationConfig, StrategyName } from '@elevator/shared';

import type { DispatchStrategy } from './DispatchStrategy';
import { EtaCostStrategy } from './EtaCostStrategy';
import { NearestCarStrategy } from './NearestCarStrategy';

export function createStrategy(name: StrategyName, config: SimulationConfig): DispatchStrategy {
  switch (name) {
    case 'eta':
      return new EtaCostStrategy(config);
    case 'nearest':
      return new NearestCarStrategy(config);
  }
}
