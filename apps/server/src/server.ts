import { createServer } from 'node:http';

import type { ClientToServerEvents, ServerToClientEvents, StatePayload } from '@elevator/shared';
import { DEFAULT_CONFIG } from '@elevator/shared';
import { Server } from 'socket.io';

import { createStrategy } from './domain/dispatch/createStrategy';
import { ElevatorSystem } from './domain/ElevatorSystem';
import { SimulationLoop } from './engine/SimulationLoop';
import { createHttpApp } from './transport/createHttpApp';
import { HoldTracker } from './transport/HoldTracker';
import { registerSocketHandlers } from './transport/registerSocketHandlers';

export interface StartServerOptions {
  port: number;
  autoStart?: boolean;
  webDist?: string;
}

export interface StartedServer {
  port: number;
  system: ElevatorSystem;
  loop: SimulationLoop;
  io: Server<ClientToServerEvents, ServerToClientEvents>;
  close: () => Promise<void>;
}

export function startServer(options: StartServerOptions): Promise<StartedServer> {
  const { port, autoStart = true, webDist } = options;

  const system = new ElevatorSystem(DEFAULT_CONFIG, createStrategy('eta', DEFAULT_CONFIG));
  const holds = new HoldTracker();

  function buildStatePayload(): StatePayload {
    return { ...system.getSnapshot(), speed: loop.speed };
  }

  const app = createHttpApp(buildStatePayload, webDist);
  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
  const loop = new SimulationLoop(system, DEFAULT_CONFIG.tickMs, () => {
    io.emit('state', buildStatePayload());
  });

  registerSocketHandlers(io, system, loop, holds);

  if (autoStart) loop.start();

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, () => {
      const address = httpServer.address();
      const actualPort = address && typeof address === 'object' ? address.port : port;
      resolve({
        port: actualPort,
        system,
        loop,
        io,
        close: () =>
          new Promise<void>((res) => {
            loop.stop();
            io.close(() => res());
          }),
      });
    });
  });
}
