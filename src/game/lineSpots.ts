import type { InstructionOrigin } from '../engine/tools';
import type { Instruction } from '../engine/types';
import type { LineLayout } from './layouts/types';

/**
 * x tiap instruksi efektif pada lajur: instruksi asli (atau pengganti) di
 * checkpoint, instruksi sisipan alat di slotnya. Fungsi murni.
 */
export function lineAnchorX(
  origins: readonly InstructionOrigin[],
  layout: LineLayout,
): number[] {
  return origins.map((origin) => {
    if (origin.kind === 'original' || origin.kind === 'replaced') {
      const x = layout.checkpointX[origin.index];
      if (x === undefined) {
        throw new Error(`Checkpoint ${origin.index} tidak ada di layout.`);
      }
      return x;
    }
    const x = layout.slotX[origin.slot];
    if (x === undefined) {
      throw new Error(`Slot ${origin.slot} tidak ada di layout.`);
    }
    return x;
  });
}

/** x robot dari pc (instruksi berikutnya); pc di luar rentang dijepit. */
export function lineRobotX(pc: number, xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const index = Math.max(0, Math.min(pc, xs.length - 1));
  return xs[index] ?? 0;
}

export interface LineGate {
  kind: 'mutex' | 'semaphore';
  role: 'entry' | 'exit';
  x: number;
}

/**
 * Gerbang alat dari instruksi sisipan: LOCK/UNLOCK (mutex) dan
 * SEM_WAIT/SEM_SIGNAL (semaphore). Dibaca dari satu robot karena alat berlaku
 * untuk semua robot dan slotnya sama.
 */
export function lineGates(
  program: readonly Instruction[],
  origins: readonly InstructionOrigin[],
  layout: LineLayout,
): LineGate[] {
  const gates: LineGate[] = [];
  origins.forEach((origin, index) => {
    if (origin.kind !== 'inserted') return;
    const x = layout.slotX[origin.slot];
    const op = program[index]?.op;
    if (x === undefined) return;
    if (op === 'LOCK') gates.push({ kind: 'mutex', role: 'entry', x });
    else if (op === 'UNLOCK') gates.push({ kind: 'mutex', role: 'exit', x });
    else if (op === 'SEM_WAIT') {
      gates.push({ kind: 'semaphore', role: 'entry', x });
    } else if (op === 'SEM_SIGNAL') {
      gates.push({ kind: 'semaphore', role: 'exit', x });
    }
  });
  return gates;
}

/** Teks pendek di checkpoint kecil (diameter 40 px). */
export function lineCheckpointLabel(instruction: Instruction): string {
  switch (instruction.op) {
    case 'ENTER_AREA':
      return 'ENTER';
    case 'LEAVE_AREA':
      return 'LEAVE';
    case 'SPIN_UNTIL':
      return 'CEK';
    case 'COMPUTE':
      return 'COMP';
    default:
      return instruction.op;
  }
}
