import type { Direction, ElevatorSnapshot, HallCallDto } from '@elevator/shared';

import CarDoor from './CarDoor';
import DoorButtons from './DoorButtons';
import HallButtons from './HallButtons';

interface FloorRowProps {
  floor: number;
  floors: number;
  elevator: ElevatorSnapshot;
  doorTransitionMs: number;
  speed: number;
  hallCalls: HallCallDto[];
  onHallCall: (floor: number, direction: Direction) => void;
  onSelectFloor: (elevatorId: number, floor: number) => void;
  onDoorOpenPress: (elevatorId: number, floor: number) => void;
  onDoorOpenRelease: (elevatorId: number) => void;
  onDoorClose: (elevatorId: number, floor: number) => void;
}

function FloorRow({
  floor,
  floors,
  elevator,
  doorTransitionMs,
  speed,
  hallCalls,
  onHallCall,
  onSelectFloor,
  onDoorOpenPress,
  onDoorOpenRelease,
  onDoorClose,
}: FloorRowProps) {
  const up = hallCalls.find((h) => h.floor === floor && h.direction === 'up');
  const down = hallCalls.find((h) => h.floor === floor && h.direction === 'down');
  const doorButtonsEnabled = elevator.floor === floor && elevator.state !== 'MOVING';

  return (
    <div className="floor-row">
      <HallButtons
        floor={floor}
        floors={floors}
        upPending={Boolean(up)}
        upMine={up?.assignedTo === elevator.id}
        downPending={Boolean(down)}
        downMine={down?.assignedTo === elevator.id}
        onCall={onHallCall}
      />
      <CarDoor
        floor={floor}
        elevator={elevator}
        doorTransitionMs={doorTransitionMs}
        speed={speed}
        onSelectFloor={onSelectFloor}
      />
      <DoorButtons
        elevatorId={elevator.id}
        floor={floor}
        enabled={doorButtonsEnabled}
        held={elevator.doorHeld}
        onDoorOpenPress={onDoorOpenPress}
        onDoorOpenRelease={onDoorOpenRelease}
        onDoorClose={onDoorClose}
      />
    </div>
  );
}

export default FloorRow;
