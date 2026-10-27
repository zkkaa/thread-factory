import type { InstructionOrigin } from '../engine/tools';
import type { LoopLayout } from './layouts/types';

/** Titik visual satu instruksi efektif: di checkpoint atau di gerbang (slot). */
export interface Anchor {
  kind: 'checkpoint' | 'gate';
  /** Posisi pada jalan (fraksi 0..1). */
  fraction: number;
}

/**
 * Memetakan tiap instruksi efektif ke titik visual. Instruksi asli ke-i berada
 * di checkpoint ke-i; LOCK/UNLOCK sisipan berada di gerbang pada slotnya.
 * Robot yang menunggu LOCK berhenti di gerbang, tepat di depan pintu.
 */
export function computeAnchors(
  origins: readonly InstructionOrigin[],
  layout: LoopLayout,
): Anchor[] {
  return origins.map((origin) => {
    if (origin.kind === 'original') {
      const fraction = layout.checkpoints[origin.index];
      if (fraction === undefined) {
        throw new Error(`Checkpoint ${origin.index} tidak ada di layout.`);
      }
      return { kind: 'checkpoint', fraction };
    }
    const fraction = layout.slots[origin.slot];
    if (fraction === undefined) {
      throw new Error(`Slot ${origin.slot} tidak ada di layout.`);
    }
    return { kind: 'gate', fraction };
  });
}
