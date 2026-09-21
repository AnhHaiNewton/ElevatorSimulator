import type {
  Direction,
  ElevatorSnapshot,
  ElevatorStateName,
  Heading,
  SimulationConfig,
} from '@elevator/shared';
import { BOARDING_STATES } from '@elevator/shared';

import { step, symbol } from '../direction';
import { DomainError } from '../DomainError';
import { CarCall } from '../requests/CarCall';
import type { HallCall } from '../requests/HallCall';
import type { PlanningView } from '../scheduling/PlanningView';
import { RoutePlanner } from '../scheduling/RoutePlanner';
import type { RouteState } from '../scheduling/RouteState';
import type { ElevatorContext, ElevatorListener } from './ElevatorContext';
import { DoorClosingState } from './states/DoorClosingState';
import { DoorOpenState } from './states/DoorOpenState';
import { DoorOpeningState } from './states/DoorOpeningState';
import { ElevatorState } from './states/ElevatorState';
import { IdleState } from './states/IdleState';
import { MovingState } from './states/MovingState';

export class Elevator {
  readonly id: number;
  private readonly config: SimulationConfig;
  private readonly listener: ElevatorListener;
  private readonly ctx: ElevatorContext;

  private _floor: number;
  private _heading: Heading = 'idle';
  private _state: ElevatorState = new IdleState();
  private _carCalls: CarCall[] = [];
  private _hallCalls: HallCall[] = [];
  private _held = false;

  constructor(id: number, config: SimulationConfig, listener: ElevatorListener, initialFloor: number) {
    this.id = id;
    this.config = config;
    this.listener = listener;
    this._floor = initialFloor;

    // The `get doorHeld()` accessor below needs a closure over the elevator's own `this`,
    // since an object-literal getter's own `this` refers to the ctx object, not to Elevator.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.ctx = {
      config,
      get doorHeld() {
        return self._held;
      },
      route: () => self.buildRoute(),
      setHeading: (heading) => {
        self._heading = heading;
      },
      setDoorHeld: (held) => {
        self._held = held;
      },
      moveOneFloor: () => self.moveOneFloor(),
      stopAndOpenDoors: () => self.stopAndOpenDoors(),
      transitionTo: (name) => self.transitionTo(name),
      log: (message) => self.listener.onLog(message),
    };
  }

  get floor(): number {
    return this._floor;
  }

  get heading(): Heading {
    return this._heading;
  }

  get stateName(): ElevatorStateName {
    return this._state.name;
  }

  get doorHeld(): boolean {
    return this._held;
  }

  get isBoarding(): boolean {
    return BOARDING_STATES.includes(this._state.name);
  }

  tick(dtMs: number): void {
    this._state.tick(this.ctx, dtMs);
  }

  assignHallCall(call: HallCall): void {
    if (this._hallCalls.some((h) => h.matches(call.floor, call.direction))) return;
    this._hallCalls.push(call);
  }

  unassignHallCall(floor: number, direction: Direction): void {
    this._hallCalls = this._hallCalls.filter((h) => !h.matches(floor, direction));
  }

  addCarCall(floor: number): void {
    if (floor < 1 || floor > this.config.floors) {
      throw new DomainError(`floor ${floor} is out of range`);
    }
    if (!this.isBoarding) {
      throw new DomainError(`elevator ${this.id} is not boarding`);
    }
    if (floor === this._floor) return;
    if (this._carCalls.some((c) => c.floor === floor)) return;
    this._carCalls.push(new CarCall(floor));
  }

  tryServeHallCallNow(floor: number, direction: Direction): boolean {
    if (this._floor !== floor || !this.isBoarding) return false;
    if (this._heading !== 'idle' && this._heading !== direction) return false;
    this._heading = direction;
    this._state.onBoardingRequest(this.ctx);
    return true;
  }

  pressDoorOpen(): boolean {
    if (this._state.name === 'MOVING') return false;
    this._held = true;
    this._state.onDoorOpenPressed(this.ctx);
    return true;
  }

  releaseDoorOpen(): void {
    if (!this._held) return;
    this._held = false;
    this._state.onDoorOpenReleased(this.ctx);
  }

  pressDoorClose(): boolean {
    if (this._state.name === 'MOVING') return false;
    this._state.onDoorClosePressed(this.ctx);
    return true;
  }

  getPlanningView(): PlanningView {
    return {
      id: this.id,
      floor: this._floor,
      heading: this._heading,
      phase: this._state.phase,
      remainingMs: this._state.remainingBusyMs(this.config, this._held),
      carCalls: [...this._carCalls],
      hallCalls: [...this._hallCalls],
    };
  }

  toSnapshot(): ElevatorSnapshot {
    return {
      id: this.id,
      floor: this._floor,
      heading: this._heading,
      state: this._state.name,
      doorHeld: this._held,
      carCalls: this._carCalls.map((c) => c.floor).sort((a, b) => a - b),
      assignedHallCalls: this._hallCalls.map((h) => ({ floor: h.floor, direction: h.direction })),
    };
  }

  private buildRoute(): RouteState {
    return {
      floor: this._floor,
      heading: this._heading,
      carCalls: [...this._carCalls],
      hallCalls: [...this._hallCalls],
    };
  }

  private moveOneFloor(): void {
    if (this._heading === 'idle') throw new Error('cannot move while idle');
    const next = this._floor + step(this._heading);
    if (next < 1 || next > this.config.floors) throw new Error(`floor ${next} is out of range`);
    this._floor = next;
  }

  private stopAndOpenDoors(): void {
    const heading = RoutePlanner.headingAtStop(this.buildRoute());
    this._heading = heading;
    this._carCalls = this._carCalls.filter((c) => c.floor !== this._floor);
    if (heading !== 'idle') {
      this._hallCalls = this._hallCalls.filter((h) => !h.matches(this._floor, heading));
    }
    this.transitionTo('DOOR_OPENING');
    this.listener.onStop(this.id, this._floor, heading);
  }

  private transitionTo(name: ElevatorStateName): void {
    this._state = createState(name);
    if (name === 'MOVING') {
      this._held = false;
      this.listener.onLog(`E${this.id} departing ${this._floor} ${symbol(this._heading)}`);
    }
  }
}

function createState(name: ElevatorStateName): ElevatorState {
  switch (name) {
    case 'IDLE':
      return new IdleState();
    case 'MOVING':
      return new MovingState();
    case 'DOOR_OPENING':
      return new DoorOpeningState();
    case 'DOOR_OPEN':
      return new DoorOpenState();
    case 'DOOR_CLOSING':
      return new DoorClosingState();
  }
}
