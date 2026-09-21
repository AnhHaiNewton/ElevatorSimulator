import type { Direction, SystemSnapshot } from '@elevator/shared';

import ElevatorShaft from './ElevatorShaft';

interface ElevatorBankProps {
  snapshot: SystemSnapshot;
  speed: number;
  onHallCall: (floor: number, direction: Direction) => void;
  onSelectFloor: (elevatorId: number, floor: number) => void;
  onDoorOpenPress: (elevatorId: number, floor: number) => void;
  onDoorOpenRelease: (elevatorId: number) => void;
  onDoorClose: (elevatorId: number, floor: number) => void;
}

function ElevatorBank({
  snapshot,
  speed,
  onHallCall,
  onSelectFloor,
  onDoorOpenPress,
  onDoorOpenRelease,
  onDoorClose,
}: ElevatorBankProps) {
  return (
    <div className="elevator-bank">
      {snapshot.elevators.map((elevator) => (
        <ElevatorShaft
          key={elevator.id}
          elevator={elevator}
          floors={snapshot.config.floors}
          doorTransitionMs={snapshot.config.doorTransitionMs}
          speed={speed}
          hallCalls={snapshot.hallCalls}
          onHallCall={onHallCall}
          onSelectFloor={onSelectFloor}
          onDoorOpenPress={onDoorOpenPress}
          onDoorOpenRelease={onDoorOpenRelease}
          onDoorClose={onDoorClose}
        />
      ))}
    </div>
  );
}

export default ElevatorBank;
