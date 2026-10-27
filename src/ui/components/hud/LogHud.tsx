import { useState } from 'react';
import type { SimulationController } from '../../../controller/SimulationController';
import type { LogEntry, LogKind } from '../../eventLog';
import { useEventLog } from '../../hooks/useEventLog';

/** Jumlah baris maksimum yang digambar; riwayat lama tetap ada di EventLog. */
const MAX_SHOWN = 100;

/** Ikon dan warna garis tiap jenis kejadian (teks sudah menjelaskan artinya). */
const KIND_STYLE: Record<LogKind, { icon: string; border: string }> = {
  state: { icon: '↔', border: 'border-ink-300' },
  instruction: { icon: '▶', border: 'border-sky-500' },
  write: { icon: '✎', border: 'border-sun-500' },
  lock: { icon: '🔒', border: 'border-emerald-500' },
  unlock: { icon: '🔓', border: 'border-emerald-500' },
  blocked: { icon: '⏳', border: 'border-ember-500' },
  deadlock: { icon: '⚠', border: 'border-ember-500' },
  finished: { icon: '🏁', border: 'border-indigo-400' },
};

/**
 * Tampilan Log Kejadian (PRD 17.2): dapat dilipat, terbaru di atas,
 * perpindahan READY/RUNNING disembunyikan secara default.
 * Tanpa langganan ke controller supaya mudah dites.
 */
export function LogHudView({ entries }: { entries: readonly LogEntry[] }) {
  const [showMinor, setShowMinor] = useState(false);

  const shown = entries
    .filter((entry) => showMinor || !entry.minor)
    .slice(-MAX_SHOWN)
    .reverse();

  return (
    <details
      open
      className="group w-80 rounded-lg border border-navy-500 bg-navy-800/90 p-2 text-ink-100"
    >
      <summary className="flex cursor-pointer items-center justify-between text-sm font-bold">
        <span>Log Kejadian</span>
        <span className="text-xs font-normal text-ink-300">
          <span className="group-open:hidden">Buka</span>
          <span className="hidden group-open:inline">Lipat</span>
        </span>
      </summary>

      <div className="mt-2 space-y-2">
        <label className="flex items-center gap-1 text-xs text-ink-300">
          <input
            type="checkbox"
            checked={showMinor}
            onChange={(event) => setShowMinor(event.target.checked)}
          />
          Tampilkan perpindahan READY/RUNNING
        </label>

        {shown.length === 0 ? (
          <p className="text-xs text-ink-300">
            Belum ada kejadian. Tekan Jalankan atau Step.
          </p>
        ) : (
          <ol
            aria-label="Daftar kejadian, terbaru di atas"
            className="max-h-40 space-y-1 overflow-y-auto rounded bg-navy-900 p-2"
          >
            {shown.map((entry) => (
              <li
                key={entry.id}
                className={`flex gap-2 border-l-2 pl-2 text-xs ${KIND_STYLE[entry.kind].border}`}
              >
                <span className="w-9 shrink-0 text-ink-300">t{entry.tick}</span>
                <span aria-hidden="true">{KIND_STYLE[entry.kind].icon}</span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

/** Log Kejadian yang terhubung ke controller. */
export function LogHud({ controller }: { controller: SimulationController }) {
  const entries = useEventLog(controller);
  return <LogHudView entries={entries} />;
}
