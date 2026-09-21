import type { Direction } from '@elevator/shared';

interface HallButtonsProps {
  floor: number;
  floors: number;
  upPending: boolean;
  upMine: boolean;
  downPending: boolean;
  downMine: boolean;
  onCall: (floor: number, direction: Direction) => void;
}

function HallButtons({ floor, floors, upPending, upMine, downPending, downMine, onCall }: HallButtonsProps) {
  return (
    <div className="hall-buttons">
      {floor < floors && (
        <button
          type="button"
          className={`hall-button${upPending ? ' lit' : ''}${upMine ? ' mine' : ''}`}
          aria-label={`Call up at floor ${floor}`}
          onClick={() => onCall(floor, 'up')}
        >
          ▲
        </button>
      )}
      {floor > 1 && (
        <button
          type="button"
          className={`hall-button${downPending ? ' lit' : ''}${downMine ? ' mine' : ''}`}
          aria-label={`Call down at floor ${floor}`}
          onClick={() => onCall(floor, 'down')}
        >
          ▼
        </button>
      )}
    </div>
  );
}

export default HallButtons;
