import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import type { SandboxValues } from '../../../levels/sandbox';
import { isSandboxSupported } from '../../../levels/sandbox';
import { PhaserGame } from '../../../PhaserGame';
import { verdictText } from '../../comparePanel';
import { SandboxDrawer } from './SandboxDrawer';
import { ToolboxHud } from './ToolboxHud';

interface ComparePanelProps {
  label: 'A' | 'B';
  /** Id wadah Phaser; harus berbeda antar panel. */
  arenaId: string;
  controller: SimulationController;
  state: ControllerState;
  levelId: string;
  values: SandboxValues;
  error: string | null;
  onChange: (values: SandboxValues) => void;
  onReset: () => void;
  reduceMotion: boolean;
}

/** Satu sisi perbandingan: arena mini, parameter (bila ada), toolbox, dan hasil ringkas. */
export function ComparePanel({
  label,
  arenaId,
  controller,
  state,
  levelId,
  values,
  error,
  onChange,
  onReset,
  reduceMotion,
}: ComparePanelProps) {
  const finished = state.runState === 'finished';
  return (
    <section
      aria-label={`Panel ${label}`}
      className="space-y-2 rounded-xl border border-navy-500 bg-navy-800 p-2"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-sun-400">Panel {label}</h2>
        <span className="text-sm text-ink-300">
          Tick {state.snapshot?.tick ?? 0} ·{' '}
          {finished ? verdictText(state.result?.ok ?? null) : 'Belum selesai'}
        </span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-navy-900">
        <PhaserGame
          controller={controller}
          reduceMotion={reduceMotion}
          parentId={arenaId}
        />
      </div>

      {isSandboxSupported(levelId) && (
        <SandboxDrawer
          levelId={levelId}
          values={values}
          error={error}
          onChange={onChange}
          onReset={onReset}
        />
      )}
      {!isSandboxSupported(levelId) && error !== null && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}

      <ToolboxHud controller={controller} state={state} />
    </section>
  );
}
