import { useState } from 'react';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import {
  beltToolId,
  buildBeltTool,
  findBeltSetup,
  isBeltGuardPlaced,
  type BeltGuard,
} from '../../beltTool';
import { replaceTool } from '../../toolSpans';

interface BeltToolboxProps {
  controller: SimulationController;
  state: ControllerState;
}

const BUTTON =
  'rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50';

const GUARDS: { guard: BeltGuard; title: string; hint: string }[] = [
  {
    guard: 'slot',
    title: 'Penjaga Slot (Perakit)',
    hint: 'Perakit menunggu Slot Kosong sebelum menaruh barang, lalu memberi tanda Barang Tersedia.',
  },
  {
    guard: 'item',
    title: 'Penjaga Barang (Pengepak)',
    hint: 'Pengepak menunggu Barang Tersedia sebelum mengambil, lalu memberi tanda Slot Kosong.',
  },
];

/**
 * Toolbox ban berjalan (Level 2-1): dua penjaga semaphore yang dinyalakan
 * atau dimatikan. Tiap penjaga berlaku untuk semua robot yang sesuai.
 * Terkunci setelah simulasi dimulai.
 */
export function BeltToolbox({ controller, state }: BeltToolboxProps) {
  const [message, setMessage] = useState<string | null>(null);
  const { level } = state;
  const setup = level === null ? null : findBeltSetup(level);
  if (setup === null) return null;

  const editable = state.runState === 'idle';

  const toggle = (guard: BeltGuard): void => {
    const placed = isBeltGuardPlaced(state.tools, guard);
    setMessage(
      replaceTool(
        controller,
        beltToolId(guard),
        placed ? null : buildBeltTool(setup, guard),
      ),
    );
  };

  return (
    <section
      aria-label="Toolbox Penjaga Ban"
      className="space-y-2 rounded-lg border border-sun-400 bg-navy-800/90 p-2 text-ink-100"
    >
      <span className="text-xs font-bold uppercase tracking-wide text-sun-400">
        Penjaga Ban (Semaphore)
      </span>

      <div className="flex flex-wrap gap-2">
        {GUARDS.map(({ guard, title, hint }) => {
          const placed = isBeltGuardPlaced(state.tools, guard);
          return (
            <button
              key={guard}
              type="button"
              disabled={!editable}
              aria-pressed={placed}
              title={hint}
              onClick={() => toggle(guard)}
              className={`${BUTTON} ${
                placed
                  ? 'border-sun-500 bg-sun-500 text-navy-900'
                  : 'border-navy-500 bg-navy-700 hover:bg-navy-500'
              }`}
            >
              {title}: {placed ? 'terpasang' : 'belum dipasang'}
            </button>
          );
        })}
      </div>

      {!editable && (
        <p className="text-xs text-ink-300">
          Alat terkunci karena simulasi sudah dimulai. Tekan Reset untuk
          mengubah penjaga.
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
