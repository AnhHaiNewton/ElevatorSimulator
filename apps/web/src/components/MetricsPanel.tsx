import type { HallCallDto, MetricsDto } from '@elevator/shared';

import { formatSeconds } from '../format';

interface MetricsPanelProps {
  metrics: MetricsDto;
  hallCalls: HallCallDto[];
}

function MetricsPanel({ metrics, hallCalls }: MetricsPanelProps) {
  return (
    <section className="metrics-panel" aria-label="Metrics">
      <h2>Metrics</h2>
      <dl>
        <dt>Served</dt>
        <dd>{metrics.servedHallCalls}</dd>
        <dt>Avg wait</dt>
        <dd>{formatSeconds(metrics.avgWaitMs)}s</dd>
        <dt>Max wait</dt>
        <dd>{formatSeconds(metrics.maxWaitMs)}s</dd>
      </dl>
      <h3>Pending hall calls</h3>
      <ul>
        {hallCalls.length === 0 && <li className="empty">None</li>}
        {hallCalls.map((h) => (
          <li key={`${h.floor}-${h.direction}`}>
            {h.floor}
            {h.direction === 'up' ? '▲' : '▼'} → {h.assignedTo === null ? '—' : `E${h.assignedTo}`} · waiting{' '}
            {formatSeconds(h.waitingMs)}s
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MetricsPanel;
