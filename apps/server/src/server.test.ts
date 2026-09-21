import type { ClientToServerEvents, ServerToClientEvents, StatePayload } from '@elevator/shared';
import type { Socket } from 'socket.io-client';
import { io as ioClient } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { StartedServer } from './server';
import { startServer } from './server';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

describe('server', () => {
  let started: StartedServer;
  let client: ClientSocket | undefined;

  beforeEach(async () => {
    started = await startServer({ port: 0, autoStart: false });
  });

  afterEach(async () => {
    client?.disconnect();
    client = undefined;
    await started.close();
  });

  function connect(): Promise<{ socket: ClientSocket; initialState: StatePayload }> {
    return new Promise((resolve) => {
      const socket: ClientSocket = ioClient(`http://localhost:${started.port}`, {
        transports: ['websocket'],
      });
      socket.once('state', (initialState) => resolve({ socket, initialState }));
    });
  }

  it('sends the initial state with 3 elevators on connect', async () => {
    const { socket, initialState } = await connect();
    client = socket;
    expect(initialState.elevators).toHaveLength(3);
  });

  it('rejects a hall call that violates the domain rules', async () => {
    const { socket } = await connect();
    client = socket;
    const ack = await socket.emitWithAck('hall:call', { floor: 1, direction: 'down' });
    expect(ack.ok).toBe(false);
  });

  it('rejects a malformed payload', async () => {
    const { socket } = await connect();
    client = socket;
    const ack = await socket.emitWithAck('hall:call', { floor: 'x', direction: 'up' } as never);
    expect(ack.ok).toBe(false);
  });

  it('accepts a valid hall call and reflects it in /api/state', async () => {
    const { socket } = await connect();
    client = socket;
    const ack = await socket.emitWithAck('hall:call', { floor: 5, direction: 'up' });
    expect(ack.ok).toBe(true);

    const res = await fetch(`http://localhost:${started.port}/api/state`);
    const state = (await res.json()) as StatePayload;
    expect(state.hallCalls).toHaveLength(1);
  });

  it('updates the speed via sim:config', async () => {
    const { socket } = await connect();
    client = socket;

    const nextState = new Promise<StatePayload>((resolve) => {
      socket.once('state', resolve);
    });
    const ack = await socket.emitWithAck('sim:config', { speed: 5 });
    expect(ack.ok).toBe(true);

    const state = await nextState;
    expect(state.speed).toBe(5);
  });
});
