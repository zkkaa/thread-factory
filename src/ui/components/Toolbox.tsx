import { useState } from 'react';
import type {
  ControllerState,
  SimulationController,
} from '../../controller/SimulationController';
import {
  buildMutexTool,
  findSpan,
  isCovered,
  mutexToolId,
  replaceTool,
} from '../toolSpans';

interface ToolboxProps {
  controller: SimulationController;
  state: ControllerState;
}

/** Ubin pertama yang diklik pemain; menunggu klik ubin akhir pada robot yang sama. */
interface Anchor {
  mutexId: string;
  threadId: string;
  index: number;
}

/**
 * Toolbox pemasangan mutex. Tiap robot digambar sebagai deretan ubin program
 * ASLI-nya. Pemain mengklik ubin awal lalu ubin akhir; rentang itu langsung
 * dipasang sebagai pintu mutex (klik ubin yang sama dua kali = satu ubin).
 * Alat hanya bisa diubah saat simulasi belum dimulai (idle).
 */
export function Toolbox({ controller, state }: ToolboxProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { level } = state;
  if (level === null || !level.availableTools.includes('mutex')) return null;

  const editable = state.runState === 'idle';
  const activeAnchor = editable ? anchor : null;
  const mutexes = level.resources.filter((resource) => resource.kind === 'mutex');

  const change = (
    mutexId: string,
    threadId: string,
    span: { thread: string; start: number; end: number } | null,
  ): void => {
    const toolId = mutexToolId(mutexId);
    const previous = controller.getState().tools.find((tool) => tool.id === toolId) ?? null;
    const next = buildMutexTool(previous, mutexId, threadId, span);
    setMessage(replaceTool(controller, toolId, next));
  };

  const clickTile = (mutexId: string, threadId: string, index: number): void => {
    if (!editable) return;
    if (
      activeAnchor === null ||
      activeAnchor.mutexId !== mutexId ||
      activeAnchor.threadId !== threadId
    ) {
      setAnchor({ mutexId, threadId, index });
      setMessage(null);
      return;
    }
    setAnchor(null);
    change(mutexId, threadId, {
      thread: threadId,
      start: Math.min(activeAnchor.index, index),
      end: Math.max(activeAnchor.index, index),
    });
  };

  return (
    <section aria-label="Toolbox" className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-300">Toolbox: Pintu Mutex</h2>

      {mutexes.map((mutex) => {
        const tool = state.tools.find((t) => t.id === mutexToolId(mutex.id));
        return (
          <div key={mutex.id} className="space-y-2 rounded border border-gray-700 p-2">
            <p className="text-sm font-semibold">{mutex.label ?? mutex.id}</p>

            {level.threads.map((thread) => {
              const span = findSpan(tool, thread.id);
              return (
                <div key={thread.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">{thread.label}</span>
                    {span !== undefined && editable && (
                      <button
                        type="button"
                        onClick={() => change(mutex.id, thread.id, null)}
                        className="text-xs text-red-300 underline"
                      >
                        Lepas pintu
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {thread.program.map((instruction, index) => {
                      const covered = isCovered(span, index);
                      const isAnchor =
                        activeAnchor !== null &&
                        activeAnchor.mutexId === mutex.id &&
                        activeAnchor.threadId === thread.id &&
                        activeAnchor.index === index;
                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={!editable}
                          aria-pressed={covered}
                          aria-label={`${thread.label}, ubin ${index + 1}, ${instruction.op}${
                            covered ? ', tertutup pintu mutex' : ''
                          }${isAnchor ? ', ubin awal terpilih' : ''}`}
                          onClick={() => clickTile(mutex.id, thread.id, index)}
                          className={`rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60 ${
                            covered
                              ? 'border-emerald-300 bg-emerald-800'
                              : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                          } ${isAnchor ? 'ring-2 ring-yellow-300' : ''}`}
                        >
                          <span className="block text-[10px] text-gray-400">{index + 1}</span>
                          {instruction.op}
                          {covered && <span aria-hidden="true"> 🔒</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {activeAnchor !== null && (
        <p className="text-xs text-yellow-200">
          Ubin awal dipilih. Klik ubin akhir pada robot yang sama (klik ubin yang sama untuk satu
          ubin saja).{' '}
          <button type="button" onClick={() => setAnchor(null)} className="underline">
            Batal
          </button>
        </p>
      )}
      {!editable && (
        <p className="text-xs text-gray-400">
          Alat terkunci karena simulasi sudah dimulai. Tekan Reset untuk mengubah pintu.
        </p>
      )}
      {editable && activeAnchor === null && state.tools.length === 0 && (
        <p className="text-xs text-gray-400">
          Pilih ubin awal dan akhir pada tiap robot untuk memasang pintu di sekelilingnya.
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
