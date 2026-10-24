import { useState } from 'react';
import type { SimulationController } from '../../controller/SimulationController';
import type { LogEntry, LogKind } from '../eventLog';
import { useEventLog } from '../hooks/useEventLog';

/** Jumlah baris maksimum yang digambar; riwayat lebih lama tetap tersimpan di EventLog. */
const MAX_SHOWN = 100;

/** Ikon dan warna garis tiap jenis kejadian. Teksnya sendiri sudah menjelaskan artinya. */
const KIND_STYLE: Record<LogKind, { icon: string; border: string }> = {
  state: { icon: '↔', border: 'border-gray-500' },
  instruction: { icon: '▶', border: 'border-sky-500' },
  write: { icon: '✎', border: 'border-amber-500' },
  lock: { icon: '🔒', border: 'border-emerald-500' },
  unlock: { icon: '🔓', border: 'border-emerald-500' },
  blocked: { icon: '⏳', border: 'border-red-500' },
  deadlock: { icon: '⚠', border: 'border-red-500' },
  finished: { icon: '🏁', border: 'border-indigo-400' },
};

/** Tampilan log (tanpa langganan ke controller, sehingga mudah dites). */
export function StepLogView({ entries }: { entries: readonly LogEntry[] }) {
  const [showMinor, setShowMinor] = useState(false);

  const shown = entries
    .filter((entry) => showMinor || !entry.minor)
    .slice(-MAX_SHOWN)
    .reverse(); // terbaru di atas

  return (
    <section aria-label="Log kejadian" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-300">Log Kejadian</h2>
        <label className="flex items-center gap-1 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={showMinor}
            onChange={(event) => setShowMinor(event.target.checked)}
          />
          Tampilkan perpindahan READY/RUNNING
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="text-xs text-gray-400">Belum ada kejadian. Tekan Run atau Step.</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">Terbaru di atas.</p>
          <ol className="max-h-64 space-y-1 overflow-y-auto rounded bg-gray-800 p-2">
            {shown.map((entry) => (
              <li
                key={entry.id}
                className={`flex gap-2 border-l-2 pl-2 text-xs ${KIND_STYLE[entry.kind].border}`}
              >
                <span className="w-9 shrink-0 text-gray-500">t{entry.tick}</span>
                <span aria-hidden="true">{KIND_STYLE[entry.kind].icon}</span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

/** Log kejadian yang terhubung ke controller. */
export function StepLog({ controller }: { controller: SimulationController }) {
  const entries = useEventLog(controller);
  return <StepLogView entries={entries} />;
}