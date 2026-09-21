import type { ElevatorSnapshot, HallCallDto } from '@elevator/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ElevatorShaft from './ElevatorShaft';

const noop = vi.fn();

function makeElevator(overrides: Partial<ElevatorSnapshot> = {}): ElevatorSnapshot {
  return {
    id: 1,
    floor: 1,
    heading: 'idle',
    state: 'IDLE',
    doorHeld: false,
    carCalls: [],
    assignedHallCalls: [],
    ...overrides,
  };
}

function renderShaft(elevator: ElevatorSnapshot, hallCalls: HallCallDto[] = []) {
  return render(
    <ElevatorShaft
      elevator={elevator}
      floors={10}
      doorTransitionMs={1000}
      speed={1}
      hallCalls={hallCalls}
      onHallCall={noop}
      onSelectFloor={noop}
      onDoorOpenPress={noop}
      onDoorOpenRelease={noop}
      onDoorClose={noop}
    />,
  );
}

describe('ElevatorShaft', () => {
  it('shows only an up button on floor 1 and only a down button on the top floor', () => {
    renderShaft(makeElevator());

    expect(screen.getByLabelText('Call up at floor 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Call down at floor 1')).not.toBeInTheDocument();

    expect(screen.getByLabelText('Call down at floor 10')).toBeInTheDocument();
    expect(screen.queryByLabelText('Call up at floor 10')).not.toBeInTheDocument();
  });

  it('disables the door buttons on every floor except the elevator’s own', () => {
    renderShaft(makeElevator({ floor: 3, state: 'DOOR_OPEN' }));

    expect(screen.getByLabelText('Elevator 1: hold door open at floor 3')).toBeEnabled();
    expect(screen.getByLabelText('Elevator 1: close door at floor 3')).toBeEnabled();
    expect(screen.getByLabelText('Elevator 1: hold door open at floor 5')).toBeDisabled();
    expect(screen.getByLabelText('Elevator 1: close door at floor 5')).toBeDisabled();
  });

  it('disables car-door buttons while idle and enables them (except the current floor) while boarding', () => {
    const { rerender } = renderShaft(makeElevator({ floor: 3, state: 'IDLE' }));
    expect(screen.getByLabelText('Elevator 1: go to floor 7')).toBeDisabled();

    rerender(
      <ElevatorShaft
        elevator={makeElevator({ floor: 3, state: 'DOOR_OPEN' })}
        floors={10}
        doorTransitionMs={1000}
        speed={1}
        hallCalls={[]}
        onHallCall={noop}
        onSelectFloor={noop}
        onDoorOpenPress={noop}
        onDoorOpenRelease={noop}
        onDoorClose={noop}
      />,
    );

    expect(screen.getByLabelText('Elevator 1: go to floor 7')).toBeEnabled();
    expect(screen.getByLabelText('Elevator 1: go to floor 3')).toBeDisabled(); // current floor is a no-op
  });

  it('renders a pending hall call with the lit class', () => {
    const hallCalls: HallCallDto[] = [{ floor: 5, direction: 'up', assignedTo: 1, waitingMs: 1200 }];
    renderShaft(makeElevator(), hallCalls);

    expect(screen.getByLabelText('Call up at floor 5')).toHaveClass('lit');
    expect(screen.getByLabelText('Call down at floor 5')).not.toHaveClass('lit');
  });
});
