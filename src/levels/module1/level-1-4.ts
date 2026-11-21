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
  { op: 'READ', from: 'barang', into: 'n' },
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
        'Sekarang bagian pengepakan, Mandor. Robot perakit menaruh 3 barang di meja. ' +
        'Robot pengepak baru boleh mulai setelah ketiga barang itu ada.',
    },
    {
      mood: 'sedih',
      text:
       'Tanpa pengaman, pengepak akan terus-menerus melirik meja sambil bertanya, ' +
        '"Sudah ada belum? Sudah ada belum?" Dia sibuk, tapi tidak menghasilkan ' +
        'apa-apa, dan baterainya terkuras. Ini disebut busy waiting. Misi berhasil ' +
        'jika barang di meja 3, pengepak mengepak setelah barang cukup, dan waktu ' +
        'busy waiting tidak lebih dari 10 tick.',
    },
    {
      mood: 'senang',
      text:
     'Alatmu adalah Lampu Sinyal, seperti bel panggilan. Pengepak tidur dulu, dan ' +
      'perakit menyalakan lampu setelah barang ketiga siap. Kunci Meja sudah ' +
      'dipasang otomatis. Tentukan di mana lampu dinyalakan, lalu lihat meter ' +
      'baterai Pengepak.',
    },
  ],

  hints: [
   'Lihat meter baterai pengepak. Apa yang dia lakukan selama menunggu barang?',
    'Terus-menerus mengecek meja disebut busy waiting: tenaga terpakai padahal ' +
    'belum ada yang bisa dikerjakan. Dengan Lampu Sinyal, pengepak bisa tidur ' +
    'sampai dibangunkan.',
   'Pasang Lampu Sinyal di robot perakit, tepat sesudah barang ketiga ditulis ' +
    'ke meja. Kalau lampu menyala terlalu awal, pengepak bangun padahal barang ' +
    'belum cukup.',
  ],

  concepts: ['Condition variable', 'Menunggu dengan tidur vs busy waiting'],

  explanation: {
    pass:
      'Robot pengepak menunggu menggunakan Lampu Sinyal (condition variable), ' +
      'sehingga tidak perlu terus-menerus mengecek meja dan menggunakan core. ' +
      'Saat menunggu, robot melepas Pintu Mutex. Ketika bangun, robot mengambil ' +
      'mutex kembali sebelum memeriksa jumlah barang. Condition variable tidak ' +
      'menggantikan mutex. Sinyal hanya membangunkan robot yang menunggu, ' +
      'sedangkan jumlah barang tetap harus diperiksa kembali.',

    fail:
      'Tanpa menggunakan Lampu Sinyal, robot pengepak akan terus mengecek meja ' +
      'meskipun barang belum cukup. Hal ini membuat core terpakai sia-sia ' +
      '(busy waiting). Jika sinyal dikirim sebelum barang mencapai 3, robot ' +
      'pengepak bisa bangun terlalu cepat. Gunakan condition variable bersama ' +
      'mutex dan kirim sinyal setelah robot perakit menulis barang ketiga.',
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
      const seen = snap.threads.find((t) => t.id === 'P')?.registers['n'];
      if (seen === undefined || seen < 3) {
        return {
          ok: false,
          message:
            `Pengepak bangun saat barang baru ${seen ?? 0}, padahal ia ` +
            'butuh 3. Lampu harus menyala SESUDAH barang cukup.',
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
    stars: { fast: 45, lowWait: 45 },
  },
};
