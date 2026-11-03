import type { ControllerState } from '../../../controller/SimulationController';
import { computeMetrics } from '../../../engine/metrics';

interface CoreIndicatorHudProps {
  state: ControllerState;
}

/**
 * Indikator Core 1 & Core 2 dan Meter Utilisasi (T-086 / PRD 16.2).
 * Tampil saat level memakai lebih dari 1 core (multicore).
 * Menunjukkan apakah tiap core sedang sibuk (menjalankan robot tertentu)
 * atau menganggur, serta meter utilisasi core keseluruhan.
 */
export function CoreIndicatorHud({ state }: CoreIndicatorHudProps) {
  const { snapshot } = state;
  if (snapshot === null || snapshot.cores <= 1) return null;

  const cores = snapshot.cores;
  const runningThreads = snapshot.threads.filter((t) => t.state === 'RUNNING');
  const metrics = computeMetrics(snapshot);
  const utilizationPercent = Math.round(metrics.coreUtilization * 100);

  return (
    <div
      aria-label="Status Core Penjadwal"
      data-testid="core-indicator-hud"
      className="rounded-xl border border-navy-500 bg-navy-900/90 p-2.5 shadow-lg text-xs w-80 space-y-2"
    >
      <div className="flex items-center justify-between font-bold">
        <span className="text-ink-100 flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-sun-400"
            aria-hidden="true"
          />
          <span>Si Penjadwal ({cores} Core)</span>
        </span>
        <span className="text-sun-400 font-mono">
          {utilizationPercent}% utilisasi
        </span>
      </div>

      {/* Meter Utilisasi Bar */}
      <div
        role="progressbar"
        aria-valuenow={utilizationPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Meter utilisasi core"
        className="h-1.5 w-full rounded-full bg-navy-700 overflow-hidden"
      >
        <div
          className="h-full bg-sun-400 transition-all duration-200"
          style={{
            width: `${Math.min(100, Math.max(0, utilizationPercent))}%`,
          }}
        />
      </div>

      {/* Daftar Core */}
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {Array.from({ length: cores }, (_, i) => {
          const coreNum = i + 1;
          const assigned = runningThreads[i];
          const isBusy = assigned !== undefined;

          return (
            <div
              key={coreNum}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
                isBusy
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-navy-600 bg-navy-800/80 text-ink-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBusy ? 'bg-emerald-400' : 'bg-ink-400'
                }`}
                aria-hidden="true"
              />
              <div className="truncate">
                <span className="font-semibold">Core {coreNum}: </span>
                <span>{isBusy ? assigned.label : 'Menganggur'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
