import { SimulationController } from './controller/SimulationController';
import { PhaserGame } from './PhaserGame';
import { level1_1 } from './levels/module1/level-1-1';
import { ControlBar } from './ui/components/ControlBar';
import { MetricsPanel } from './ui/components/MetricsPanel';
import { ResultDialog } from './ui/components/ResultDialog';
import { StepLog } from './ui/components/StepLog';
import { Toolbox } from './ui/components/Toolbox';
import { useSimulation } from './ui/hooks/useSimulation';

// Satu controller untuk seluruh aplikasi, dibuat di luar komponen supaya tidak
// ikut terbuat ulang saat React me-render (termasuk StrictMode).
// Level dipilih lewat LevelSelect pada T-062; sementara selalu Level 1-1.
const controller = new SimulationController();
controller.loadLevel(level1_1);

function App() {
  const state = useSimulation(controller);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <PhaserGame controller={controller} />

      <aside className="h-screen w-[360px] shrink-0 space-y-5 overflow-y-auto border-l border-gray-700 p-4">
        {state.level !== null && (
          <header className="space-y-2">
            <h1 className="text-lg font-bold">
              Level {state.level.id}: {state.level.title}
            </h1>
            <p className="rounded bg-gray-800 p-2 text-sm leading-relaxed">
              <strong>Pak Mandor:</strong>{' '}
              {state.level.intro.map((page) => page.text).join(' ')}
            </p>
          </header>
        )}
        <ControlBar controller={controller} state={state} />
        <Toolbox controller={controller} state={state} />
        <MetricsPanel state={state} />
        <StepLog controller={controller} />
      </aside>

      <ResultDialog controller={controller} state={state} />
    </div>
  );
}

export default App;
