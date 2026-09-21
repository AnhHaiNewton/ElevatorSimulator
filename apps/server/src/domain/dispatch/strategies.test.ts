import { describe, expect, it } from 'vitest';

import { CarCall } from '../requests/CarCall';
import { HallCall } from '../requests/HallCall';
import type { PlanningView } from '../scheduling/PlanningView';
import { TEST_CONFIG } from '../../test-utils/testConfig';
import { EtaCostStrategy } from './EtaCostStrategy';
import { NearestCarStrategy } from './NearestCarStrategy';

describe('dispatch strategies', () => {
  // A is already moving up with 3 car calls ahead; B is idle and further away in raw distance
  // but has nothing else to do. This is the headline A/B example for the presentation.
  const viewA: PlanningView = {
    id: 1,
    floor: 3,
    heading: 'up',
    phase: 'moving',
    remainingMs: 500,
    carCalls: [new CarCall(4), new CarCall(5), new CarCall(6)],
    hallCalls: [],
  };
  const viewB: PlanningView = {
    id: 2,
    floor: 1,
    heading: 'idle',
    phase: 'idle',
    remainingMs: 0,
    carCalls: [],
    hallCalls: [],
  };
  const call = new HallCall(7, 'up', 0);

  it('NearestCarStrategy picks the closer, already-approaching car', () => {
    const strategy = new NearestCarStrategy(TEST_CONFIG);
    expect(strategy.select([viewA, viewB], call)).toBe(1);
  });

  it('EtaCostStrategy picks the car that actually arrives sooner once its route is accounted for', () => {
    const strategy = new EtaCostStrategy(TEST_CONFIG);
    expect(strategy.select([viewA, viewB], call)).toBe(2);
  });

  it('breaks a cost tie by preferring the lower elevator id', () => {
    const strategy = new NearestCarStrategy(TEST_CONFIG);
    const idleTwo: PlanningView = { ...viewB, id: 2, floor: 5 };
    const idleOne: PlanningView = { ...viewB, id: 1, floor: 5 };
    expect(strategy.select([idleTwo, idleOne], new HallCall(7, 'up', 0))).toBe(1);
  });
});
