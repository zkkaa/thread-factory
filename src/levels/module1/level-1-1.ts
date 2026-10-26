import type { LevelDefinition } from '../types';
import type { Instruction, ThreadDef } from '../../engine/types';

/**
 * Program robot untuk Level 1-1 (Bug Papan Stok).
 * Tiap robot:
 * 1. WORK (merakit selama 1 tick)
 * 2. READ stok ke register 'r'
 * 3. COMPUTE 'r' + 1
 * 4. WRITE register 'r' ke stok
 */
export const LEVEL_1_1_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'READ', from: 'stok', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'stok' },
];

/**
 * Dua robot (A dan B), masing-masing merakit 5 produk (repeat = 5).
 */
export const LEVEL_1_1_THREADS: ThreadDef[] = [
  {
    id: 'A',
    label: 'Robot A',
    program: LEVEL_1_1_PROGRAM,
    repeat: 5,
  },
  {
    id: 'B',
    label: 'Robot B',
    program: LEVEL_1_1_PROGRAM,
    repeat: 5,
  },
];

export const level1_1: LevelDefinition = {
  id: '1-1',
  module: 1,
  title: 'Bug Papan Stok',
  intro:
    'Halo Mandor baru! Dua robot kita (Robot A dan Robot B) masing-masing merakit 5 produk. ' +
    'Setelah merakit satu produk, mereka mencatatnya di Papan Stok. ' +
    'Seharusnya total akhir adalah 10 produk. Tapi kenapa angkanya sering kurang dari 10? ' +
    'Pasang Pintu Mutex pada Papan Stok agar mereka tidak saling mendahului!',
  explanation: {
    pass:
      'Mutex menjamin mutual exclusion: hanya satu robot yang boleh berada di critical section ' +
      '(baca stok, tambah, tulis stok) pada satu waktu. Robot lain menunggu di depan pintu ' +
      '(WAITING) sampai pintu dilepas, sehingga tidak ada pembaruan yang hilang. ' +
      'Harganya adalah waktu tunggu.',
    fail:
      'Ini race condition: kedua robot bisa membaca angka stok yang sama sebelum salah satunya ' +
      'menulis. Tulisan yang datang belakangan menimpa yang lebih dulu, sehingga satu pembaruan ' +
      'hilang (lost update). Bagian baca-hitung-tulis adalah critical section dan harus dijaga ' +
      'dengan mutex agar hanya satu robot yang memasukinya pada satu waktu.',
  },
  threads: LEVEL_1_1_THREADS,
  sharedVars: {
    stok: 0,
  },
  resources: [
    {
      kind: 'mutex',
      id: 'papan',
      label: 'Pintu Papan Stok',
    },
  ],
  availableTools: ['mutex'],
  scheduler: {
    kind: 'random',
    cores: 1,
  },
  tutorialSeed: 10,
  maxTicks: 2000,
  goal: {
    target: { variable: 'stok', value: 10 },
    invariant: (snap) => {
      const actual = snap.sharedVars.stok;
      if (actual === 10) {
        return {
          ok: true,
          message:
            'Target tercapai! Stok akhir tepat 10 tanpa pembaruan hilang.',
        };
      }
      return {
        ok: false,
        message: `Stok akhir bernilai ${actual}, seharusnya 10. Terjadi pembaruan hilang (race condition)!`,
      };
    },
    stars: {
      fast: 60,
      lowWait: 25,
    },
  },
};
