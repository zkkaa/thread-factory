import type { Instruction } from '../engine/types';
import { TINY_FRAMES } from './assetManifest';

type Op = Instruction['op'];

/**
 * Ikon instruksi pada checkpoint. Instruksi yang tidak ada di sini (mis. LOCK
 * dan UNLOCK, yang sudah punya gerbang) tampil sebagai teks saja.
 */
const ICON_FRAMES: Partial<Record<Op, number>> = {
  WORK: TINY_FRAMES.iconWork,
  READ: TINY_FRAMES.iconTransfer,
  WRITE: TINY_FRAMES.iconTransfer,
  COMPUTE: TINY_FRAMES.iconCompute,
};

/** Nomor frame ikon untuk instruksi `op`, atau null bila tidak ada ikon. */
export function iconFrameFor(op: Op): number | null {
  return ICON_FRAMES[op] ?? null;
}
