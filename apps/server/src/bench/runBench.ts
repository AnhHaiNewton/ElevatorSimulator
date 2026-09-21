import type { Direction, StrategyName } from '@elevator/shared';
import { DEFAULT_CONFIG } from '@elevator/shared';

import { createStrategy } from '../domain/dispatch/createStrategy';
import { ElevatorSystem } from '../domain/ElevatorSystem';
import type { Passenger, ScenarioName } from './scenarios';
import { generatePassengers, SCENARIOS } from './scenarios';

const TICK_MS = 100;
const POST_ARRIVAL_CAP_MS = 10 * 60 * 1000;
const STRATEGIES: readonly StrategyName[] = ['nearest', 'eta'];

interface RidingPassenger extends Passenger {
  direction: Direction;
  boardedAtMs: number;
}

interface RideRecord {
  waitMs: number;
  rideMs: number;
}

interface RunResult {
  total: number;
  records: RideRecord[];
  undelivered: number;
}

function keyOf(floor: number, direction: Direction): string {
  return `${floor}:${direction}`;
}

function runOnce(scenario: ScenarioName, strategyName: StrategyName): RunResult {
  const config = DEFAULT_CONFIG;
  const system = new ElevatorSystem(config, createStrategy(strategyName, config));
  const passengers = generatePassengers(scenario, config.floors);

  const waiting = new Map<string, Passenger[]>();
  const onboard = new Map<number, RidingPassenger[]>();
  const carCallQueue: { elevatorId: number; floor: number }[] = [];
  const records: RideRecord[] = [];
  let simTimeMs = 0;

  system.on('hallCallServed', ({ elevatorId, floor, direction }) => {
    const list = waiting.get(keyOf(floor, direction)) ?? [];
    waiting.delete(keyOf(floor, direction));
    const riders = onboard.get(elevatorId) ?? [];
    for (const p of list) {
      riders.push({ ...p, direction, boardedAtMs: simTimeMs });
      carCallQueue.push({ elevatorId, floor: p.destination });
    }
    onboard.set(elevatorId, riders);
  });

  system.on('stop', ({ elevatorId, floor }) => {
    const riders = onboard.get(elevatorId) ?? [];
    const staying: RidingPassenger[] = [];
    for (const p of riders) {
      if (p.destination === floor) {
        records.push({ waitMs: p.boardedAtMs - p.arrivalMs, rideMs: simTimeMs - p.boardedAtMs });
      } else {
        staying.push(p);
      }
    }
    onboard.set(elevatorId, staying);
  });

  const lastArrivalMs = passengers.length > 0 ? passengers[passengers.length - 1]!.arrivalMs : 0;
  let nextArrivalIndex = 0;

  for (;;) {
    simTimeMs += TICK_MS;

    while (nextArrivalIndex < passengers.length && passengers[nextArrivalIndex]!.arrivalMs <= simTimeMs) {
      const p = passengers[nextArrivalIndex]!;
      const direction: Direction = p.destination > p.origin ? 'up' : 'down';
      const list = waiting.get(keyOf(p.origin, direction)) ?? [];
      list.push(p);
      waiting.set(keyOf(p.origin, direction), list);
      system.requestHallCall(p.origin, direction);
      nextArrivalIndex += 1;
    }

    system.tick(TICK_MS);

    for (const cmd of carCallQueue.splice(0)) {
      system.requestCarCall(cmd.elevatorId, cmd.floor);
    }

    const allArrived = nextArrivalIndex >= passengers.length;
    const allDelivered = records.length === passengers.length;
    if (allArrived && allDelivered) break;
    if (allArrived && simTimeMs - lastArrivalMs > POST_ARRIVAL_CAP_MS) break;
  }

  return { total: passengers.length, records, undelivered: passengers.length - records.length };
}

function percentile(valuesMs: number[], p: number): number {
  if (valuesMs.length === 0) return 0;
  const sorted = [...valuesMs].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index]!;
}

function average(valuesMs: number[]): number {
  if (valuesMs.length === 0) return 0;
  return valuesMs.reduce((sum, v) => sum + v, 0) / valuesMs.length;
}

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

interface ReportRow {
  scenario: ScenarioName;
  strategy: StrategyName;
  passengers: number;
  undelivered: number;
  'avg wait (s)': string;
  'p95 wait (s)': string;
  'max wait (s)': string;
  'avg ride (s)': string;
}

function runBenchmark(): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const scenario of SCENARIOS) {
    for (const strategy of STRATEGIES) {
      const { total, records, undelivered } = runOnce(scenario, strategy);
      const waits = records.map((r) => r.waitMs);
      const rides = records.map((r) => r.rideMs);
      rows.push({
        scenario,
        strategy,
        passengers: total,
        undelivered,
        'avg wait (s)': seconds(average(waits)),
        'p95 wait (s)': seconds(percentile(waits, 95)),
        'max wait (s)': seconds(waits.length > 0 ? Math.max(...waits) : 0),
        'avg ride (s)': seconds(average(rides)),
      });
    }
  }
  return rows;
}

console.table(runBenchmark());
