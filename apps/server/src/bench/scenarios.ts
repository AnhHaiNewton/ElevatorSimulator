import { DEFAULT_CONFIG } from '@elevator/shared';

import { mulberry32 } from './prng';

export const SCENARIOS = ['up-peak', 'down-peak', 'inter-floor'] as const;
export type ScenarioName = (typeof SCENARIOS)[number];

export interface Passenger {
  id: number;
  arrivalMs: number;
  origin: number;
  destination: number;
}

const SEED = 42;
const DURATION_MS = 30 * 60 * 1000;
const MEAN_GAP_MS = 6000;

function randomInt(rand: () => number, minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(rand() * (maxInclusive - minInclusive + 1));
}

function uniformInterFloor(rand: () => number, floors: number): { origin: number; destination: number } {
  const origin = randomInt(rand, 1, floors);
  let destination = randomInt(rand, 1, floors);
  while (destination === origin) {
    destination = randomInt(rand, 1, floors);
  }
  return { origin, destination };
}

function sampleOriginDestination(
  scenario: ScenarioName,
  rand: () => number,
  floors: number,
): { origin: number; destination: number } {
  if (scenario === 'up-peak') {
    if (rand() < 0.8) return { origin: 1, destination: randomInt(rand, 2, floors) };
    return uniformInterFloor(rand, floors);
  }
  if (scenario === 'down-peak') {
    if (rand() < 0.8) return { origin: randomInt(rand, 2, floors), destination: 1 };
    return uniformInterFloor(rand, floors);
  }
  return uniformInterFloor(rand, floors);
}

/** A seeded Poisson arrival process (mean gap 6s) over 30 simulated minutes, per §7.1 of the bench spec. */
export function generatePassengers(scenario: ScenarioName, floors: number = DEFAULT_CONFIG.floors): Passenger[] {
  const rand = mulberry32(SEED);
  const passengers: Passenger[] = [];
  let time = 0;
  let id = 1;

  for (;;) {
    const gap = -Math.log(1 - rand()) * MEAN_GAP_MS;
    time += gap;
    if (time >= DURATION_MS) break;
    const { origin, destination } = sampleOriginDestination(scenario, rand, floors);
    passengers.push({ id, arrivalMs: Math.round(time), origin, destination });
    id += 1;
  }
  return passengers;
}
