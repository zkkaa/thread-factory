import type { ControllerState } from '../../../controller/SimulationController';
import { deriveMetrics } from '../../metricsView';

/**
 * Laci Metrik (PRD 17.2): tertutup secara default; ringkasan nilai target
 * tetap terlihat di judul. Isinya: pembaruan hilang, throughput, dan waktu
 * tunggu tiap robot.
 */
export function MetricsHud({ state }: { state: ControllerState }) {
  const view = deriveMetrics(state);
  if (view === null) return null;

  return (
    <details className="group w-72 rounded-lg border border-navy-500 bg-navy-800/90 p-2 text-ink-100">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-bold">
        <span>
          Metrik: {view.variable} {view.current} / {view.target}
        </span>
        <span className="text-xs font-normal text-ink-300">
          <span className="group-open:hidden">Buka</span>
          <span className="hidden group-open:inline">Lipat</span>
        </span>
      </summary>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-300">Pembaruan hilang</dt>
        <dd>{view.lostUpdates}</dd>

        <dt className="text-ink-300">Throughput</dt>
        <dd>{view.throughput}</dd>

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
