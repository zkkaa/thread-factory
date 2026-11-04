import type { ControllerState } from '../controller/SimulationController';
import { computeMetrics } from '../engine/metrics';
import { areaOf } from './areaMode';

/**
 * Menyiapkan angka untuk Laci Metrik. Murni (tanpa React) supaya bisa dites.
 * Nilai variabel dan waktu tunggu dibaca dari snapshot (tiap tick);
 * pembaruan hilang dan throughput baru ada setelah simulasi selesai.
 * Level berarea (mis. aula Level 1-3) mendapat `area` berisi isi, kapasitas,
 * tick bentrok, dan utilisasi; level lain `area` bernilai null.
 */
export function deriveMetrics(state: ControllerState) {
  const { level, snapshot, result } = state;
  if (level === null || snapshot === null) return null;

  const { variable, value: target } = level.goal.target;
  const metrics = result?.metrics;
  const liveUtilization = computeMetrics(snapshot).coreUtilization;
  const area = areaOf(level);

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
    threads: snapshot.threads.map((thread) => ({
      id: thread.id,
      label: thread.label,
      waitTicks: thread.waitTicks,
    })),
  };
}
