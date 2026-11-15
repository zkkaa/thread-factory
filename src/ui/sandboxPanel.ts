import type { LoadOptions } from '../controller/SimulationController';
import {
  applySandboxParams,
  sandboxParamsFor,
  type SandboxKey,
  type SandboxNumberDef,
  type SandboxValues,
} from '../levels/sandbox';
import type { LevelDefinition } from '../levels/types';

/** Hasil menyiapkan level Sandbox: siap dimuat, atau pesan kesalahan. */
export type SandboxPlan =
  | { ok: true; level: LevelDefinition; options: LoadOptions }
  | { ok: false; message: string };

/** Membulatkan dan membatasi angka ke rentang parameter. NaN kembali ke nilai awal. */
export function clampToDef(def: SandboxNumberDef, raw: number): number {
  if (!Number.isFinite(raw)) return def.initial;
  return Math.min(def.max, Math.max(def.min, Math.round(raw)));
}

/** Nilai angka sebuah parameter saat ini (nilai awal bila belum diisi). */
export function currentNumber(
  def: SandboxNumberDef,
  values: SandboxValues,
): number {
  const value = values[def.key];
  return typeof value === 'number' ? value : def.initial;
}

/**
 * Mengganti satu nilai. Angka dibatasi ke rentangnya; pilihan yang tidak sah
 * diabaikan. Mengembalikan objek baru (tidak memutasi masukan).
 */
export function changeValue(
  levelId: string,
  values: SandboxValues,
  key: SandboxKey,
  raw: number | string,
): SandboxValues {
  const def = sandboxParamsFor(levelId).find((item) => item.key === key);
  if (def === undefined) return values;
  if (def.kind === 'choice') {
    return def.options.some((option) => option.value === raw)
      ? { ...values, [key]: raw }
      : values;
  }
  if (typeof raw !== 'number') return values;
  return { ...values, [key]: clampToDef(def, raw) };
}

/** Menambah atau mengurangi parameter angka sebanyak `delta`. */
export function stepValue(
  levelId: string,
  values: SandboxValues,
  key: SandboxKey,
  delta: number,
): SandboxValues {
  const def = sandboxParamsFor(levelId).find((item) => item.key === key);
  if (def === undefined || def.kind !== 'number') return values;
  return changeValue(levelId, values, key, currentNumber(def, values) + delta);
}

/**
 * Menyiapkan level + opsi muat untuk controller. Sandbox selalu tanpa bintang
 * (`rated: false`); kebijakan kunci hanya ikut bila levelnya punya.
 */
export function planSandbox(
  level: LevelDefinition,
  values: SandboxValues,
): SandboxPlan {
  try {
    const result = applySandboxParams(level, values);
    const options: LoadOptions =
      result.rwPolicy === undefined
        ? { rated: false }
        : { rated: false, rwPolicy: result.rwPolicy };
    return { ok: true, level: result.level, options };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}