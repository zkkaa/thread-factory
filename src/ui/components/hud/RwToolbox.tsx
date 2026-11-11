import { useState } from 'react';
import type { RwPolicy } from '../../../engine/primitives/rwlock';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import {
  RW_POLICIES,
  RW_POLICY_LABEL,
  buildRwTool,
  findRwSetup,
  rwToolId,
} from '../../rwTool';
import { replaceTool } from '../../toolSpans';

interface RwToolboxProps {
  controller: SimulationController;
  state: ControllerState;
}

const BUTTON =
  'rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Toolbox Level 2-2: memasang pengaman papan (kunci pembaca/penulis) dan
 * memilih kebijakannya. Rentang pengaman ditentukan dari program level, jadi
 * tidak perlu seret-lepas. Terkunci setelah simulasi dimulai.
 */
export function RwToolbox({ controller, state }: RwToolboxProps) {
  const [picked, setPicked] = useState<RwPolicy | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const setup = state.level === null ? null : findRwSetup(state.level);
  if (setup === null) return null;

  const toolId = rwToolId(setup.lockId);
  const installed = state.tools.find((tool) => tool.id === toolId);
  const installedPolicy =
    installed?.kind === 'rwlock' ? (installed.policy ?? null) : null;
  const policy = installedPolicy ?? picked ?? setup.defaultPolicy;
  const editable = state.runState === 'idle';

  const apply = (next: RwPolicy): void => {
    setMessage(replaceTool(controller, toolId, buildRwTool(setup, next)));
  };
  const choose = (next: RwPolicy): void => {
    if (!editable) return;
    setPicked(next);
    if (installed !== undefined) apply(next);
  };

  return (
    <section
      aria-label="Toolbox Papan Pengumuman"
      className="space-y-2 rounded-lg border border-navy-500 bg-navy-800/90 p-2 text-ink-100"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-300">
          Pengaman Papan
        </span>
        <button
          type="button"
          disabled={!editable || installed !== undefined}
          onClick={() => apply(policy)}
          className={`${BUTTON} border-sun-400 bg-navy-700 hover:bg-navy-500`}
        >
          {installed === undefined ? 'Pasang Pengaman' : 'Terpasang'}
        </button>
        {RW_POLICIES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={policy === option}
            disabled={!editable}
            onClick={() => choose(option)}
            className={`${BUTTON} ${
              policy === option
                ? 'border-sun-500 bg-sun-500 text-navy-900'
                : 'border-navy-500 bg-navy-700 hover:bg-navy-500'
            }`}
          >
            {RW_POLICY_LABEL[option]}
          </button>
        ))}
        <button
          type="button"
          disabled={!editable || installed === undefined}
          onClick={() => setMessage(replaceTool(controller, toolId, null))}
          className={`${BUTTON} border-ember-500 hover:bg-navy-500`}
        >
          Hapus
        </button>
      </div>
      {!editable && (
        <p className="text-xs text-ink-300">
          Alat terkunci karena simulasi sudah dimulai. Tekan Reset untuk
          mengubahnya.
        </p>
      )}
      {message !== null && (
        <p role="alert" className="text-xs text-red-300">
          {message}
        </p>
      )}
    </section>
  );
}