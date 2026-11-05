import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';

/**
 * Batas tick busy waiting yang masih dianggap hemat. Kapasitas baterai bawaan
 * 20 tick (engine/metrics.ts); di atas batas ini baterai pengepak lebih dari
 * setengah terkuras.
 */
export const LEVEL_1_4_BUSY_WAIT_LIMIT = 10;

/** Perakit: merakit satu kloter 3 barang, lalu menaruhnya di meja. */
export const LEVEL_1_4_ASSEMBLER_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 18 },
  { op: 'READ', from: 'barang', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 3 },
  { op: 'WRITE', reg: 'r', to: 'barang' },
];

/**
 * Pengepak (program awal): menunggu sambil terus mengecek meja (busy waiting),
 * lalu mengepak. Lampu Sinyal (T-091) akan menggantinya dengan tidur.
 */
export const LEVEL_1_4_PACKER_PROGRAM: Instruction[] = [
  { op: 'SPIN_UNTIL', variable: 'barang', atLeast: 3 },
  { op: 'WORK', ticks: 3 },
];

export const LEVEL_1_4_THREADS: ThreadDef[] = [
  {
    id: 'A',
    label: 'Perakit',
    program: LEVEL_1_4_ASSEMBLER_PROGRAM.map((ins) => ({ ...ins })),
    repeat: 1,
  },
  {
    id: 'P',
    label: 'Pengepak',
    program: LEVEL_1_4_PACKER_PROGRAM.map((ins) => ({ ...ins })),
    repeat: 1,
  },
];

/**
 * Level 1-4 (Lampu Sinyal): pengepak baru boleh bekerja setelah ada minimal
 * 3 barang di meja. Tanpa sinyal, ia terus mengecek (busy waiting): core
 * terpakai sia-sia dan baterainya terkuras. Dengan Lampu Sinyal (condition
 * variable) ia tidur sampai dibangunkan.
 * `cores: 2` agar perakit dan pengepak berjalan bersamaan; dengan satu core,
 * pengecekan pengepak akan memperlambat perakit dan sinyal bisa terlambat.
 */
export const level1_4: LevelDefinition = {
  id: '1-4',
  module: 1,
  title: 'Lampu Sinyal',
  intro: [
    {
      mood: 'netral',
      text:
        'Sekarang giliran lini pengepakan, Mandor! Perakit menaruh barang di ' +
        'meja, dan Pengepak baru boleh bekerja setelah ada minimal 3 barang.',
    },
    {
      mood: 'sedih',
      text:
        'Masalahnya, Pengepak tidak sabaran. Ia berdiri di meja dan mengecek ' +
        'terus tanpa henti. Core terpakai untuk mengecek saja, dan baterainya ' +
        'cepat habis. Itu namanya busy waiting.',
    },
    {
      mood: 'senang',
      text:
        'Pasang Lampu Sinyal (condition variable) pada Pengepak. Ia akan ' +
        'tidur (zzz) sampai Perakit menyalakan lampu hijau. Misimu: hasil ' +
        'benar dan baterai Pengepak tetap hemat.',
    },
  ],
  hints: [
    'Perhatikan meter baterai Pengepak. Apa yang ia lakukan selama menunggu barang?',
    'Mengecek terus-menerus disebut busy waiting: core terpakai padahal belum ada pekerjaan. Lebih baik thread tidur sampai dibangunkan.',
    'Pasang Lampu Sinyal pada Pengepak: ia tidur sampai Perakit memberi sinyal bahwa barang sudah cukup.',
  ],
  concepts: ['Condition variable', 'Blocking vs busy waiting', 'Wait & Signal'],
  explanation: {
    pass:
      'Pengepak tidur di Lampu Sinyal (condition variable) dan baru bangun ' +
      'saat Perakit memberi sinyal. Selama tidur ia berstatus WAITING dan ' +
      'tidak memakai core, jadi baterainya hemat. Condition variable selalu ' +
      'dipakai bersama mutex: Pengepak melepas mutex sebelum tidur dan ' +
      'mengambilnya lagi saat bangun.',
    fail:
      'Pengepak melakukan busy waiting: tiap tick ia mengecek meja dan ' +
      'memakai core walau barang belum cukup, sehingga baterainya terkuras. ' +
      'Pasang Lampu Sinyal agar ia tidur (blocking) sampai Perakit memberi ' +
      'sinyal.',
  },
  resultTitle: {
    pass: 'Bagus! Pengepak Hemat Baterai!',
    fail: 'Waduh, Baterai Pengepak Terkuras!',
  },
  layoutId: '1-4',
  threads: LEVEL_1_4_THREADS,
  sharedVars: { barang: 0 },
  resources: [
    { kind: 'mutex', id: 'meja', label: 'Kunci Meja' },
    { kind: 'condition', id: 'lampu', mutex: 'meja', label: 'Lampu Sinyal' },
  ],
  availableTools: ['condition'],
  scheduler: { kind: 'random', cores: 2 },
  tutorialSeed: 10,
  maxTicks: 200,
  goal: {
    target: { variable: 'barang', value: 3 },
    invariant: (snap) => {
      const barang = snap.sharedVars['barang'];
      if (barang !== 3) {
        return {
          ok: false,
          message: `Barang di meja ${barang}, seharusnya 3.`,
        };
      }
      if (snap.busyWaitTicks > LEVEL_1_4_BUSY_WAIT_LIMIT) {
        return {
          ok: false,
          message:
            `Pengepak mengecek meja ${snap.busyWaitTicks} kali sia-sia ` +
            '(busy waiting) dan baterainya terkuras.',
        };
      }
      return {
        ok: true,
        message: 'Barang lengkap dan baterai Pengepak tetap hemat.',
      };
    },
    // Hitungan tangan pada seed 10 (belum diukur; sesuaikan bila tes gagal):
    //   tanpa alat (SPIN_UNTIL): tick 24 sampai 25, busy waiting 20 sampai 21 -> gagal
    //   dengan Lampu Sinyal: tick 28, total tunggu 22, busy waiting 0 -> 3 bintang
    stars: { fast: 30, lowWait: 25 },
  },
};
