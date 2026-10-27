import type { SimulationController } from '../../controller/SimulationController';
import { PhaserGame } from '../../PhaserGame';
import { ControlHud } from '../components/hud/ControlHud';
import { PlayLayout } from '../components/hud/PlayLayout';
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

// Gaya panel HUD sementara; tiap komponen HUD final (U-031 sampai U-037)
// menggantikan panel yang bersangkutan.
const PANEL =
  'rounded-lg border border-navy-500 bg-navy-900/90 p-3 shadow-lg overflow-y-auto';

/**
 * Layar Arena (S5): kanvas Phaser memenuhi layar, komponen lama dipasang
 * sementara di slot HUD sampai penggantinya selesai (U-064 menghapus sisanya).
 */
export function PlayScreen({ controller, onExit }: PlayScreenProps) {
  const state = useSimulation(controller);

  return (
    <PlayLayout
      canvas={<PhaserGame controller={controller} />}
      topLeft={
        <div className={`${PANEL} w-80 space-y-2`}>
          <button
            type="button"
            onClick={onExit}
            className="rounded bg-navy-700 px-3 py-1 text-sm hover:bg-navy-500"
          >
            Peta Level
          </button>
          {state.level !== null && (
            <>
              <h1 className="text-base font-bold">
                Level {state.level.id}: {state.level.title}
              </h1>
              {/* Sementara; diganti chip Misi pada U-032. */}
              <details className="text-sm">
                <summary className="cursor-pointer">Misi</summary>
                <p className="mt-1 leading-relaxed">
                  {state.level.intro.map((page) => page.text).join(' ')}
                </p>
              </details>
            </>
          )}
        </div>
      }
      topRight={<ControlHud controller={controller} state={state} />}
      bottomLeft={
        <div className={`${PANEL} max-h-56 w-80`}>
          <StepLog controller={controller} />
        </div>
      }
      bottomCenter={
        <div className={`${PANEL} max-h-56 w-[420px]`}>
          <Toolbox controller={controller} state={state} />
        </div>
      }
      bottomRight={
        <div className={`${PANEL} max-h-56 w-72`}>
          <MetricsPanel state={state} />
        </div>
      }
      overlay={<ResultDialog controller={controller} state={state} />}
    />
  );
}
