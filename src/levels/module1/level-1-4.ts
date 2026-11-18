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
        'Sekarang kita mengurus bagian pengepakan, Mandor. Robot perakit akan ' +
        'menyiapkan 3 barang di atas meja. Robot pengepak baru boleh mulai ' +
        'bekerja setelah semua 3 barang tersedia.',
    },
    {
      mood: 'sedih',
      text:
        'Tanpa pengaman, robot pengepak akan terus-menerus mengecek meja. ' +
        'Akibatnya, core terpakai hanya untuk mengecek barang, padahal belum ' +
        'ada yang bisa dikemas. Kondisi ini disebut busy waiting. Misi berhasil ' +
        'jika jumlah barang tetap 3, robot pengepak membaca minimal 3 barang, ' +
        'dan waktu busy waiting tidak lebih dari 10 tick.',
    },
    {
      mood: 'senang',
      text:
        'Pasang Lampu Sinyal (condition variable) agar robot pengepak bisa ' +
        'menunggu tanpa terus-menerus mengecek meja. Robot perakit akan ' +
        'menyalakan lampu setelah meletakkan barang. Gunakan bersama Pintu ' +
        'Mutex dan kirim sinyal setelah jumlah barang mencapai 3. Pada seed ' +
        'ke 10, bintang pertama didapat jika misi berhasil, bintang kedua jika ' +
        'selesai maksimal dalam 32 tick, dan bintang ketiga jika total ' +
        'waktu tunggu maksimal 25 tick.',
    },
  ],

  hints: [
    'Perhatikan meter baterai robot pengepak. Apa yang dilakukannya saat menunggu barang?',
    'Terus-menerus mengecek meja disebut busy waiting. Hal ini membuat core terpakai meskipun belum ada pekerjaan. Condition variable membuat robot pengepak bisa tidur saat menunggu dan mengambil kembali mutex ketika bangun.',
    'Gunakan condition variable bersama Pintu Mutex. Atur robot pengepak untuk menunggu dan robot perakit untuk mengirim sinyal setelah jumlah barang mencapai 3. Setelah bangun, robot pengepak harus memeriksa kembali apakah barang sudah cukup. Jika sinyal dikirim terlalu awal, robot bisa bangun sebelum barang tersedia.',
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
    stars: { fast: 32, lowWait: 25 },
  },
};
