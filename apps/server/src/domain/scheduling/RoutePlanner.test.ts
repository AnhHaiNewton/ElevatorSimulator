import { describe, expect, it } from 'vitest';

import { CarCall } from '../requests/CarCall';
import { HallCall } from '../requests/HallCall';
import { RoutePlanner } from './RoutePlanner';
import type { RouteState } from './RouteState';

describe('RoutePlanner.shouldStop', () => {
  it('stops for a car call at this floor', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [new CarCall(5)], hallCalls: [] };
    expect(RoutePlanner.shouldStop(route)).toBe(true);
  });

  it('stops for a hall call at this floor in the same direction', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'up',
      carCalls: [],
      hallCalls: [new HallCall(5, 'up', 0)],
    };
    expect(RoutePlanner.shouldStop(route)).toBe(true);
  });

  it('does not stop for the opposite direction while requests remain beyond', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'up',
      carCalls: [new CarCall(8)],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.shouldStop(route)).toBe(false);
  });

  it('stops for the opposite direction when nothing is beyond', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'up',
      carCalls: [],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.shouldStop(route)).toBe(true);
  });

  it('stops for a hall call of either direction while idle', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'idle',
      carCalls: [],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.shouldStop(route)).toBe(true);
  });

  it('does not stop when there is no request at this floor', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [new CarCall(8)], hallCalls: [] };
    expect(RoutePlanner.shouldStop(route)).toBe(false);
  });
});

describe('RoutePlanner.headingAtStop', () => {
  it('turns around for a hall call in the opposite direction when nothing else is pending', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'up',
      carCalls: [],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.headingAtStop(route)).toBe('down');
  });

  it('keeps heading up when a car call is ahead', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [new CarCall(8)], hallCalls: [] };
    expect(RoutePlanner.headingAtStop(route)).toBe('up');
  });

  it('turns around when only a car call behind remains', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [new CarCall(3)], hallCalls: [] };
    expect(RoutePlanner.headingAtStop(route)).toBe('down');
  });

  it('goes idle when nothing is left', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [], hallCalls: [] };
    expect(RoutePlanner.headingAtStop(route)).toBe('idle');
  });

  it('picks the pending hall call direction while idle', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'idle',
      carCalls: [],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.headingAtStop(route)).toBe('down');
  });

  it('prefers up when both directions are pending while idle', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'idle',
      carCalls: [],
      hallCalls: [new HallCall(5, 'up', 0), new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.headingAtStop(route)).toBe('up');
  });
});

describe('RoutePlanner.nextHeading', () => {
  it('continues when requests are beyond', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [new CarCall(8)], hallCalls: [] };
    expect(RoutePlanner.nextHeading(route)).toBe('up');
  });

  it('reverses when requests are only behind', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [new CarCall(3)], hallCalls: [] };
    expect(RoutePlanner.nextHeading(route)).toBe('down');
  });

  it('heads toward the nearest request while idle', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'idle',
      carCalls: [new CarCall(3), new CarCall(8)],
      hallCalls: [],
    };
    expect(RoutePlanner.nextHeading(route)).toBe('down');
  });

  it('breaks ties by going up', () => {
    const route: RouteState = {
      floor: 5,
      heading: 'idle',
      carCalls: [new CarCall(3), new CarCall(7)],
      hallCalls: [],
    };
    expect(RoutePlanner.nextHeading(route)).toBe('up');
  });

  it('goes idle when nothing remains except the current floor', () => {
    const route: RouteState = { floor: 5, heading: 'up', carCalls: [new CarCall(5)], hallCalls: [] };
    expect(RoutePlanner.nextHeading(route)).toBe('idle');
  });
});

describe('brief scenario: heading up to 10 with 5▲ and 5▼ pending', () => {
  it('walks the full worked example from §7.2', () => {
    // 1. At floor 5, heading up, with the car call at 10 and both hall calls pending.
    const atFive: RouteState = {
      floor: 5,
      heading: 'up',
      carCalls: [new CarCall(10)],
      hallCalls: [new HallCall(5, 'up', 0), new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.shouldStop(atFive)).toBe(true);
    expect(RoutePlanner.headingAtStop(atFive)).toBe('up'); // 5▲ is served

    // 5▼ alone (no 5▲) would not stop the car, because the car call at 10 is beyond.
    const atFiveDownOnly: RouteState = {
      floor: 5,
      heading: 'up',
      carCalls: [new CarCall(10)],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.shouldStop(atFiveDownOnly)).toBe(false);

    // 2. At floor 10: 5▲ was served and removed, 5▼ is still pending.
    const atTen: RouteState = {
      floor: 10,
      heading: 'up',
      carCalls: [new CarCall(10)],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.shouldStop(atTen)).toBe(true); // the car call stops it
    expect(RoutePlanner.headingAtStop(atTen)).toBe('down'); // nothing ahead, 5▼ is beyond going down

    // 3. Back at floor 5, heading down: 5▼ stops and is served.
    const backAtFive: RouteState = {
      floor: 5,
      heading: 'down',
      carCalls: [],
      hallCalls: [new HallCall(5, 'down', 0)],
    };
    expect(RoutePlanner.shouldStop(backAtFive)).toBe(true);
    expect(RoutePlanner.headingAtStop(backAtFive)).toBe('down');
  });
});
