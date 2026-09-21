import type { Heading } from '@elevator/shared';
import { describe, expect, it } from 'vitest';

import { DomainError } from '../DomainError';
import { HallCall } from '../requests/HallCall';
import { advance, advanceUntil } from '../../test-utils/advance';
import { TEST_CONFIG } from '../../test-utils/testConfig';
import type { ElevatorListener } from './ElevatorContext';
import { Elevator } from './Elevator';

class StubListener implements ElevatorListener {
  readonly stops: { elevatorId: number; floor: number; heading: Heading }[] = [];
  readonly logs: string[] = [];

  onStop(elevatorId: number, floor: number, heading: Heading): void {
    this.stops.push({ elevatorId, floor, heading });
  }

  onLog(message: string): void {
    this.logs.push(message);
  }
}

function openAtFloorThree(): { elevator: Elevator; listener: StubListener } {
  const listener = new StubListener();
  const elevator = new Elevator(1, TEST_CONFIG, listener, 3);
  elevator.assignHallCall(new HallCall(3, 'up', 0));
  elevator.tick(100); // IDLE -> DOOR_OPENING (fresh)
  return { elevator, listener };
}

describe('Elevator', () => {
  it('opens at its own floor', () => {
    const { elevator, listener } = openAtFloorThree();
    expect(elevator.stateName).toBe('DOOR_OPENING');
    expect(elevator.floor).toBe(3);
    expect(elevator.heading).toBe('up');
    expect(listener.stops).toEqual([{ elevatorId: 1, floor: 3, heading: 'up' }]);
    expect(elevator.toSnapshot().assignedHallCalls).toEqual([]);
  });

  it('cycles through the door states over time', () => {
    const { elevator } = openAtFloorThree();
    advance(elevator, 500);
    expect(elevator.stateName).toBe('DOOR_OPEN');
    advance(elevator, 2000);
    expect(elevator.stateName).toBe('DOOR_CLOSING');
    advance(elevator, 500);
    expect(elevator.stateName).toBe('IDLE');
  });

  it('travels to a hall call and stops there', () => {
    const listener = new StubListener();
    const elevator = new Elevator(1, TEST_CONFIG, listener, 3);
    elevator.assignHallCall(new HallCall(6, 'up', 0));

    elevator.tick(100);
    expect(elevator.stateName).toBe('MOVING');
    expect(elevator.heading).toBe('up');

    advance(elevator, 1000); // ~1100ms total: at floor 4
    expect(elevator.floor).toBe(4);

    advanceUntil(elevator, () => elevator.stateName === 'DOOR_OPENING');
    expect(elevator.floor).toBe(6);
    expect(elevator.heading).toBe('up');
  });

  it('holds the door open while pressed and resumes the dwell after release', () => {
    const { elevator } = openAtFloorThree();
    advance(elevator, 500); // DOOR_OPEN

    elevator.pressDoorOpen();
    advance(elevator, 5000);
    expect(elevator.stateName).toBe('DOOR_OPEN');
    expect(elevator.doorHeld).toBe(true);

    elevator.releaseDoorOpen();
    advance(elevator, 1900);
    expect(elevator.stateName).toBe('DOOR_OPEN');

    advance(elevator, 200);
    expect(elevator.stateName).toBe('DOOR_CLOSING');
  });

  it('releases the door automatically after the max hold time', () => {
    const { elevator } = openAtFloorThree();
    advance(elevator, 500); // DOOR_OPEN
    elevator.pressDoorOpen();

    advance(elevator, 10000);
    expect(elevator.doorHeld).toBe(false);
    expect(elevator.stateName).toBe('DOOR_OPEN');

    advance(elevator, 2000);
    expect(elevator.stateName).toBe('DOOR_CLOSING');
  });

  describe('close button', () => {
    it('closes immediately when pressed at DOOR_OPEN', () => {
      const { elevator } = openAtFloorThree();
      advance(elevator, 500);
      elevator.pressDoorClose();
      expect(elevator.stateName).toBe('DOOR_CLOSING');
    });

    it('reopens when open is pressed while closing', () => {
      const { elevator } = openAtFloorThree();
      advance(elevator, 500);
      elevator.pressDoorClose();
      expect(elevator.stateName).toBe('DOOR_CLOSING');
      elevator.pressDoorOpen();
      expect(elevator.stateName).toBe('DOOR_OPENING');
    });

    it('ignores close while the door is held open', () => {
      const { elevator } = openAtFloorThree();
      advance(elevator, 500);
      elevator.pressDoorOpen();
      elevator.pressDoorClose();
      expect(elevator.stateName).toBe('DOOR_OPEN');
    });
  });

  it('ignores door buttons while moving', () => {
    const listener = new StubListener();
    const elevator = new Elevator(1, TEST_CONFIG, listener, 3);
    elevator.assignHallCall(new HallCall(6, 'up', 0));
    elevator.tick(100);
    expect(elevator.stateName).toBe('MOVING');
    expect(elevator.pressDoorOpen()).toBe(false);
    expect(elevator.pressDoorClose()).toBe(false);
    expect(elevator.stateName).toBe('MOVING');
  });

  describe('car calls', () => {
    it('throws while idle', () => {
      const listener = new StubListener();
      const elevator = new Elevator(1, TEST_CONFIG, listener, 3);
      expect(() => elevator.addCarCall(7)).toThrow(DomainError);
    });

    it('accepts a destination while boarding, ignoring duplicates', () => {
      const { elevator } = openAtFloorThree();
      elevator.addCarCall(7);
      expect(elevator.toSnapshot().carCalls).toEqual([7]);
      elevator.addCarCall(7);
      expect(elevator.toSnapshot().carCalls).toEqual([7]);
    });

    it('is a no-op for the current floor', () => {
      const { elevator } = openAtFloorThree();
      elevator.addCarCall(3);
      expect(elevator.toSnapshot().carCalls).toEqual([]);
    });

    it('throws for an out-of-range floor', () => {
      const { elevator } = openAtFloorThree();
      expect(() => elevator.addCarCall(0)).toThrow(DomainError);
      expect(() => elevator.addCarCall(11)).toThrow(DomainError);
    });
  });

  describe('tryServeHallCallNow', () => {
    it('serves a matching hall call while boarding at this floor', () => {
      const { elevator } = openAtFloorThree();
      expect(elevator.tryServeHallCallNow(3, 'up')).toBe(true);
    });

    it('serves either direction while heading is idle', () => {
      const listener = new StubListener();
      const elevator = new Elevator(1, TEST_CONFIG, listener, 3);
      elevator.pressDoorOpen(); // IDLE -> DOOR_OPENING, heading stays idle
      expect(elevator.heading).toBe('idle');
      expect(elevator.tryServeHallCallNow(3, 'down')).toBe(true);
    });

    it('returns false at another floor', () => {
      const { elevator } = openAtFloorThree();
      expect(elevator.tryServeHallCallNow(4, 'up')).toBe(false);
    });

    it('returns false for the opposite heading', () => {
      const { elevator } = openAtFloorThree();
      expect(elevator.tryServeHallCallNow(3, 'down')).toBe(false);
    });

    it('returns false while idle or moving', () => {
      const listener = new StubListener();
      const elevator = new Elevator(1, TEST_CONFIG, listener, 3);
      expect(elevator.tryServeHallCallNow(3, 'up')).toBe(false); // IDLE

      elevator.assignHallCall(new HallCall(6, 'up', 0));
      elevator.tick(100); // MOVING
      expect(elevator.tryServeHallCallNow(4, 'up')).toBe(false);
    });

    it('resets the dwell when served again during DOOR_OPEN', () => {
      const { elevator } = openAtFloorThree();
      advance(elevator, 500); // DOOR_OPEN
      advance(elevator, 1500); // 1500ms into a 2000ms dwell
      elevator.tryServeHallCallNow(3, 'up');
      advance(elevator, 1500);
      expect(elevator.stateName).toBe('DOOR_OPEN'); // dwell restarted at 1500, not yet elapsed
    });

    it('reopens the door when served again during DOOR_CLOSING', () => {
      const { elevator } = openAtFloorThree();
      advance(elevator, 500); // DOOR_OPEN
      elevator.pressDoorClose();
      expect(elevator.stateName).toBe('DOOR_CLOSING');
      elevator.tryServeHallCallNow(3, 'up');
      expect(elevator.stateName).toBe('DOOR_OPENING');
    });
  });

  it('drops work removed mid-trip without opening doors', () => {
    const listener = new StubListener();
    const elevator = new Elevator(1, TEST_CONFIG, listener, 1);
    elevator.assignHallCall(new HallCall(8, 'up', 0));
    elevator.tick(100); // IDLE -> MOVING
    expect(elevator.stateName).toBe('MOVING');

    elevator.unassignHallCall(8, 'up');
    advance(elevator, 1000); // reach floor 2
    expect(elevator.floor).toBe(2);
    expect(elevator.stateName).toBe('IDLE');
    expect(listener.stops).toEqual([]);
    expect(elevator.heading).toBe('up'); // not yet recomputed

    elevator.tick(100); // IDLE recomputes heading with no requests left
    expect(elevator.heading).toBe('idle');
  });

  describe('remainingBusyMs (via getPlanningView().remainingMs)', () => {
    it('is 0 while idle', () => {
      const listener = new StubListener();
      const elevator = new Elevator(1, TEST_CONFIG, listener, 3);
      expect(elevator.getPlanningView().remainingMs).toBe(0);
    });

    it('counts down the remaining travel time while moving', () => {
      const listener = new StubListener();
      const elevator = new Elevator(1, TEST_CONFIG, listener, 1);
      elevator.assignHallCall(new HallCall(8, 'up', 0));
      elevator.tick(100); // -> MOVING (fresh)
      elevator.tick(100); // elapsed 100ms within MOVING
      expect(elevator.getPlanningView().remainingMs).toBe(TEST_CONFIG.floorTravelMs - 100);
    });

    it('accounts for the rest of opening, a full dwell and a close while opening', () => {
      const { elevator } = openAtFloorThree();
      const expected = TEST_CONFIG.doorTransitionMs + TEST_CONFIG.doorDwellMs + TEST_CONFIG.doorTransitionMs;
      expect(elevator.getPlanningView().remainingMs).toBe(expected);
    });

    it('accounts for the rest of the dwell plus a close while open', () => {
      const { elevator } = openAtFloorThree();
      advance(elevator, 500); // -> DOOR_OPEN (fresh)
      const expected = TEST_CONFIG.doorDwellMs + TEST_CONFIG.doorTransitionMs;
      expect(elevator.getPlanningView().remainingMs).toBe(expected);
    });

    it('counts down the remaining close time while closing', () => {
      const { elevator } = openAtFloorThree();
      advance(elevator, 500);
      elevator.pressDoorClose(); // -> DOOR_CLOSING (fresh)
      expect(elevator.getPlanningView().remainingMs).toBe(TEST_CONFIG.doorTransitionMs);
    });
  });
});
