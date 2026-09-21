# Elevator Simulator

A web-based simulator for 3 elevators serving 10 floors. The backend owns one shared, authoritative
simulation; every connected browser tab sees the same state.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (Vite dev server, proxies API/WS to :3001)
```

Production build:

```bash
npm run build
npm start          # http://localhost:3001 (Express serves the built UI and the API)
```

## How to use

| Control | Behavior |
|---|---|
| ▲ / ▼ hall buttons (each floor, each column) | Calls the nearest/cheapest elevator to that floor. The button lights up in **all three** columns (the call is shared, not per-column); the assigned elevator's column also gets an outline ring. Floor 1 has no ▼, floor 10 has no ▲. |
| Floor number boxes inside a column | Choose a destination once that elevator's doors are open (or opening/closing) — i.e. while it's *boarding*. Clicking the elevator's own current floor is a no-op. Selected floors turn green with a ✓. |
| ▶◀ (close) | Click to close the doors immediately. |
| ◀▶ (open) | **Press and hold** to keep the doors open; release to let them close after the normal dwell time. Auto-releases after 20s so a stuck button can't wedge the car open forever. |
| Red-bordered floor box | Shows which floor that elevator is currently at. |
| Strategy / Speed selectors | Swap the live dispatch strategy (ETA-based vs. nearest-car) or the simulation speed (1×/2×/5×) without resetting. |
| Reset button | Clears all elevators, calls and metrics back to the starting state. |
