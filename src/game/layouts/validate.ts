import type { LevelDefinition } from '../../levels/types';
import { ARENA } from '../theme';
import type { ArenaLayout, Point } from './types';

const inArena = (p: Point): boolean =>
  p.x >= 0 && p.x <= ARENA.width && p.y >= 0 && p.y <= ARENA.height;

const strictlyAscending = (values: readonly number[]): boolean =>
  values.every((v, i) => i === 0 || v > (values[i - 1] ?? 0));

/** Memeriksa layout terhadap level. Mengembalikan daftar masalah (kosong = sah). */
export function validateLayout(
  layout: ArenaLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];
  const lengths = level.threads.map((t) => t.program.length);
  const n = lengths[0] ?? 0;

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }
  if (lengths.some((len) => len !== n)) {
    errors.push('robot di satu loop harus berprogram sama panjang');
  }
  if (layout.checkpoints.length !== n) {
    errors.push(`checkpoint ${layout.checkpoints.length}, program ${n}`);
  }
  if (layout.slots.length !== n + 1) {
    errors.push(`slot ${layout.slots.length}, seharusnya ${n + 1}`);
  }
  if (layout.laneOffsets.length !== level.threads.length) {
    errors.push('laneOffsets harus satu per robot');
  }
  if (!strictlyAscending(layout.checkpoints)) {
    errors.push('fraksi checkpoint harus menaik');
  }
  if (!strictlyAscending(layout.slots)) {
    errors.push('fraksi slot harus menaik');
  }
  const fractions = [...layout.checkpoints, ...layout.slots];
  if (fractions.some((f) => f < 0 || f > 1)) {
    errors.push('fraksi harus di antara 0 dan 1');
  }
  layout.slots.forEach((slot, k) => {
    const cp = layout.checkpoints[k];
    const prev = layout.checkpoints[k - 1];
    if (cp !== undefined && slot >= cp) {
      errors.push(`slot ${k} harus sebelum checkpoint ${k}`);
    }
    if (prev !== undefined && slot <= prev) {
      errors.push(`slot ${k} harus sesudah checkpoint ${k - 1}`);
    }
  });
  if (layout.path.length < 3) errors.push('jalan butuh minimal 3 titik');
  if (!layout.path.every(inArena)) errors.push('titik jalan di luar ARENA');
  const { x, y, width, height } = layout.board;
  if (!inArena({ x, y }) || !inArena({ x: x + width, y: y + height })) {
    errors.push('papan di luar ARENA');
  }
  if (layout.boardLinks.some((l) => l.checkpoint >= n || l.checkpoint < 0)) {
    errors.push('boardLinks menunjuk checkpoint yang tidak ada');
  }
  return errors;
}
