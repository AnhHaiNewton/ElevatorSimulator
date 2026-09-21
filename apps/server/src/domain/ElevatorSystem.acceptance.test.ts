import type { Heading } from '@elevator/shared';
import { DEFAULT_CONFIG } from '@elevator/shared';
import { describe, expect, it } from 'vitest';

import { advance, advanceUntil } from '../test-utils/advance';
import { FixedStrategy } from '../test-utils/FixedStrategy';
import { TEST_CONFIG } from '../test-utils/testConfig';
import { DomainError } from './DomainError';
import { EtaCostStrategy } from './dispatch/EtaCostStrategy';
import { ElevatorSystem } from './ElevatorSystem';

type Stop = { elevatorId: number; floor: number; heading: Heading };

function trackStops(system: ElevatorSystem): Stop[] {
  const stops: Stop[] = [];
  system.on('stop', (e) => stops.push(e));
  return stops;
}

describe('ElevatorSystem acceptance', () => {
  it('walks the brief example end-to-end and records wait metrics', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [1] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));
    const stops = trackStops(system);

    system.requestHallCall(1, 'up');
    advanceUntil(system, () => system.getSnapshot().elevators[0]?.state === 'DOOR_OPEN');
    system.requestCarCall(1, 10);

    advanceUntil(system, () => (system.getSnapshot().elevators[0]?.floor ?? 0) >= 2);
    system.requestHallCall(5, 'up');
    system.requestHallCall(5, 'down');

    advanceUntil(
      system,
      () => system.getSnapshot().hallCalls.length === 0 && system.getSnapshot().elevators[0]?.state === 'IDLE',
    );

    expect(stops).toEqual([
      { elevatorId: 1, floor: 1, heading: 'up' },
      { elevatorId: 1, floor: 5, heading: 'up' },
      { elevatorId: 1, floor: 10, heading: 'down' },
      { elevatorId: 1, floor: 5, heading: 'down' },
    ]);

    const metrics = system.getSnapshot().metrics;
    expect(metrics.servedHallCalls).toBe(3);
    expect(metrics.avgWaitMs).toBeGreaterThan(0);
    expect(metrics.maxWaitMs).toBeGreaterThan(0);
  });

  it('serves a call beyond another before turning back for the nearer one', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [1] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));
    const stops = trackStops(system);

    system.requestHallCall(5, 'down');
    system.requestHallCall(7, 'down');

    advanceUntil(system, () => system.getSnapshot().hallCalls.length === 0);

    expect(stops).toEqual([
      { elevatorId: 1, floor: 7, heading: 'down' },
      { elevatorId: 1, floor: 5, heading: 'down' },
    ]);
  });

  it('opens immediately for a hall call at the elevator’s own floor', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [3] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));

    system.requestHallCall(3, 'down');
    system.tick(100);

    const snap = system.getSnapshot().elevators[0]!;
    expect(snap.state).toBe('DOOR_OPENING');
    expect(snap.floor).toBe(3);
    expect(snap.heading).toBe('down');
  });

  it('assigns each call to the nearest idle elevator, with no ticking between requests', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 3, initialFloors: [1, 5, 10] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));

    system.requestHallCall(6, 'up');
    system.requestHallCall(9, 'down');
    system.requestHallCall(2, 'up');

    const snap = system.getSnapshot();
    expect(snap.hallCalls.find((h) => h.floor === 6 && h.direction === 'up')?.assignedTo).toBe(2);
    expect(snap.hallCalls.find((h) => h.floor === 9 && h.direction === 'down')?.assignedTo).toBe(3);
    expect(snap.hallCalls.find((h) => h.floor === 2 && h.direction === 'up')?.assignedTo).toBe(1);
  });

  it('avoids assigning a same-floor down call to a car already committed past it', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 2, initialFloors: [1, 1] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));

    system.requestHallCall(1, 'up');
    expect(system.getSnapshot().hallCalls.find((h) => h.floor === 1)?.assignedTo).toBe(1);

    advanceUntil(system, () => system.getSnapshot().elevators[0]?.state === 'DOOR_OPEN');
    system.requestCarCall(1, 10);

    advanceUntil(system, () => (system.getSnapshot().elevators[0]?.floor ?? 0) >= 6);
    system.requestHallCall(5, 'down');

    const snap = system.getSnapshot();
    expect(snap.hallCalls.find((h) => h.floor === 5 && h.direction === 'down')?.assignedTo).toBe(2);
  });

  it('ignores a duplicate hall call', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [1] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));

    system.requestHallCall(5, 'up');
    system.requestHallCall(5, 'up');

    expect(system.getSnapshot().hallCalls).toHaveLength(1);
  });

  it('serves a repeated call at the boarding floor immediately and resets the dwell', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [3] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));

    system.requestHallCall(3, 'up');
    advanceUntil(system, () => system.getSnapshot().elevators[0]?.state === 'DOOR_OPEN');
    advance(system, 1500);

    system.requestHallCall(3, 'up');
    expect(system.getSnapshot().hallCalls).toHaveLength(0);
    expect(system.getSnapshot().metrics.servedHallCalls).toBe(2);

    advance(system, 1500);
    expect(system.getSnapshot().elevators[0]?.state).toBe('DOOR_OPEN');
  });

  it('lets an elevator that opportunistically passes a floor steal the hall call from its assignee', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 2, initialFloors: [1, 10] };
    const strategy = new FixedStrategy(1);
    const system = new ElevatorSystem(config, strategy);
    const stops = trackStops(system);

    system.requestHallCall(1, 'up');
    advanceUntil(system, () => system.getSnapshot().elevators[0]?.state === 'DOOR_OPEN');
    system.requestCarCall(1, 3);
    system.requestCarCall(1, 8);

    strategy.target = 2;
    system.requestHallCall(3, 'up');
    expect(system.getSnapshot().hallCalls.find((h) => h.floor === 3 && h.direction === 'up')?.assignedTo).toBe(2);

    advanceUntil(system, () => stops.some((s) => s.elevatorId === 1 && s.floor === 3));

    const snap = system.getSnapshot();
    expect(snap.hallCalls).toHaveLength(0);
    const e2 = snap.elevators.find((e) => e.id === 2)!;
    expect(e2.assignedHallCalls).toHaveLength(0);

    advance(system, 10000);
    const after = system.getSnapshot();
    const e2After = after.elevators.find((e) => e.id === 2)!;
    expect(e2After.state).toBe('IDLE');
    expect(e2After.floor).toBeGreaterThan(3);
  });

  describe('validation', () => {
    it('rejects impossible hall calls', () => {
      const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [1] };
      const system = new ElevatorSystem(config, new EtaCostStrategy(config));
      expect(() => system.requestHallCall(1, 'down')).toThrow(DomainError);
      expect(() => system.requestHallCall(10, 'up')).toThrow(DomainError);
      expect(() => system.requestHallCall(0, 'up')).toThrow(DomainError);
    });

    it('rejects a car call while the elevator is not boarding', () => {
      const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [1] };
      const system = new ElevatorSystem(config, new EtaCostStrategy(config));
      expect(() => system.requestCarCall(1, 5)).toThrow(DomainError);
    });

    it('rejects a car call for an unknown elevator', () => {
      const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [1] };
      const system = new ElevatorSystem(config, new EtaCostStrategy(config));
      expect(() => system.requestCarCall(9, 5)).toThrow(DomainError);
    });
  });

  it('ignores door commands at the wrong floor or while moving, without throwing', () => {
    const config = { ...TEST_CONFIG, elevatorCount: 1, initialFloors: [1] };
    const system = new ElevatorSystem(config, new EtaCostStrategy(config));

    expect(() => system.pressDoorOpen(1, 5)).not.toThrow();
    expect(() => system.pressDoorClose(1, 5)).not.toThrow();
    expect(() => system.releaseDoorOpen(1)).not.toThrow();
    expect(system.getSnapshot().elevators[0]?.state).toBe('IDLE');
    expect(system.getSnapshot().elevators[0]?.doorHeld).toBe(false);

    system.requestHallCall(6, 'up');
    system.tick(100); // -> MOVING
    expect(system.getSnapshot().elevators[0]?.state).toBe('MOVING');
    const movingFloor = system.getSnapshot().elevators[0]!.floor;
    expect(() => system.pressDoorOpen(1, movingFloor)).not.toThrow();
    expect(system.getSnapshot().elevators[0]?.state).toBe('MOVING');
  });

  describe('snapshot', () => {
    it('starts with 3 elevators at floor 1, idle, and the eta strategy', () => {
      const system = new ElevatorSystem(DEFAULT_CONFIG, new EtaCostStrategy(DEFAULT_CONFIG));
      const snap = system.getSnapshot();

      expect(snap.elevators).toHaveLength(3);
      for (const e of snap.elevators) {
        expect(e.floor).toBe(1);
        expect(e.state).toBe('IDLE');
        expect(e.heading).toBe('idle');
      }
      expect(snap.hallCalls).toEqual([]);
      expect(snap.strategy).toBe('eta');
    });

    it('returns to the initial state after reset', () => {
      const system = new ElevatorSystem(DEFAULT_CONFIG, new EtaCostStrategy(DEFAULT_CONFIG));
      system.requestHallCall(5, 'up');
      system.tick(1000);

      system.reset();

      const snap = system.getSnapshot();
      expect(snap.simTimeMs).toBe(0);
      expect(snap.hallCalls).toEqual([]);
      for (const e of snap.elevators) {
        expect(e.floor).toBe(1);
        expect(e.state).toBe('IDLE');
        expect(e.heading).toBe('idle');
      }
    });
  });
});
