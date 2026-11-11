import type { LevelDefinition } from '../../levels/types';
import { ARENA, HUD_SAFE } from '../theme';
import type { TableLayout } from './types';

/**
 * Memeriksa layout meja bundar (Level 2-3) terhadap level.
 * Mengembalikan daftar masalah (kosong = sah).
 */
export function validateTableLayout(
  layout: TableLayout,
  level: LevelDefinition,
): string[] {
  const errors: string[] = [];

  if (layout.id !== level.layoutId) {
    errors.push(`id layout "${layout.id}" != layoutId "${level.layoutId}"`);
  }

  // Center harus di dalam HUD_SAFE
  if (
    layout.center.x < HUD_SAFE.x ||
    layout.center.x > HUD_SAFE.x + HUD_SAFE.width ||
    layout.center.y < HUD_SAFE.y ||
    layout.center.y > HUD_SAFE.y + HUD_SAFE.height
  ) {
    errors.push('pusat meja di luar HUD_SAFE');
  }

  // Radius harus masuk akal (tidak keluar ARENA)
  if (
    layout.center.x - layout.radius < 0 ||
    layout.center.x + layout.radius > ARENA.width ||
    layout.center.y - layout.radius < 0 ||
    layout.center.y + layout.radius > ARENA.height
  ) {
    errors.push('lingkaran teknisi keluar ARENA');
  }

  // Jumlah teknisi dan kunci harus sama dengan level
  if (layout.technicianIds.length !== level.threads.length) {
    errors.push(
      `jumlah teknisi ${layout.technicianIds.length}, seharusnya ${level.threads.length}`,
    );
  }

  const forkCount = level.resources.filter((r) => r.kind === 'mutex').length;
  if (layout.forkIds.length !== forkCount) {
    errors.push(`jumlah kunci ${layout.forkIds.length}, seharusnya ${forkCount}`);
  }

  // Coffman zone harus di dalam HUD_SAFE
  if (
    layout.coffmanZone.x < HUD_SAFE.x ||
    layout.coffmanZone.x + layout.coffmanZone.width >
      HUD_SAFE.x + HUD_SAFE.width ||
    layout.coffmanZone.y < HUD_SAFE.y ||
    layout.coffmanZone.y + layout.coffmanZone.height >
      HUD_SAFE.y + HUD_SAFE.height
  ) {
    errors.push('zona Coffman di luar HUD_SAFE');
  }

  // Preempt button harus di dalam HUD_SAFE
  if (
    layout.preemptButton.x < HUD_SAFE.x ||
    layout.preemptButton.x > HUD_SAFE.x + HUD_SAFE.width ||
    layout.preemptButton.y < HUD_SAFE.y ||
    layout.preemptButton.y > HUD_SAFE.y + HUD_SAFE.height
  ) {
    errors.push('tombol Rampas kunci di luar HUD_SAFE');
  }

  return errors;
}