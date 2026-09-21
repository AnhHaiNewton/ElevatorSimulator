import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface DoorButtonsProps {
  elevatorId: number;
  floor: number;
  enabled: boolean;
  held: boolean;
  onDoorOpenPress: (elevatorId: number, floor: number) => void;
  onDoorOpenRelease: (elevatorId: number) => void;
  onDoorClose: (elevatorId: number, floor: number) => void;
}

function DoorButtons({
  elevatorId,
  floor,
  enabled,
  held,
  onDoorOpenPress,
  onDoorOpenRelease,
  onDoorClose,
}: DoorButtonsProps) {
  const pressedRef = useRef(false);

  const startPress = (): void => {
    if (!enabled || pressedRef.current) return;
    pressedRef.current = true;
    onDoorOpenPress(elevatorId, floor);
  };

  const endPress = (): void => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    onDoorOpenRelease(elevatorId);
  };

  return (
    <div className="door-buttons">
      <button
        type="button"
        className="door-button close"
        disabled={!enabled}
        aria-label={`Elevator ${elevatorId}: close door at floor ${floor}`}
        onClick={() => onDoorClose(elevatorId, floor)}
      >
        ▶◀
      </button>
      <button
        type="button"
        className={`door-button open${held ? ' held' : ''}`}
        disabled={!enabled}
        aria-label={`Elevator ${elevatorId}: hold door open at floor ${floor}`}
        onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          startPress();
        }}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onLostPointerCapture={endPress}
        onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) startPress();
        }}
        onKeyUp={(e: KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === ' ' || e.key === 'Enter') endPress();
        }}
      >
        ◀▶
      </button>
    </div>
  );
}

export default DoorButtons;
