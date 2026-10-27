import { useState } from 'react';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import {
  buildSharedMutexTool,
  clickSlot,
  describeSlot,
  readSharedDoor,
  slotCount,
  type ClickState,
  type Door,
} from '../../doorSlots';
import { mutexToolId, replaceTool } from '../../toolSpans';

interface ToolboxHudProps {
  controller: SimulationController;
  state: ControllerState;
}

const IDLE: ClickState = { phase: 'idle' };

const BUTTON =
  'rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Toolbox bawah (PRD 17.2). Menampilkan hanya alat yang tersedia di level
 * ditambah Hapus. Pemasangan lewat mode klik slot: pintu masuk, lalu pintu
 * keluar; berlaku untuk semua robot di loop bersama. Terkunci setelah
 * simulasi dimulai. Seret-lepas ke arena menyusul di U-061.
 */
export function ToolboxHud({ controller, state }: ToolboxHudProps) {
  const [open, setOpen] = useState(false);
  const [click, setClick] = useState<ClickState>(IDLE);
  const [message, setMessage] = useState<string | null>(null);

  const { level } = state;
  const mutex = level?.resources.find((resource) => resource.kind === 'mutex');
  if (
    level === null ||
    mutex === undefined ||
    !level.availableTools.includes('mutex')
  ) {
    return null;
  }
  const first = level.threads[0];
  if (first === undefined) return null;

  const ops = first.program.map((instruction) => instruction.op);
  const threadIds = level.threads.map((thread) => thread.id);
  const total = slotCount(ops.length);
  const editable = state.runState === 'idle';
  const activeClick = editable ? click : IDLE;

  const toolId = mutexToolId(mutex.id);
  const door = readSharedDoor(state.tools.find((tool) => tool.id === toolId));

  const apply = (next: Door | null): void => {
    const tool = buildSharedMutexTool(mutex.id, threadIds, next);
    setMessage(replaceTool(controller, toolId, tool));
  };

  const handleSlot = (slot: number): void => {
    if (!editable) return;
    const result = clickSlot(activeClick, slot, total);
    setClick(result.state);
    if (result.door !== null) apply(result.door);
    else setMessage(null);
  };

  const status =
    door === null
      ? 'belum dipasang'
      : `masuk slot ${door.entry}, keluar slot ${door.exit}`;

  return (
    <section
      aria-label="Toolbox"
      className="space-y-2 rounded-lg border border-navy-500 bg-navy-800/90 p-2 text-ink-100"
    >
      {open && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: total }, (_, slot) => {
              const isEntry =
                activeClick.phase === 'entry' && activeClick.entry === slot;
              const isDoor =
                door !== null && (slot === door.entry || slot === door.exit);
              const blocked =
                !editable ||
                (activeClick.phase === 'idle' && slot === total - 1);
              return (
                <span key={slot} className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={blocked}
                    aria-label={`Slot ${slot}, ${describeSlot(slot, ops)}${
                      isDoor ? ', ada pintu' : ''
                    }${isEntry ? ', pintu masuk dipilih' : ''}`}
                    title={`Slot ${slot}: ${describeSlot(slot, ops)}`}
                    onClick={() => handleSlot(slot)}
                    className={`${BUTTON} ${
                      isEntry
                        ? 'border-sun-400 ring-2 ring-sun-400'
                        : isDoor
                          ? 'border-sun-500 bg-sun-500 text-navy-900'
                          : 'border-navy-500 bg-navy-700 hover:bg-navy-500'
                    }`}
                  >
                    {slot}
                  </button>
                  {slot < ops.length && (
                    <span
                      className={`rounded border px-2 py-1 text-xs ${
                        door !== null && slot >= door.entry && slot < door.exit
                          ? 'border-sun-500 bg-navy-500'
                          : 'border-navy-500 bg-navy-900'
                      }`}
                    >
                      {ops[slot]}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-ink-300">
            {activeClick.phase === 'idle'
              ? 'Klik slot untuk memasang pintu masuk.'
              : `Pintu masuk di slot ${activeClick.entry}. Klik slot sesudahnya untuk pintu keluar.`}{' '}
            {activeClick.phase === 'entry' && (
              <button
                type="button"
                onClick={() => setClick(IDLE)}
                className="underline"
              >
                Batal
              </button>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-300">
          Toolbox
        </span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={`${BUTTON} border-sun-400 bg-navy-700 hover:bg-navy-500`}
        >
          Pintu Mutex ({status})
        </button>
        <button
          type="button"
          disabled={!editable || door === null}
          onClick={() => {
            setClick(IDLE);
            apply(null);
          }}
          className={`${BUTTON} border-ember-500 hover:bg-navy-500`}
        >
          Hapus
        </button>
      </div>

      {!editable && (
        <p className="text-xs text-ink-300">
          Alat terkunci karena simulasi sudah dimulai. Tekan Reset untuk
          mengubah pintu.
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
