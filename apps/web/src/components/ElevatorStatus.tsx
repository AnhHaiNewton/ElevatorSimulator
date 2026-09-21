import type { ElevatorSnapshot } from '@elevator/shared';

import { headingSymbol } from '../format';

interface ElevatorStatusProps {
  elevator: ElevatorSnapshot;
}

function ElevatorStatus({ elevator }: ElevatorStatusProps) {
  const stops = [...elevator.carCalls].sort((a, b) => a - b);

  return (
    <header className="elevator-status">
      <span>E{elevator.id}</span>
      <span>Floor {elevator.floor}</span>
      <span>{headingSymbol(elevator.heading)}</span>
      <span>{elevator.state}</span>
      {elevator.doorHeld && <span className="held">Hold</span>}
      {stops.length > 0 && <span>Stops: {stops.join(', ')}</span>}
    </header>
  );
}

export default ElevatorStatus;
