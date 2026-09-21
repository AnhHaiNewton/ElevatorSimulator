import type { Heading } from '@elevator/shared';

import type { CarCall } from '../requests/CarCall';
import type { HallCall } from '../requests/HallCall';

export interface RouteState {
  floor: number;
  heading: Heading;
  carCalls: readonly CarCall[];
  hallCalls: readonly HallCall[];
}
