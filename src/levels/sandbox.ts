import type { RwPolicy } from '../engine/primitives/rwlock';
import type { Snapshot } from '../engine/types';
import type { LevelDefinition } from './types';

/** Kunci parameter Sandbox. */
export type SandboxKey =
  | 'repeat'
  | 'readRepeat'
  | 'writeRepeat'
  | 'cores'
  | 'bufferCapacity'
  | 'lockPolicy';

/** Parameter bilangan bulat dengan batas. */
export interface SandboxNumberDef {
  kind: 'number';
  key: SandboxKey;
  label: string;
  min: number;
  max: number;
  initial: number;
}

/** Parameter pilihan kebijakan kunci. */
export interface SandboxChoiceDef {
  kind: 'choice';
  key: SandboxKey;
  label: string;
  options: readonly { value: RwPolicy; label: string }[];
  initial: RwPolicy;
}

export type SandboxParamDef = SandboxNumberDef | SandboxChoiceDef;

/** Nilai yang dipilih pemain; kunci yang tidak diisi memakai nilai awal. */
export type SandboxValues = Partial<Record<SandboxKey, number | string>>;

export interface SandboxResult {
  /** Salinan level dengan parameter diterapkan; level asli tidak diubah. */
  level: LevelDefinition;
  /** Kebijakan kunci pilihan pemain; diteruskan ke loadLevel (opsi rwPolicy). */
  rwPolicy?: RwPolicy;
}

/** Parameter yang boleh diubah, per id level. Nilai awal = nilai di data level. */
export const SANDBOX_PARAMS: Readonly<
  Record<string, readonly SandboxParamDef[]>
> = {
  '2-1': [
    {
      kind: 'number',
      key: 'repeat',
      label: 'Barang per robot',
      min: 1,
      max: 10,
      initial: 4,
    },
    {
      kind: 'number',
      key: 'cores',
      label: 'Jumlah core',
      min: 1,
      max: 4,
      initial: 4,
    },
    {
      kind: 'number',
      key: 'bufferCapacity',
      label: 'Kapasitas ban',
      min: 1,
      max: 8,
      initial: 3,
    },
  ],
  '2-2': [
    {
      kind: 'number',
      key: 'readRepeat',
      label: 'Bacaan per pembaca',
      min: 1,
      max: 20,
      initial: 10,
    },
    {
      kind: 'number',
      key: 'writeRepeat',
      label: 'Tulisan per penulis',
      min: 1,
      max: 10,
      initial: 3,
    },
    {
      kind: 'number',
      key: 'cores',
      label: 'Jumlah core',
      min: 1,
      max: 8,
      initial: 8,
    },
    {
      kind: 'choice',
      key: 'lockPolicy',
      label: 'Kebijakan kunci',
      options: [
        { value: 'reader', label: 'Pembaca diutamakan' },
        { value: 'writer', label: 'Penulis diutamakan' },
        { value: 'fair', label: 'Adil (FIFO)' },
      ],
      initial: 'reader',
    },
  ],
};

/** Sandbox hanya tersedia untuk level yang punya daftar parameter. */
export function isSandboxSupported(levelId: string): boolean {
  return SANDBOX_PARAMS[levelId] !== undefined;
}

export function sandboxParamsFor(levelId: string): readonly SandboxParamDef[] {
  return SANDBOX_PARAMS[levelId] ?? [];
}

/** Nilai awal semua parameter sebuah level (untuk mengisi laci Parameter). */
export function defaultSandboxValues(levelId: string): SandboxValues {
  const values: SandboxValues = {};
  for (const def of sandboxParamsFor(levelId)) values[def.key] = def.initial;
  return values;
}

/** Memeriksa nilai terhadap definisi; melempar Error berpesan jelas bila salah. */
function resolveValue(
  def: SandboxParamDef,
  raw: number | string | undefined,
): number | string {
  if (raw === undefined) return def.initial;
  if (def.kind === 'choice') {
    if (!def.options.some((option) => option.value === raw)) {
      throw new Error(`Nilai "${String(raw)}" tidak sah untuk "${def.label}".`);
    }
    return raw;
  }
  if (typeof raw !== 'number' || !Number.isInteger(raw)) {
    throw new Error(`"${def.label}" harus bilangan bulat.`);
  }
  if (raw < def.min || raw > def.max) {
    throw new Error(`"${def.label}" harus antara ${def.min} dan ${def.max}.`);
  }
  return raw;
}

/** Invariant Level 2-1 dengan target dihitung dari jumlah barang yang diproduksi. */
function beltInvariant(expected: number) {
  return (snap: Snapshot): { ok: boolean; message: string } => {
    const ban = snap.buffers[0];
    if (snap.overflowCount > 0 || snap.underflowCount > 0) {
      return {
        ok: false,
        message: `Overflow ${snap.overflowCount}x, underflow ${snap.underflowCount}x di ban.`,
      };
    }
    if (ban === undefined || ban.totalTaken !== expected) {
      return {
        ok: false,
        message: `Seharusnya ${expected} barang sampai di pengepak, hasilnya ${ban?.totalTaken ?? 0}.`,
      };
    }
    return {
      ok: true,
      message: 'Semua barang lewat ban tanpa jatuh atau meraih kosong.',
    };
  };
}

/**
 * Menerapkan parameter Sandbox ke sebuah level. Fungsi murni: level asli tidak
 * diubah. Tanpa nilai apa pun, hasilnya setara dengan level asli.
 */
export function applySandboxParams(
  level: LevelDefinition,
  values: SandboxValues = {},
): SandboxResult {
  const defs = SANDBOX_PARAMS[level.id];
  if (defs === undefined) {
    throw new Error(`Level ${level.id} belum mendukung Sandbox.`);
  }
  const known = new Set<string>(defs.map((def) => def.key));
  for (const key of Object.keys(values)) {
    if (!known.has(key)) {
      throw new Error(`Parameter "${key}" tidak ada di level ${level.id}.`);
    }
  }

  const chosen = new Map<SandboxKey, number | string>();
  for (const def of defs) chosen.set(def.key, resolveValue(def, values[def.key]));
  const num = (key: SandboxKey): number | undefined => {
    const value = chosen.get(key);
    return typeof value === 'number' ? value : undefined;
  };

  const repeat = num('repeat');
  const readRepeat = num('readRepeat');
  const writeRepeat = num('writeRepeat');
  const cores = num('cores');
  const capacity = num('bufferCapacity');

  const threads = level.threads.map((thread) => {
    let next = thread.repeat;
    if (repeat !== undefined) next = repeat;
    if (readRepeat !== undefined && thread.id.startsWith('R')) next = readRepeat;
    if (writeRepeat !== undefined && thread.id.startsWith('W')) next = writeRepeat;
    return { ...thread, repeat: next };
  });

  const next: LevelDefinition = {
    ...level,
    threads,
    scheduler:
      cores === undefined ? level.scheduler : { ...level.scheduler, cores },
    // Beban bisa lebih besar dari level asli; beri ruang tick lebih banyak.
    maxTicks: (level.maxTicks ?? 2000) * 3,
  };

  if (capacity !== undefined) {
    // Kapasitas ban dan nilai awal semaphore "empty" harus selalu sama.
    next.buffers = Object.fromEntries(
      Object.keys(level.buffers ?? {}).map((id) => [id, capacity]),
    );
    next.resources = level.resources.map((resource) =>
      resource.kind === 'semaphore' && resource.id === 'empty'
        ? { ...resource, initialValue: capacity }
        : resource,
    );
  }

  if (level.id === '2-1') {
    const expected = threads
      .filter((thread) => thread.id.startsWith('P'))
      .reduce((sum, thread) => sum + (thread.repeat ?? 1), 0);
    next.goal = { ...level.goal, invariant: beltInvariant(expected) };
  }

  const policy = chosen.get('lockPolicy');
  return typeof policy === 'string'
    ? { level: next, rwPolicy: policy as RwPolicy }
    : { level: next };
}