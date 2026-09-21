import type { Direction, Heading } from '@elevator/shared';

import { opposite } from '../direction';
import type { Request, StopContext } from '../requests/Request';
import type { RouteState } from './RouteState';

export class RoutePlanner {
  static requests(route: RouteState): Request[] {
    return [...route.carCalls, ...route.hallCalls];
  }

  static hasRequestsBeyond(route: RouteState, dir: Direction): boolean {
    return RoutePlanner.requests(route).some((r) => r.isBeyond(route.floor, dir));
  }

  /** Should the elevator stop (and open doors) at route.floor given its heading? */
  static shouldStop(route: RouteState): boolean {
    const hasRequestsBeyond =
      route.heading !== 'idle' && RoutePlanner.hasRequestsBeyond(route, route.heading);
    const ctx: StopContext = { floor: route.floor, heading: route.heading, hasRequestsBeyond };
    return RoutePlanner.requests(route).some((r) => r.shouldStopAt(ctx));
  }

  /** Heading shown after stopping at route.floor (decides which hall call is served here). */
  static headingAtStop(route: RouteState): Heading {
    const hallHere = (d: Direction) => route.hallCalls.some((h) => h.matches(route.floor, d));
    if (route.heading !== 'idle') {
      const ahead = route.heading;
      if (hallHere(ahead) || RoutePlanner.hasRequestsBeyond(route, ahead)) return ahead;
      const back = opposite(ahead);
      if (hallHere(back) || RoutePlanner.hasRequestsBeyond(route, back)) return back;
      return 'idle';
    }
    if (hallHere('up')) return 'up';
    if (hallHere('down')) return 'down';
    return RoutePlanner.nextHeading(route);
  }

  /** Direction to travel next from route.floor (requests AT route.floor are ignored here). */
  static nextHeading(route: RouteState): Heading {
    const others = RoutePlanner.requests(route).filter((r) => r.floor !== route.floor);
    if (others.length === 0) return 'idle';
    if (route.heading !== 'idle') {
      return RoutePlanner.hasRequestsBeyond(route, route.heading) ? route.heading : opposite(route.heading);
    }
    let best = others[0]!;
    for (const r of others) {
      const d = Math.abs(r.floor - route.floor);
      const bd = Math.abs(best.floor - route.floor);
      if (d < bd || (d === bd && r.floor > best.floor)) best = r;
    }
    return best.floor > route.floor ? 'up' : 'down';
  }
}
