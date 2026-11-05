import type { ControllerState } from '../controller/SimulationController';
import { batteryLevel, computeMetrics } from '../engine/metrics';
import { areaOf } from './areaMode';

/**
 * Menyiapkan angka untuk Laci Metrik. Murni (tanpa React) supaya bisa dites.
 * Nilai variabel dan waktu tunggu dibaca dari snapshot (tiap tick);
 * pembaruan hilang dan throughput baru ada setelah simulasi selesai.
 * Level berarea (mis. aula Level 1-3) mendapat `area` berisi isi, kapasitas,
 * tick bentrok, dan utilisasi; level lain `area` bernilai null.
 * Level yang punya robot busy waiting (SPIN_UNTIL, mis. Level 1-4) mendapat
 * `busyWait` berisi total tick dan sisa baterai tiap robot itu; level lain
 * `busyWait` bernilai null.
 */
export function deriveMetrics(state: ControllerState) {
  const { level, snapshot, result } = state;
  if (level === null || snapshot === null) return null;

  const { variable, value: target } = level.goal.target;
  const metrics = result?.metrics;
  const liveUtilization = computeMetrics(snapshot).coreUtilization;
  const area = areaOf(level);
  const spinners = level.threads.filter((def) =>
    def.program.some((instruction) => instruction.op === 'SPIN_UNTIL'),
  );

  return {
    variable,
    target,
    current: snapshot.sharedVars[variable],
    lostUpdates: metrics ? String(metrics.lostUpdates) : '-',
    throughput: metrics
      ? `${metrics.throughput.toFixed(2)} pekerjaan/tick`
      : '-',
    cores: snapshot.cores,
    coreUtilization: `${Math.round(liveUtilization * 100)}%`,
    area:
      area === null
        ? null
        : {
            name: area.name,
            capacity: area.capacity,
            occupancy: snapshot.areaOccupancy[area.name] ?? 0,
            overloadTicks: snapshot.overloadTicks,
            utilization: `${Math.round(snapshot.areaUtilization * 100)}%`,
          },
    busyWait:
      spinners.length === 0
        ? null
        : {
            totalTicks: snapshot.busyWaitTicks,
            robots: spinners.map((def) => {
              const ticks =
                snapshot.threads.find((t) => t.id === def.id)?.busyWaitTicks ??
                0;
              return {
                id: def.id,
                label: def.label,
                ticks,
                battery: `${Math.round(batteryLevel(ticks) * 100)}%`,
              };
            }),
          },
    threads: snapshot.threads.map((thread) => ({
      id: thread.id,
      label: thread.label,
      waitTicks: thread.waitTicks,
    })),
  };
}
