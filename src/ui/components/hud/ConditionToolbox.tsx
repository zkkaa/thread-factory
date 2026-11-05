import { useState } from 'react';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import {
  buildConditionTool,
  conditionToolId,
  findConditionSetup,
  readConditionSlot,
} from '../../conditionTool';
import { describeSlot, slotCount } from '../../doorSlots';
import { replaceTool } from '../../toolSpans';

interface ConditionToolboxProps {
  controller: SimulationController;
  state: ControllerState;
}

const BUTTON =
  'rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Toolbox Lampu Sinyal (condition variable, Level 1-4). Pengepak otomatis
 * menjadi penunggu (tidur, bukan busy waiting); pemain memilih slot di program
 * pemberi sinyal tempat lampu dinyalakan. Terkunci setelah simulasi dimulai.
 */
export function ConditionToolbox({ controller, state }: ConditionToolboxProps) {
  const [message, setMessage] = useState<string | null>(null);
  const { level } = state;
  const setup = level === null ? null : findConditionSetup(level);
  if (setup === null) return null;

  const editable = state.runState === 'idle';
  const toolId = conditionToolId(setup.condId);
  const slot = readConditionSlot(
    state.tools.find((tool) => tool.id === toolId),
  );
  const total = slotCount(setup.signalerOps.length);

  const apply = (next: number | null): void => {
    setMessage(
      replaceTool(controller, toolId, buildConditionTool(setup, next)),
    );
  };

  return (
    <section
      aria-label="Toolbox Lampu Sinyal"
      className="space-y-2 rounded-lg border border-sun-400 bg-navy-800/90 p-2 text-ink-100"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-sun-400">
          Lampu Sinyal (Condition Variable)
        </span>
        <span className="text-xs text-ink-300">
          {slot === null
            ? 'belum dipasang'
            : `lampu dinyalakan di slot ${slot}`}
        </span>
        <button
          type="button"
          disabled={!editable || slot === null}
          onClick={() => apply(null)}
          className={`${BUTTON} border-ember-500 hover:bg-navy-500`}
        >
          Hapus
        </button>
      </div>

      <p className="text-xs text-ink-300">
        Pengepak akan tidur sampai lampu menyala. Pilih slot di program Perakit
        tempat lampu dinyalakan.
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {Array.from({ length: total }, (_, index) => {
          const chosen = slot === index;
          return (
            <span key={index} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!editable}
                aria-label={`Slot ${index}, ${describeSlot(index, setup.signalerOps)}${
                  chosen ? ', lampu dinyalakan di sini' : ''
                }`}
                title={`Slot ${index}: ${describeSlot(index, setup.signalerOps)}`}
                onClick={() => apply(index)}
                className={`${BUTTON} ${
                  chosen
                    ? 'border-sun-500 bg-sun-500 text-navy-900'
                    : 'border-navy-500 bg-navy-700 hover:bg-navy-500'
                }`}
              >
                {index}
              </button>
              {index < setup.signalerOps.length && (
                <span className="rounded border border-navy-500 bg-navy-900 px-2 py-1 text-xs">
                  {setup.signalerOps[index]}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {!editable && (
        <p className="text-xs text-ink-300">
          Alat terkunci karena simulasi sudah dimulai. Tekan Reset untuk
          mengubah posisi lampu.
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
