import { EventEmitter } from 'node:events';

import type {
  Direction,
  HallCallDto,
  Heading,
  LogEntry,
  SimulationConfig,
  SystemSnapshot,
} from '@elevator/shared';

import type { DispatchStrategy } from './dispatch/DispatchStrategy';
import { DomainError } from './DomainError';
import { symbol } from './direction';
import { Elevator } from './elevator/Elevator';
import type { ElevatorListener } from './elevator/ElevatorContext';
import { EventLog } from './log/EventLog';
import { WaitMetrics } from './metrics/WaitMetrics';
import { HallCall } from './requests/HallCall';

type SystemEvents = {
  log: [entry: LogEntry];
  stop: [e: { elevatorId: number; floor: number; heading: Heading }];
  hallCallServed: [e: { elevatorId: number; floor: number; direction: Direction; waitMs: number }];
};

export class ElevatorSystem extends EventEmitter<SystemEvents> {
  private readonly config: SimulationConfig;
  private strategy: DispatchStrategy;
  private elevators: Elevator[] = [];
  private readonly hallCalls = new Map<string, HallCall>();
  private readonly metrics = new WaitMetrics();
  private readonly eventLog = new EventLog();
  private simTimeMs = 0;

  constructor(config: SimulationConfig, strategy: DispatchStrategy) {
    super();
    this.config = config;
    this.strategy = strategy;
    this.buildElevators();
  }

  requestHallCall(floor: number, direction: Direction): void {
    this.validateHallCall(floor, direction);

    const key = HallCall.keyOf(floor, direction);
    const existing = this.hallCalls.get(key);
    if (existing) {
      this.log(`${existing.describe()} already pending (E${String(existing.assignedTo)})`);
      return;
    }

    for (const elevator of this.elevators) {
      if (elevator.tryServeHallCallNow(floor, direction)) {
        const arrow = direction === 'up' ? '▲' : '▼';
        this.log(`${floor}${arrow} served immediately by E${elevator.id}`);
        this.metrics.record(0);
        this.emit('hallCallServed', { elevatorId: elevator.id, floor, direction, waitMs: 0 });
        return;
      }
    }

    const call = new HallCall(floor, direction, this.simTimeMs);
    const views = this.elevators.map((e) => e.getPlanningView());
    const id = this.strategy.select(views, call);
    call.assignTo(id);
    this.hallCalls.set(key, call);
    this.getElevator(id).assignHallCall(call);
    this.log(`${call.describe()} → E${id} (${this.strategy.name})`);
  }

  requestCarCall(elevatorId: number, floor: number): void {
    this.getElevator(elevatorId).addCarCall(floor);
  }

  pressDoorOpen(elevatorId: number, floor: number): void {
    const elevator = this.getElevator(elevatorId);
    if (elevator.floor !== floor) {
      this.log(`E${elevatorId} door-open ignored (not at floor ${floor})`);
      return;
    }
    if (!elevator.pressDoorOpen()) {
      this.log(`E${elevatorId} door-open ignored (moving)`);
    }
  }

  releaseDoorOpen(elevatorId: number): void {
    this.getElevator(elevatorId).releaseDoorOpen();
  }

  pressDoorClose(elevatorId: number, floor: number): void {
    const elevator = this.getElevator(elevatorId);
    if (elevator.floor !== floor) {
      this.log(`E${elevatorId} door-close ignored (not at floor ${floor})`);
      return;
    }
    if (!elevator.pressDoorClose()) {
      this.log(`E${elevatorId} door-close ignored (moving)`);
    }
  }

  setStrategy(strategy: DispatchStrategy): void {
    this.strategy = strategy;
  }

  reset(): void {
    this.simTimeMs = 0;
    this.hallCalls.clear();
    this.metrics.reset();
    this.eventLog.reset();
    this.buildElevators();
  }

  tick(dtMs: number): void {
    this.simTimeMs += dtMs;
    for (const elevator of this.elevators) {
      elevator.tick(dtMs);
    }
  }

  getSnapshot(): SystemSnapshot {
    return {
      config: {
        floors: this.config.floors,
        elevatorCount: this.config.elevatorCount,
        floorTravelMs: this.config.floorTravelMs,
        doorTransitionMs: this.config.doorTransitionMs,
        doorDwellMs: this.config.doorDwellMs,
      },
      simTimeMs: this.simTimeMs,
      strategy: this.strategy.name,
      elevators: this.elevators.map((e) => e.toSnapshot()),
      hallCalls: this.buildHallCallDtos(),
      metrics: {
        servedHallCalls: this.metrics.servedHallCalls,
        avgWaitMs: this.metrics.avgWaitMs,
        maxWaitMs: this.metrics.maxWaitMs,
      },
    };
  }

  getRecentLogs(): LogEntry[] {
    return this.eventLog.recent();
  }

  private getElevator(id: number): Elevator {
    const elevator = this.elevators.find((e) => e.id === id);
    if (!elevator) throw new DomainError(`unknown elevator ${id}`);
    return elevator;
  }

  private validateHallCall(floor: number, direction: Direction): void {
    if (floor < 1 || floor > this.config.floors) {
      throw new DomainError(`floor ${floor} is out of range`);
    }
    if (direction === 'down' && floor === 1) {
      throw new DomainError('there is no down call on the lowest floor');
    }
    if (direction === 'up' && floor === this.config.floors) {
      throw new DomainError('there is no up call on the top floor');
    }
  }

  private buildHallCallDtos(): HallCallDto[] {
    return [...this.hallCalls.values()]
      .map((call) => ({
        floor: call.floor,
        direction: call.direction,
        assignedTo: call.assignedTo,
        waitingMs: this.simTimeMs - call.createdAtMs,
      }))
      .sort((a, b) => {
        if (a.floor !== b.floor) return b.floor - a.floor;
        if (a.direction === b.direction) return 0;
        return a.direction === 'up' ? -1 : 1;
      });
  }

  private buildElevators(): void {
    const listener: ElevatorListener = {
      onStop: (elevatorId, floor, heading) => this.handleStop(elevatorId, floor, heading),
      onLog: (message) => this.log(message),
    };
    this.elevators = this.config.initialFloors.map(
      (floor, index) => new Elevator(index + 1, this.config, listener, floor),
    );
  }

  private handleStop(elevatorId: number, floor: number, heading: Heading): void {
    this.emit('stop', { elevatorId, floor, heading });
    this.log(`E${elevatorId} stopped at ${floor} ${symbol(heading)}`);
    if (heading === 'idle') return;

    const key = HallCall.keyOf(floor, heading);
    const call = this.hallCalls.get(key);
    if (!call) return;

    this.hallCalls.delete(key);
    if (call.assignedTo !== null && call.assignedTo !== elevatorId) {
      this.getElevator(call.assignedTo).unassignHallCall(floor, heading);
    }
    const waitMs = this.simTimeMs - call.createdAtMs;
    this.metrics.record(waitMs);
    this.emit('hallCallServed', { elevatorId, floor, direction: heading, waitMs });
    this.log(`${call.describe()} served by E${elevatorId} after ${waitMs}ms`);
  }

  private log(message: string): void {
    const entry = this.eventLog.add(this.simTimeMs, message);
    this.emit('log', entry);
  }
}
