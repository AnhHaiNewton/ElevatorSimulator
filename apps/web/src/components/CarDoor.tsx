import type { ElevatorSnapshot } from '@elevator/shared';
import { BOARDING_STATES } from '@elevator/shared';

interface CarDoorProps {
  floor: number;
  elevator: ElevatorSnapshot;
  doorTransitionMs: number;
  speed: number;
  onSelectFloor: (elevatorId: number, floor: number) => void;
}

function CarDoor({ floor, elevator, doorTransitionMs, speed, onSelectFloor }: CarDoorProps) {
  const isCurrent = elevator.floor === floor;
  const isBoarding = BOARDING_STATES.includes(elevator.state);
  const isOpen = isCurrent && (elevator.state === 'DOOR_OPENING' || elevator.state === 'DOOR_OPEN');
  const isSelected = elevator.carCalls.includes(floor);
  const disabled = !isBoarding || floor === elevator.floor;
  const transitionMs = doorTransitionMs / speed;

  return (
    <button
      type="button"
      className={[
        'car-door',
        isCurrent && 'current',
        isOpen && 'open',
        isSelected && 'selected',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--door-transition-ms' as string]: `${transitionMs}ms` }}
      disabled={disabled}
      aria-label={`Elevator ${elevator.id}: go to floor ${floor}`}
      onClick={() => onSelectFloor(elevator.id, floor)}
    >
      <span className="car-door-panel left" />
      <span className="car-door-panel right" />
      <span className="car-door-number">{floor}</span>
    </button>
  );
}

export default CarDoor;
