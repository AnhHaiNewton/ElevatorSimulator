import type { LogEntry } from '@elevator/shared';

import { formatSimTime } from '../format';

interface EventLogProps {
  logs: LogEntry[];
}

function EventLog({ logs }: EventLogProps) {
  return (
    <section className="event-log" aria-label="Event log">
      <h2>Event log</h2>
      <ul>
        {logs.map((entry) => (
          <li key={entry.id}>
            [{formatSimTime(entry.simTimeMs)}] {entry.message}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default EventLog;
