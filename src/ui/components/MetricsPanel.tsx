import type { ControllerState } from '../../controller/SimulationController';

interface MetricsPanelProps {
  state: ControllerState;
}

/**
 * Angka-angka simulasi. Nilai variabel target dan waktu tunggu dibaca langsung
 * dari snapshot (bisa dilihat tiap tick); pembaruan hilang dan throughput baru
 * ada setelah simulasi selesai, dari hasil penilaian controller.
 */
export function MetricsPanel({ state }: MetricsPanelProps) {
  const { level, snapshot, result } = state;
  if (level === null || snapshot === null) return null;

  const { variable, value: target } = level.goal.target;
  const current = snapshot.sharedVars[variable];
  const metrics = result?.metrics;

  return (
    <section aria-label="Metrik" className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-300">
        Metrik
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-gray-400">Nilai {variable}</dt>
        <dd>
          <strong>{current}</strong> / target {target}
        </dd>

        <dt className="text-gray-400">Pembaruan hilang</dt>
        <dd>{metrics?.lostUpdates ?? '-'}</dd>

        <dt className="text-gray-400">Throughput</dt>
        <dd>
          {metrics ? `${metrics.throughput.toFixed(2)} pekerjaan/tick` : '-'}
        </dd>

        {snapshot.threads.map((thread) => (
          <div key={thread.id} className="contents">
            <dt className="text-gray-400">Waktu tunggu {thread.label}</dt>
            <dd>{thread.waitTicks} tick</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
