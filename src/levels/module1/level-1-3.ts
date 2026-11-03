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
 * Jika nilai semaphore < 3, tidak ada bentrok tetapi utilisasi mesin rendah
 * sehingga bintangnya lebih sedikit.
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
      'Tidak ada bentrok: Kartu Akses membatasi jumlah robot di aula sesuai ' +
      'kapasitasnya. Kapasitas 3 sama dengan jumlah mesin, jadi semua mesin ' +
      'terpakai tanpa pernah korslet. Kapasitas yang lebih kecil tetap aman, ' +
      'tetapi mesin menganggur dan pabrik jadi lebih lambat.',
    fail:
      'Terjadi bentrok: lebih dari 3 robot berada di aula mesin pada saat yang ' +
      'sama. Pasang gerbang Kartu Akses yang menutupi masuk dan keluar aula ' +
      '(dari ENTER_AREA sampai LEAVE_AREA), lalu setel kapasitasnya tidak ' +
      'lebih dari 3.',
  },
  resultTitle: {
    pass: 'Bagus! Aula Aman dari Bentrok!',
    fail: 'Waduh, Mesin Korslet!',
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
    // Diukur pada seed tutorial 10 (gerbang menutupi ENTER_AREA sampai LEAVE_AREA):
    //   kapasitas 1: tick 146, total tunggu 808 -> 1 bintang
    //   kapasitas 2: tick 74,  total tunggu 328 -> 2 bintang
    //   kapasitas 3: tick 50,  total tunggu 160 -> 3 bintang
    //   kapasitas 4 sampai 8 dan tanpa gerbang: bentrok -> gagal
    stars: { fast: 80, lowWait: 170 },
  },
};
