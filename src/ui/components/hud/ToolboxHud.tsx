import { useState } from 'react';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import { toolBus } from '../../../game/toolBus';
import {
  buildSharedMutexTool,
  clickSlot,
  describeSlot,
  readSharedDoor,
  slotCount,
  type ClickState,
  type Door,
} from '../../doorSlots';
import { useDoorPlacement } from '../../hooks/useDoorPlacement';
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
 * ditambah Hapus. Pintu dipasang dengan menyeret chip ke slot di arena
 * (pintu masuk dahulu, lalu pintu keluar), atau lewat mode klik slot sebagai
 * alternatif (touchpad dan aksesibilitas). Berlaku untuk semua robot di loop
 * bersama. Terkunci setelah simulasi dimulai.
 */
export function ToolboxHud({ controller, state }: ToolboxHudProps) {
  const { level } = state;
  const mutex = level?.resources.find((resource) => resource.kind === 'mutex');
  const first = level?.threads[0];
  if (
    level === null ||
    mutex === undefined ||
    first === undefined ||
    !level.availableTools.includes('mutex')
  ) {
    return null;
  }
  return (
    <MutexToolbox
      controller={controller}
      state={state}
      mutexId={mutex.id}
      threadIds={level.threads.map((thread) => thread.id)}
      ops={first.program.map((instruction) => instruction.op)}
    />
  );
}

interface MutexToolboxProps extends ToolboxHudProps {
  mutexId: string;
  threadIds: readonly string[];
  ops: readonly string[];
}

function MutexToolbox({
  controller,
  state,
  mutexId,
  threadIds,
  ops,
}: MutexToolboxProps) {
  const [open, setOpen] = useState(false);
  const [click, setClick] = useState<ClickState>(IDLE);
  const [message, setMessage] = useState<string | null>(null);

  const total = slotCount(ops.length);
  const editable = state.runState === 'idle';
  const activeClick = editable ? click : IDLE;

  const toolId = mutexToolId(mutexId);
  const door = readSharedDoor(state.tools.find((tool) => tool.id === toolId));

  const apply = (next: Door | null): void => {
    const tool = buildSharedMutexTool(mutexId, threadIds, next);
    setMessage(replaceTool(controller, toolId, tool));
  };

  // Pintu lengkap dari seret-lepas di arena (lihat game/doorDrag.ts).
  const phase = useDoorPlacement((placed) => {
    setClick(IDLE);
    apply(placed);
  });

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

  // Label chip tidak berubah saat dragstart (Chrome membatalkan seret bila
  // DOM berubah di dragstart); baru berubah setelah pintu masuk dilepas.
  const dragLabel =
    phase.phase === 'holdingExit'
      ? `Seret pintu keluar (masuk di slot ${phase.entry})`
      : 'Seret pintu masuk';

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
        <span
          draggable={editable}
          title="Seret ke slot di jalan robot (atau pakai klik slot)"
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', 'pintu-mutex');
            event.dataTransfer.effectAllowed = 'copy';
            toolBus.emit('dragStart', { kind: 'mutex' });
          }}
          onDragEnd={() => toolBus.emit('dragEnd', null)}
          className={`${BUTTON} select-none border-sun-400 bg-navy-700 ${
            editable ? 'cursor-grab' : 'cursor-not-allowed opacity-50'
          }`}
        >
          {dragLabel}
        </span>
        {phase.phase === 'holdingExit' && (
          <button
            type="button"
            onClick={() => toolBus.emit('cancel', null)}
            className={`${BUTTON} border-navy-500 hover:bg-navy-500`}
          >
            Batal
          </button>
        )}
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
