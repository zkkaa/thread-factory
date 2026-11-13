import type { Instruction, Snapshot, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';
import { LEVEL_2_2_CONTENT } from './level-2-2.content';

// Pembaca diperbanyak dan diulang lebih sering agar hampir selalu ada
// pembaca yang memegang kunci. Itulah yang membuat penulis kelaparan
// pada reader priority.
export const LEVEL_2_2_READERS = 6;
export const LEVEL_2_2_WRITERS = 2;
export const LEVEL_2_2_READS = 10;
export const LEVEL_2_2_WRITES = 3;
export const LEVEL_2_2_BOARD = 'papan';
export const LEVEL_2_2_LOCK = 'kunci-papan';

/** Seed tutorial. Tanpa pengaman, seed 1..50 semuanya menghasilkan bacaan setengah jadi. */
export const LEVEL_2_2_TUTORIAL_SEED = 1;

/**
 * Ambang starvation penulis (tick menunggu berturut-turut).
 * Hasil ukur seed 1..50 (11 Nov 2026): puncak penulis terburuk
 * fair = 8, writer = 6, reader = 11. Ambang 10 berada di antara fair
 * dan reader. Ukur ulang bila program level berubah.
 */
export const LEVEL_2_2_STARVATION_TICKS = 10;

/** Panjang WORK awal pembaca bergantian 1, 2, 3 agar fase mereka tidak serempak. */
const READER_PHASES = [1, 2, 3];

/**
 * Program pembaca ke-`index` (mulai 0). Hanya WORK awal yang berbeda; struktur
 * (WORK, BOARD_READ, WORK) tetap, sehingga rwTool.ts tidak berubah.
 * Fase yang bergeser mencegah semua pembaca melepas kunci pada tick yang sama
 * (celah tempat penulis menyelinap).
 */
export function readerProgramFor(index: number): Instruction[] {
  const phase = READER_PHASES[index % READER_PHASES.length] ?? 1;
  return [
    { op: 'WORK', ticks: phase },
    { op: 'BOARD_READ', board: LEVEL_2_2_BOARD },
    { op: 'WORK', ticks: 1 },
  ];
}

/** Penulisan dua langkah dengan WORK di antaranya: jendela data setengah jadi. */
export const WRITER_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'BOARD_WRITE_START', board: LEVEL_2_2_BOARD },
  { op: 'WORK', ticks: 1 },
  { op: 'BOARD_WRITE_END', board: LEVEL_2_2_BOARD },
];

function makeThreads(
  prefix: string,
  label: string,
  count: number,
  programFor: (index: number) => Instruction[],
  repeat: number,
): ThreadDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    label: `${label} ${i + 1}`,
    program: programFor(i).map((ins) => ({ ...ins })),
    repeat,
  }));
}

export const LEVEL_2_2_THREADS: ThreadDef[] = [
  ...makeThreads(
    'R',
    'Pembaca',
    LEVEL_2_2_READERS,
    readerProgramFor,
    LEVEL_2_2_READS,
  ),
  ...makeThreads(
    'W',
    'Penulis',
    LEVEL_2_2_WRITERS,
    () => WRITER_PROGRAM,
    LEVEL_2_2_WRITES,
  ),
];

/** Level ini dinilai dari papan dan kunci, bukan variabel bersama; penanda ini hanya pengisi. */
const MARKER = 'selesai';

function invariant(snap: Snapshot): { ok: boolean; message: string } {
  if (snap.threads.some((t) => t.state !== 'TERMINATED')) {
    return {
      ok: false,
      message: 'Simulasi berhenti sebelum semua robot selesai.',
    };
  }
  if (snap.inconsistentReadCount > 0) {
    return {
      ok: false,
      message: `Ada ${snap.inconsistentReadCount} bacaan data setengah jadi.`,
    };
  }
  if (snap.writeConflictCount > 0) {
    return {
      ok: false,
      message: `Ada ${snap.writeConflictCount} penulisan yang bertabrakan.`,
    };
  }
  const limit = snap.starvationTicks ?? null;
  if (limit !== null) {
    const names = new Map(snap.threads.map((t) => [t.id, t.label]));
    // Hanya penulis yang dinilai: konsep level ini adalah penulis kelaparan
    // di bawah reader priority. Pembaca menunggu penulis itu wajar.
    const starved = Object.entries(snap.peakWaitStreaks ?? {})
      .filter(([id, streak]) => id.startsWith('W') && streak >= limit)
      .map(([id]) => names.get(id) ?? id);
    if (starved.length > 0) {
      return {
        ok: false,
        message: `${starved.join(', ')} menunggu terlalu lama (kelaparan, batas ${limit} tick).`,
      };
    }
  }
  return {
    ok: true,
    message:
      'Tidak ada data setengah jadi, tidak ada tabrakan, dan semua penulis mendapat giliran.',
  };
}

export const level2_2: LevelDefinition = {
  id: '2-2',
  module: 2,
  title: 'Papan Pengumuman',
  ...LEVEL_2_2_CONTENT,
  layoutId: '2-2',
  threads: LEVEL_2_2_THREADS,
  sharedVars: { [MARKER]: 0 },
  resources: [
    { kind: 'board', id: LEVEL_2_2_BOARD, label: 'Papan Pengumuman' },
    {
      kind: 'rwlock',
      id: LEVEL_2_2_LOCK,
      policy: 'reader',
      label: 'Kunci Papan',
    },
  ],
  availableTools: ['rwlock'],
  scheduler: {
    kind: 'random',
    cores: LEVEL_2_2_READERS + LEVEL_2_2_WRITERS,
  },
  tutorialSeed: LEVEL_2_2_TUTORIAL_SEED,
  maxTicks: 1000,
  starvationTicks: LEVEL_2_2_STARVATION_TICKS,
  goal: {
    target: { variable: MARKER, value: 0 },
    invariant,
    // Diukur dari kebijakan fair pada seed 1..50: tick maks 90, total tunggu
    // maks 162. Diberi margin kecil di atasnya.
    stars: { fast: 100, lowWait: 170 },
  },
};
