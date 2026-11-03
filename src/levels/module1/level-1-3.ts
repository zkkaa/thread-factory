import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';

/** Program untuk setiap robot di Level 1-3. */
export const LEVEL_1_3_ROBOT_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'ENTER_AREA', area: 'aula' },
  { op: 'WORK', ticks: 3 },
  { op: 'LEAVE_AREA', area: 'aula' },
];

/** 8 robot pekerja aula Level 1-3. */
export const LEVEL_1_3_THREADS: ThreadDef[] = Array.from(
  { length: 8 },
  (_, i) => ({
    id: `R${i + 1}`,
    label: `Robot ${i + 1}`,
    program: LEVEL_1_3_ROBOT_PROGRAM.map((ins) => ({ ...ins })),
    repeat: 3,
  }),
);

/**
 * Level 1-3 (Tiga Mesin, Delapan Robot):
 * Aula pabrik memiliki 3 mesin (kapasitas 3). 8 robot berebut memakai mesin
 * dengan 8 core CPU yang berjalan berbarengan.
 * Jika pemain tidak memakai semaphore atau nilai semaphore > 3, terjadi bentrok (overload).
 * Jika nilai semaphore = 3, kapasitas aula termanfaatkan maksimal tanpa bentrok.
 * Jika nilai semaphore < 3, tidak ada bentrok tetapi utilisasi mesin rendah.
 */
export const level1_3: LevelDefinition = {
  id: '1-3',
  module: 1,
  title: 'Tiga Mesin, Delapan Robot',
  intro: [
    {
      mood: 'netral',
      text:
        'Selamat datang di Aula Mesin, Mandor! Di sini kita punya 3 mesin bubut, ' +
        'tetapi ada 8 robot pekerja yang siap masuk bersamaan dengan 8 core.',
    },
    {
      mood: 'berpikir',
      text:
        'Kalau lebih dari 3 robot masuk ke aula secara bersamaan, listrik pabrik ' +
        'akan korsleting dan mesin mengalami BENTROK (overload). Jangan biarkan ' +
        'hal itu terjadi!',
    },
    {
      mood: 'senang',
      text:
        'Gunakan Kartu Akses (Counting Semaphore) untuk membatasi jumlah robot ' +
        'di dalam aula. Pasang gerbang kartu di pintu aula dan atur kapasitasnya ' +
        'agar tepat 3. Selamat bekerja!',
    },
  ],
  hints: [
    'Perhatikan kapasitas aula mesin: aula hanya dapat menampung maksimal 3 robot.',
    'Bila Kartu Akses disetel lebih dari 3, robot ke-4 akan masuk dan memicu BENTROK.',
    'Bila Kartu Akses disetel 1 atau 2, mesin tidak akan bentrok tetapi beberapa mesin menganggur. Pasang nilai 3 untuk efisiensi maksimal!',
  ],
  concepts: [
    'Counting Semaphore',
    'Wait & Signal',
    'Kapasitas Resource',
    'Antrean FIFO',
  ],
  explanation: {
    pass:
      'Hebat! Kartu akses dengan kapasitas 3 memastikan maksimal 3 robot berada di ' +
      'aula mesin pada saat yang sama. Semua mesin terpakai optimal tanpa pernah korslet.',
    fail:
      'Terjadi bentrok di dalam aula atau utilisasi mesin terlalu rendah! ' +
      'Pastikan gerbang kartu menutupi area masuk dan keluar aula serta kapasitas kartu bernilai 3.',
  },
  resultTitle: {
    pass: 'Luar Biasa! Tiga Mesin Beroperasi Optimal!',
    fail: 'Mesin Korslet / Tidak Optimal!',
  },
  layoutId: '1-3',
  threads: LEVEL_1_3_THREADS,
  sharedVars: { mesin: 3 },
  areas: { aula: 3 },
  resources: [
    {
      kind: 'semaphore',
      id: 'kartu',
      initialValue: 3,
      label: 'Kartu Akses Aula',
    },
  ],
  availableTools: ['semaphore'],
  scheduler: { kind: 'random', cores: 8 },
  tutorialSeed: 10,
  maxTicks: 2000,
  goal: {
    target: { variable: 'mesin', value: 3 },
    invariant: (snap) => {
      if (snap.overloadTicks > 0) {
        return {
          ok: false,
          message: `Terjadi ${snap.overloadTicks} kali bentrok (overload) di aula mesin!`,
        };
      }
      return {
        ok: true,
        message: 'Semua robot selesai bekerja tanpa ada bentrok di aula mesin.',
      };
    },
    // Ambang batas bintang untuk Level 1-3
    stars: { fast: 60, lowWait: 80 },
  },
};
