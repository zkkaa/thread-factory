import { describe, it, expect } from 'vitest';
import type {
  EngineConfig,
  Instruction,
  Op,
  SimEvent,
  ThreadDef,
} from '../types';

// Program satu robot pada Level 1-1 ("Bug Papan Stok"):
// merakit -> baca stok -> tambah 1 -> tulis stok.
const robotProgram: Instruction[] = [
  { op: 'WORK', ticks: 2 },
  { op: 'READ', from: 'stok', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'stok' },
];

const robotA = {
  id: 'robot-a',
  label: 'Robot A',
  program: robotProgram,
  repeat: 5,
} satisfies ThreadDef;

const robotB = { ...robotA, id: 'robot-b', label: 'Robot B' } satisfies ThreadDef;

// Contoh konfigurasi lengkap untuk engine (tanpa mutex).
const level11Config: EngineConfig = {
  threads: [robotA, robotB],
  sharedVars: { stok: 0 },
  mutexes: [],
  semaphores: {},
  conditions: [],
  scheduler: { kind: 'random', cores: 1 },
  maxTicks: 1000,
};

describe('tipe engine: contoh Level 1-1', () => {
  it('program robot terdiri dari empat instruksi berurutan', () => {
    const ops: Op[] = robotProgram.map((instruction) => instruction.op);
    expect(ops).toEqual(['WORK', 'READ', 'COMPUTE', 'WRITE']);
  });

  it('konfigurasi memuat dua thread dengan id berbeda', () => {
    const ids = level11Config.threads.map((thread) => thread.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('SimEvent dapat dipersempit berdasarkan field type', () => {
    const event: SimEvent = {
      type: 'VAR_WRITTEN',
      tick: 3,
      thread: 'robot-a',
      name: 'stok',
      oldValue: 4,
      newValue: 5,
    };

    // Di dalam cabang ini TypeScript tahu event punya oldValue dan newValue.
    if (event.type === 'VAR_WRITTEN') {
      expect(event.newValue - event.oldValue).toBe(1);
    } else {
      throw new Error('event seharusnya VAR_WRITTEN');
    }
  });
});