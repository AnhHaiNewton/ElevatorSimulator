import { describe, expect, it } from 'vitest';

import { carCallSchema, hallCallSchema, simConfigSchema } from './schemas';

describe('hallCallSchema', () => {
  it.each([
    [5, 'up'],
    [1, 'up'],
    [10, 'down'],
  ] as const)('accepts (%d, %s)', (floor, direction) => {
    expect(hallCallSchema.safeParse({ floor, direction }).success).toBe(true);
  });

  it.each([
    [1, 'down'],
    [10, 'up'],
    [0, 'up'],
    [11, 'down'],
    [5, 'left'],
    [2.5, 'up'],
  ] as const)('rejects (%s, %s)', (floor, direction) => {
    expect(hallCallSchema.safeParse({ floor, direction }).success).toBe(false);
  });
});

describe('carCallSchema', () => {
  it('rejects elevatorId 4', () => {
    expect(carCallSchema.safeParse({ elevatorId: 4, floor: 5 }).success).toBe(false);
  });

  it('accepts a valid elevatorId', () => {
    expect(carCallSchema.safeParse({ elevatorId: 2, floor: 5 }).success).toBe(true);
  });
});

describe('simConfigSchema', () => {
  it('rejects speed 3', () => {
    expect(simConfigSchema.safeParse({ speed: 3 }).success).toBe(false);
  });

  it('accepts a valid speed', () => {
    expect(simConfigSchema.safeParse({ speed: 2 }).success).toBe(true);
  });
});
