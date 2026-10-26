import type { SimulationController } from '../../controller/SimulationController';
import { PhaserGame } from '../../PhaserGame';
import { ControlBar } from '../components/ControlBar';
import { MetricsPanel } from '../components/MetricsPanel';
import { ResultDialog } from '../components/ResultDialog';
import { StepLog } from '../components/StepLog';
import { Toolbox } from '../components/Toolbox';
import { useSimulation } from '../hooks/useSimulation';

interface PlayScreenProps {
  controller: SimulationController;
  /** Keluar ke Peta Level. Sementara; diganti Menu Jeda pada U-036. */
  onExit: () => void;
}

/** Tata letak sementara (panel kanan). Diganti HUD baru pada U-030 sampai U-064. */
export function PlayScreen({ controller, onExit }: PlayScreenProps) {
  const state = useSimulation(controller);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <PhaserGame controller={controller} />

      <aside className="h-screen w-[360px] shrink-0 space-y-5 overflow-y-auto border-l border-gray-700 p-4">
        <button
          type="button"
          onClick={onExit}
          className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600"
        >
          Peta Level
        </button>
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
