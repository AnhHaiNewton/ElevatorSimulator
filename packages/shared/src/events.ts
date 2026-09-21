import type { Direction, SimSpeed, StrategyName } from './constants';
import type { AckResponse, LogEntry, StatePayload } from './types';

type Ack = (res: AckResponse) => void;

export interface ClientToServerEvents {
  'hall:call': (p: { floor: number; direction: Direction }, ack: Ack) => void;
  'car:call': (p: { elevatorId: number; floor: number }, ack: Ack) => void;
  'door:open:press': (p: { elevatorId: number; floor: number }, ack: Ack) => void;
  'door:open:release': (p: { elevatorId: number }, ack: Ack) => void;
  'door:close': (p: { elevatorId: number; floor: number }, ack: Ack) => void;
  'sim:config': (p: { strategy?: StrategyName; speed?: SimSpeed }, ack: Ack) => void;
  'sim:reset': (ack: Ack) => void;
}

export interface ServerToClientEvents {
  state: (s: StatePayload) => void;
  log: (entry: LogEntry) => void;
  'log:history': (entries: LogEntry[]) => void;
}
