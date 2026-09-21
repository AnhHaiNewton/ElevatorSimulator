import { z } from 'zod';

import { DEFAULT_CONFIG } from './config';
import { DIRECTIONS, STRATEGIES } from './constants';

const { floors, elevatorCount } = DEFAULT_CONFIG;

export const floorSchema = z.number().int().min(1).max(floors);
export const elevatorIdSchema = z.number().int().min(1).max(elevatorCount);
export const directionSchema = z.enum(DIRECTIONS);

export const hallCallSchema = z
  .object({ floor: floorSchema, direction: directionSchema })
  .refine(
    (v) => !((v.direction === 'down' && v.floor === 1) || (v.direction === 'up' && v.floor === floors)),
    { message: 'That button does not exist on this floor' },
  );

export const carCallSchema = z.object({ elevatorId: elevatorIdSchema, floor: floorSchema });

export const doorCommandSchema = z.object({ elevatorId: elevatorIdSchema, floor: floorSchema });

export const doorReleaseSchema = z.object({ elevatorId: elevatorIdSchema });

export const simConfigSchema = z.object({
  strategy: z.enum(STRATEGIES).optional(),
  speed: z.union([z.literal(1), z.literal(2), z.literal(5)]).optional(),
});
