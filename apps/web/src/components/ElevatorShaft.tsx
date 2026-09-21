import type { Direction, ElevatorSnapshot, HallCallDto } from '@elevator/shared';

import ElevatorStatus from './ElevatorStatus';
import FloorRow from './FloorRow';

interface ElevatorShaftProps {
  elevator: ElevatorSnapshot;
  floors: number;
  doorTransitionMs: number;
  speed: number;
  hallCalls: HallCallDto[];
  onHallCall: (floor: number, direction: Direction) => void;
  onSelectFloor: (elevatorId: number, floor: number) => void;
  onDoorOpenPress: (elevatorId: number, floor: number) => void;
  onDoorOpenRelease: (elevatorId: number) => void;
  onDoorClose: (elevatorId: number, floor: number) => void;
}

function ElevatorShaft({
  elevator,
  floors,
  doorTransitionMs,
  speed,
  hallCalls,
  onHallCall,
  onSelectFloor,
  onDoorOpenPress,
  onDoorOpenRelease,
  onDoorClose,
}: ElevatorShaftProps) {
  const floorList = Array.from({ length: floors }, (_, i) => floors - i);

  return (
    <section className="elevator-shaft" aria-label={`Elevator ${elevator.id}`}>
      <ElevatorStatus elevator={elevator} />
      {floorList.map((floor) => (
        <FloorRow
          key={floor}
          floor={floor}
          floors={floors}
          elevator={elevator}
          doorTransitionMs={doorTransitionMs}
          speed={speed}
          hallCalls={hallCalls}
          onHallCall={onHallCall}
          onSelectFloor={onSelectFloor}
          onDoorOpenPress={onDoorOpenPress}
          onDoorOpenRelease={onDoorOpenRelease}
          onDoorClose={onDoorClose}
        />
      ))}
    </section>
  );
}

export default ElevatorShaft;
