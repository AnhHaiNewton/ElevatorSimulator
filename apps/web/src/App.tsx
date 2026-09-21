import './App.css';

import ElevatorBank from './components/ElevatorBank';
import EventLog from './components/EventLog';
import MetricsPanel from './components/MetricsPanel';
import Toolbar from './components/Toolbar';
import { useSimulation } from './hooks/useSimulation';

function App() {
  const sim = useSimulation();

  if (!sim.state) {
    return (
      <div className="app">
        <p className="connecting">Connecting…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Toolbar
        connected={sim.connected}
        simTimeMs={sim.state.simTimeMs}
        strategy={sim.state.strategy}
        speed={sim.state.speed}
        error={sim.error}
        onStrategyChange={sim.setStrategy}
        onSpeedChange={sim.setSpeed}
        onReset={sim.reset}
      />
      <main>
        <ElevatorBank
          snapshot={sim.state}
          speed={sim.state.speed}
          onHallCall={sim.callHall}
          onSelectFloor={sim.selectFloor}
          onDoorOpenPress={sim.pressDoorOpen}
          onDoorOpenRelease={sim.releaseDoorOpen}
          onDoorClose={sim.pressDoorClose}
        />
        <aside>
          <MetricsPanel metrics={sim.state.metrics} hallCalls={sim.state.hallCalls} />
          <EventLog logs={sim.logs} />
        </aside>
      </main>
    </div>
  );
}

export default App;
