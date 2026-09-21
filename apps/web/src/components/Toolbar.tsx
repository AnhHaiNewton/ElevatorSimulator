import type { SimSpeed, StrategyName } from '@elevator/shared';
import { SPEEDS, STRATEGIES } from '@elevator/shared';

import { formatSimTime } from '../format';

interface ToolbarProps {
  connected: boolean;
  simTimeMs: number;
  strategy: string;
  speed: SimSpeed;
  error: string | null;
  onStrategyChange: (strategy: StrategyName) => void;
  onSpeedChange: (speed: SimSpeed) => void;
  onReset: () => void;
}

const STRATEGY_LABELS: Record<StrategyName, string> = {
  eta: 'ETA-based',
  nearest: 'Nearest car',
};

function Toolbar({
  connected,
  simTimeMs,
  strategy,
  speed,
  error,
  onStrategyChange,
  onSpeedChange,
  onReset,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <h1>Elevator Simulator</h1>
      <span
        className={`connection-dot ${connected ? 'connected' : 'disconnected'}`}
        role="status"
        aria-label={connected ? 'Connected' : 'Disconnected'}
      />
      <span className="sim-time">{formatSimTime(simTimeMs)}</span>
      <label>
        Strategy
        <select value={strategy} onChange={(e) => onStrategyChange(e.target.value as StrategyName)}>
          {STRATEGIES.map((s) => (
            <option key={s} value={s}>
              {STRATEGY_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Speed
        <select value={speed} onChange={(e) => onSpeedChange(Number(e.target.value) as SimSpeed)}>
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={onReset}>
        Reset
      </button>
      {error && <span className="error">{error}</span>}
    </header>
  );
}

export default Toolbar;
