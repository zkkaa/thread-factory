import type { Instruction, Snapshot, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';
import { LEVEL_2_2_CONTENT } from './level-2-2.content';

export const LEVEL_2_2_READERS = 4;
export const LEVEL_2_2_WRITERS = 2;
export const LEVEL_2_2_READS = 6;
export const LEVEL_2_2_WRITES = 3;
export const LEVEL_2_2_BOARD = 'papan';
export const LEVEL_2_2_LOCK = 'kunci-papan';

/** Seed tutorial: harus seed yang membuat tanpa pengaman ada bacaan setengah jadi. Ukur dengan tes INFO. */
export const LEVEL_2_2_TUTORIAL_SEED = 1;

export const READER_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'BOARD_READ', board: LEVEL_2_2_BOARD },
  { op: 'WORK', ticks: 1 },
];

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
  program: Instruction[],
  repeat: number,
): ThreadDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    label: `${label} ${i + 1}`,
    program: program.map((ins) => ({ ...ins })),
    repeat,
  }));
}

export const LEVEL_2_2_THREADS: ThreadDef[] = [
  ...makeThreads('R', 'Pembaca', LEVEL_2_2_READERS, READER_PROGRAM, LEVEL_2_2_READS),
  ...makeThreads('W', 'Penulis', LEVEL_2_2_WRITERS, WRITER_PROGRAM, LEVEL_2_2_WRITES),
];

/** Level ini dinilai dari papan dan kunci, bukan variabel bersama; penanda ini hanya pengisi. */
const MARKER = 'selesai';

function invariant(snap: Snapshot): { ok: boolean; message: string } {
  if (snap.threads.some((t) => t.state !== 'TERMINATED')) {
    return { ok: false, message: 'Simulasi berhenti sebelum semua robot selesai.' };
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
    const starved = Object.entries(snap.peakWaitStreaks ?? {})
      .filter(([, streak]) => streak >= limit)
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
    message: 'Tidak ada data setengah jadi, tidak ada tabrakan, dan semua mendapat giliran.',
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
    { kind: 'rwlock', id: LEVEL_2_2_LOCK, policy: 'reader', label: 'Kunci Papan' },
  ],
  availableTools: ['rwlock'],
  scheduler: { kind: 'random', cores: LEVEL_2_2_READERS + LEVEL_2_2_WRITERS },
  tutorialSeed: LEVEL_2_2_TUTORIAL_SEED,
  maxTicks: 1000,
  // PLACEHOLDER: ukur dengan tes INFO.
  starvationTicks: 10,
  goal: {
    target: { variable: MARKER, value: 0 },
    invariant,
    // PLACEHOLDER: ukur dengan tes INFO pada kebijakan fair.
    stars: { fast: 120, lowWait: 200 },
  },
};