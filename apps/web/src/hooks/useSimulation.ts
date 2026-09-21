import type {
  AckResponse,
  ClientToServerEvents,
  Direction,
  LogEntry,
  ServerToClientEvents,
  SimSpeed,
  StatePayload,
  StrategyName,
} from '@elevator/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

const MAX_LOGS = 50;
const ERROR_CLEAR_MS = 3000;

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseSimulation {
  state: StatePayload | null;
  logs: LogEntry[];
  connected: boolean;
  error: string | null;
  callHall: (floor: number, direction: Direction) => void;
  selectFloor: (elevatorId: number, floor: number) => void;
  pressDoorOpen: (elevatorId: number, floor: number) => void;
  releaseDoorOpen: (elevatorId: number) => void;
  pressDoorClose: (elevatorId: number, floor: number) => void;
  setStrategy: (strategy: StrategyName) => void;
  setSpeed: (speed: SimSpeed) => void;
  reset: () => void;
}

export function useSimulation(): UseSimulation {
  const [state, setState] = useState<StatePayload | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<AppSocket | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), ERROR_CLEAR_MS);
  }, []);

  useEffect(() => {
    const socket: AppSocket = io();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('state', (payload) => setState(payload));
    socket.on('log', (entry) => setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS)));
    socket.on('log:history', (entries) => setLogs([...entries].reverse().slice(0, MAX_LOGS)));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const ack = useCallback(
    (res: AckResponse) => {
      if (!res.ok) showError(res.error);
    },
    [showError],
  );

  const callHall = useCallback(
    (floor: number, direction: Direction) => {
      socketRef.current?.emit('hall:call', { floor, direction }, ack);
    },
    [ack],
  );

  const selectFloor = useCallback(
    (elevatorId: number, floor: number) => {
      socketRef.current?.emit('car:call', { elevatorId, floor }, ack);
    },
    [ack],
  );

  const pressDoorOpen = useCallback(
    (elevatorId: number, floor: number) => {
      socketRef.current?.emit('door:open:press', { elevatorId, floor }, ack);
    },
    [ack],
  );

  const releaseDoorOpen = useCallback(
    (elevatorId: number) => {
      socketRef.current?.emit('door:open:release', { elevatorId }, ack);
    },
    [ack],
  );

  const pressDoorClose = useCallback(
    (elevatorId: number, floor: number) => {
      socketRef.current?.emit('door:close', { elevatorId, floor }, ack);
    },
    [ack],
  );

  const setStrategy = useCallback(
    (strategy: StrategyName) => {
      socketRef.current?.emit('sim:config', { strategy }, ack);
    },
    [ack],
  );

  const setSpeed = useCallback(
    (speed: SimSpeed) => {
      socketRef.current?.emit('sim:config', { speed }, ack);
    },
    [ack],
  );

  const reset = useCallback(() => {
    socketRef.current?.emit('sim:reset', ack);
  }, [ack]);

  return {
    state,
    logs,
    connected,
    error,
    callHall,
    selectFloor,
    pressDoorOpen,
    releaseDoorOpen,
    pressDoorClose,
    setStrategy,
    setSpeed,
    reset,
  };
}
