import { ROBOT_STATES } from '../../guideContent';

/**
 * Legenda arti status robot (READY, RUNNING, WAITING, TERMINATED).
 * Datanya dari guideContent.ts, sama dengan yang tampil di layar Panduan.
 */
export function StatusLegend() {
  return (
    <details className="rounded border border-navy-500 p-2 text-xs">
      <summary className="cursor-pointer font-semibold">
        Arti status robot
      </summary>
      <dl className="mt-2 space-y-1">
        {ROBOT_STATES.map((info) => (
          <div key={info.state}>
            <dt className="font-bold">{info.state}</dt>
            <dd className="text-ink-300">{info.meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
