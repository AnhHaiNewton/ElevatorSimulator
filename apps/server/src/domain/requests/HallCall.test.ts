import { describe, expect, it } from 'vitest';

import { HallCall } from './HallCall';

describe('HallCall', () => {
  it('exposes a floor:direction key', () => {
    const call = new HallCall(5, 'up', 0);
    expect(call.key).toBe('5:up');
    expect(HallCall.keyOf(5, 'up')).toBe('5:up');
  });

  it('starts unassigned and can be assigned', () => {
    const call = new HallCall(5, 'up', 0);
    expect(call.assignedTo).toBeNull();
    call.assignTo(2);
    expect(call.assignedTo).toBe(2);
  });

  it('matches only its own floor and direction', () => {
    const call = new HallCall(5, 'up', 0);
    expect(call.matches(5, 'up')).toBe(true);
    expect(call.matches(5, 'down')).toBe(false);
    expect(call.matches(6, 'up')).toBe(false);
  });

  it('describes itself with an arrow', () => {
    expect(new HallCall(5, 'up', 0).describe()).toBe('5▲');
    expect(new HallCall(5, 'down', 0).describe()).toBe('5▼');
  });

  describe('shouldStopAt', () => {
    it('never stops at a different floor', () => {
      const call = new HallCall(5, 'up', 0);
      expect(call.shouldStopAt({ floor: 6, heading: 'up', hasRequestsBeyond: false })).toBe(false);
    });

    it('stops when idle regardless of direction', () => {
      expect(
        new HallCall(5, 'up', 0).shouldStopAt({ floor: 5, heading: 'idle', hasRequestsBeyond: false }),
      ).toBe(true);
      expect(
        new HallCall(5, 'down', 0).shouldStopAt({ floor: 5, heading: 'idle', hasRequestsBeyond: false }),
      ).toBe(true);
    });

    it('stops when the heading matches its own direction', () => {
      const call = new HallCall(5, 'up', 0);
      expect(call.shouldStopAt({ floor: 5, heading: 'up', hasRequestsBeyond: true })).toBe(true);
    });

    it('does not stop for the opposite direction while requests remain beyond', () => {
      const call = new HallCall(5, 'down', 0);
      expect(call.shouldStopAt({ floor: 5, heading: 'up', hasRequestsBeyond: true })).toBe(false);
    });

    it('stops for the opposite direction at the turnaround point (nothing beyond)', () => {
      const call = new HallCall(5, 'down', 0);
      expect(call.shouldStopAt({ floor: 5, heading: 'up', hasRequestsBeyond: false })).toBe(true);
    });
  });
});
