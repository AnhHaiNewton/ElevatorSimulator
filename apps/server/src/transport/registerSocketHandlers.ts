import type {
  AckResponse,
  ClientToServerEvents,
  ServerToClientEvents,
  StatePayload,
} from '@elevator/shared';
import {
  carCallSchema,
  doorCommandSchema,
  doorReleaseSchema,
  hallCallSchema,
  simConfigSchema,
} from '@elevator/shared';
import type { Server, Socket } from 'socket.io';
import type { z } from 'zod';

import { createStrategy } from '../domain/dispatch/createStrategy';
import { DomainError } from '../domain/DomainError';
import type { ElevatorSystem } from '../domain/ElevatorSystem';
import type { SimulationLoop } from '../engine/SimulationLoop';
import type { HoldTracker } from './HoldTracker';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type Ack = (res: AckResponse) => void;

export function registerSocketHandlers(
  io: IoServer,
  system: ElevatorSystem,
  loop: SimulationLoop,
  holds: HoldTracker,
): void {
  const buildState = (): StatePayload => ({ ...system.getSnapshot(), speed: loop.speed });

  const broadcastState = (): void => {
    io.emit('state', buildState());
  };

  function withValidation<T>(schema: z.ZodType<T>, action: (parsed: T) => void) {
    return (payload: unknown, ack: Ack): void => {
      const result = schema.safeParse(payload);
      if (!result.success) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: result.error.issues[0]?.message ?? 'Invalid input' });
        }
        return;
      }
      try {
        action(result.data);
      } catch (err) {
        if (typeof ack === 'function') {
          if (err instanceof DomainError) {
            ack({ ok: false, error: err.message });
          } else {
            console.error(err);
            ack({ ok: false, error: 'Internal error' });
          }
        }
        return;
      }
      if (typeof ack === 'function') ack({ ok: true });
      broadcastState();
    };
  }

  system.on('log', (entry) => io.emit('log', entry));

  io.on('connection', (socket: IoSocket) => {
    socket.emit('state', buildState());
    socket.emit('log:history', system.getRecentLogs());

    socket.on(
      'hall:call',
      withValidation(hallCallSchema, (p) => system.requestHallCall(p.floor, p.direction)),
    );

    socket.on(
      'car:call',
      withValidation(carCallSchema, (p) => system.requestCarCall(p.elevatorId, p.floor)),
    );

    socket.on(
      'door:open:press',
      withValidation(doorCommandSchema, (p) => {
        holds.press(socket.id, p.elevatorId);
        system.pressDoorOpen(p.elevatorId, p.floor);
      }),
    );

    socket.on(
      'door:open:release',
      withValidation(doorReleaseSchema, (p) => {
        holds.release(socket.id, p.elevatorId);
        system.releaseDoorOpen(p.elevatorId);
      }),
    );

    socket.on(
      'door:close',
      withValidation(doorCommandSchema, (p) => system.pressDoorClose(p.elevatorId, p.floor)),
    );

    socket.on(
      'sim:config',
      withValidation(simConfigSchema, (p) => {
        if (p.strategy) system.setStrategy(createStrategy(p.strategy, system.getConfig()));
        if (p.speed) loop.setSpeed(p.speed);
      }),
    );

    socket.on('sim:reset', (ack: Ack) => {
      system.reset();
      if (typeof ack === 'function') ack({ ok: true });
      io.emit('log:history', []);
      broadcastState();
    });

    socket.on('disconnect', () => {
      for (const elevatorId of holds.releaseAll(socket.id)) {
        system.releaseDoorOpen(elevatorId);
      }
    });
  });
}
