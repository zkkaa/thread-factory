import type { HallZone } from './hallSpots';
import type { HallLayout, Point } from './layouts/types';

/** Posisi robot pada satu saat: zona logisnya dan titik layarnya. */
export interface HallPlace {
  zone: HallZone;
  point: Point;
}

/**
 * Cara robot berpindah:
 * - none   : tidak berpindah;
 * - walk   : berjalan lewat titik-titik ini (berakhir di tujuan), mengikuti jalan;
 * - respawn: tidak ada jalan menuju tujuannya (mis. kembali ke pijakan atau
 *            parkir "selesai"), jadi robot memudar lalu muncul di tujuan.
 */
export type HallMove =
  | { kind: 'none' }
  | { kind: 'walk'; points: Point[] }
  | { kind: 'respawn' };

const SAME_POINT = 1;

function nearestLane(
  lanes: readonly { y: number; turnX: number }[],
  y: number,
): { y: number; turnX: number } | undefined {
  let best: { y: number; turnX: number } | undefined;
  let bestGap = Infinity;
  for (const lane of lanes) {
    const gap = Math.abs(lane.y - y);
    if (gap < bestGap) {
      best = lane;
      bestGap = gap;
    }
  }
  return best;
}

/**
 * Merencanakan perpindahan satu robot menurut jalan pada gambar: dari kolom
 * pijakan ke sumbu tegak, naik atau turun ke lajur, maju sampai gerbang,
 * belok di ujung lajur, bergabung, lalu masuk Area Kerja. Tanpa data rute
 * pada layout (layout polos), robot berjalan lurus ke tujuan.
 * `from` null = penempatan pertama (tanpa animasi). Fungsi murni.
 */
export function planMove(
  layout: HallLayout,
  from: HallPlace | null,
  to: HallPlace,
): HallMove {
  if (from === null) return { kind: 'none' };
  const dx = from.point.x - to.point.x;
  const dy = from.point.y - to.point.y;
  if (Math.hypot(dx, dy) < SAME_POINT) return { kind: 'none' };

  // Keluar dari aula tidak punya jalan menuju pijakan atau baris selesai.
  const leaving = from.zone === 'hall' && to.zone !== 'hall';
  if (leaving || to.zone === 'done') return { kind: 'respawn' };

  const route = layout.art?.route;
  if (route === undefined) return { kind: 'walk', points: [to.point] };

  const { spineX, merge } = route;
  const gateX = layout.door.x;

  if (from.zone === 'work' && (to.zone === 'queue' || to.zone === 'door')) {
    const lane = nearestLane(route.lanes, to.point.y);
    if (lane === undefined) return { kind: 'walk', points: [to.point] };
    return {
      kind: 'walk',
      points: [
        { x: spineX, y: from.point.y },
        { x: spineX, y: lane.y },
        to.point,
      ],
    };
  }

  if (to.zone === 'hall' && from.zone !== 'hall') {
    const lane = nearestLane(
      route.lanes,
      from.zone === 'work' ? to.point.y : from.point.y,
    );
    if (lane === undefined) return { kind: 'walk', points: [to.point] };
    const points: Point[] = [];
    if (from.zone === 'work') {
      points.push(
        { x: spineX, y: from.point.y },
        { x: spineX, y: lane.y },
      );
    }
    points.push(
      { x: gateX, y: lane.y },
      { x: lane.turnX, y: lane.y },
      merge,
      to.point,
    );
    return { kind: 'walk', points };
  }

  return { kind: 'walk', points: [to.point] };
}