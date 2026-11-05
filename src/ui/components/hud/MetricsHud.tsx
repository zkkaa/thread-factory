import type { ControllerState } from '../../../controller/SimulationController';
import { deriveMetrics } from '../../metricsView';

/**
 * Laci Metrik (PRD 17.2): tertutup secara default; ringkasan nilai target
 * tetap terlihat di judul. Isinya: pembaruan hilang, throughput, dan waktu
 * tunggu tiap robot. Level dengan robot busy waiting menambah tick busy
 * waiting dan sisa baterai robot itu.
 */
export function MetricsHud({ state }: { state: ControllerState }) {
  const view = deriveMetrics(state);
  if (view === null) return null;

  return (
    <details className="group w-72 rounded-lg border border-navy-500 bg-navy-800/90 p-2 text-ink-100">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-bold">
        <span>
          {view.area === null ? (
            <>
              Metrik: {view.variable} {view.current} / {view.target}
            </>
          ) : (
            <>
              Metrik: {view.area.name} {view.area.occupancy} /{' '}
              {view.area.capacity}
            </>
          )}
        </span>
        <span className="text-xs font-normal text-ink-300">
          <span className="group-open:hidden">Buka</span>
          <span className="hidden group-open:inline">Lipat</span>
        </span>
      </summary>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {view.area === null ? (
          <>
            <dt className="text-ink-300">Pembaruan hilang</dt>
            <dd>{view.lostUpdates}</dd>
          </>
        ) : (
          <>
            <dt className="text-ink-300">Tick bentrok</dt>
            <dd>{view.area.overloadTicks} tick</dd>
            <dt className="text-ink-300">Utilisasi area</dt>
            <dd>{view.area.utilization}</dd>
          </>
        )}

        <dt className="text-ink-300">Throughput</dt>
        <dd>{view.throughput}</dd>

        {view.cores > 1 && (
          <div className="contents">
            <dt className="text-ink-300">Utilisasi core</dt>
            <dd>{view.coreUtilization}</dd>
          </div>
        )}

        {view.busyWait !== null && (
          <>
            <dt className="text-ink-300">Tick busy waiting</dt>
            <dd>{view.busyWait.totalTicks} tick</dd>
            {view.busyWait.robots.map((robot) => (
              <div key={robot.id} className="contents">
                <dt className="text-ink-300">Baterai {robot.label}</dt>
                <dd>{robot.battery}</dd>
              </div>
            ))}
          </>
        )}

        {view.threads.map((thread) => (
          <div key={thread.id} className="contents">
            <dt className="text-ink-300">Tunggu {thread.label}</dt>
            <dd>{thread.waitTicks} tick</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
