import { describe, expect, it } from 'vitest';

import { CarCall } from '../requests/CarCall';
import { HallCall } from '../requests/HallCall';
import { TEST_CONFIG } from '../../test-utils/testConfig';
import { EtaEstimator } from './EtaEstimator';
import type { PlanningView } from './PlanningView';

describe('EtaEstimator', () => {
  const estimator = new EtaEstimator(TEST_CONFIG);

  it('returns 0 when idle exactly at the target floor and direction', () => {
    const view: PlanningView = {
      id: 1,
      floor: 5,
      heading: 'idle',
      phase: 'idle',
      remainingMs: 0,
      carCalls: [],
      hallCalls: [],
    };
    expect(estimator.estimateMs(view, new HallCall(5, 'up', 0))).toBe(0);
  });

  it('drives up past the target floor, turns around and serves it on the way back down', () => {
    const view: PlanningView = {
      id: 1,
      floor: 1,
      heading: 'idle',
      phase: 'idle',
      remainingMs: 0,
      carCalls: [],
      hallCalls: [],
    };
    expect(estimator.estimateMs(view, new HallCall(5, 'down', 0))).toBe(4000);
  });

  it('serves a newly appended opposite-direction call at the floor already cycling its doors', () => {
    const view: PlanningView = {
      id: 1,
      floor: 5,
      heading: 'up',
      phase: 'doors',
      remainingMs: 2500,
      carCalls: [],
      hallCalls: [],
    };
    expect(estimator.estimateMs(view, new HallCall(5, 'down', 0))).toBe(2500);
  });

  it('walks a full car-call route before reaching a trailing hall call', () => {
    const view: PlanningView = {
      id: 1,
      floor: 3,
      heading: 'up',
      phase: 'moving',
      remainingMs: 500,
      carCalls: [new CarCall(4), new CarCall(5), new CarCall(6)],
      hallCalls: [],
    };
    expect(estimator.estimateMs(view, new HallCall(7, 'up', 0))).toBe(12500);
  });
});
