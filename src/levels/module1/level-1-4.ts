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
        'Sekarang kita mengurus lini pengepakan, Mandor. Perakit membuat satu ' +
        'kloter berisi 3 barang di meja. Pengepak baru boleh mulai bekerja ' +
        'setelah jumlah barang di meja mencapai 3.',
    },
    {
      mood: 'sedih',
      text:
        'Tanpa pengaman, Pengepak mengecek meja terus-menerus. Core terpakai ' +
        'untuk mengecek padahal belum ada pekerjaan; inilah busy waiting. ' +
        'Lulus bila barang tetap berjumlah 3, Pengepak membaca sedikitnya 3, ' +
        'dan busy waiting tidak lebih dari 10 tick.',
    },
    {
      mood: 'senang',
      text:
        'Pasang Lampu Sinyal (condition variable) untuk menidurkan Pengepak ' +
        'saat menunggu. Perakit menyalakan lampu setelah menaruh barang. ' +
        'Gunakan bersama Pintu Mutex dan kirim sinyal setelah jumlahnya 3. ' +
        'Pada seed 10, bintang pertama perlu memenuhi misi, bintang kedua ' +
        'selesai paling lama 32 tick, dan bintang ketiga total waktu tunggu ' +
        'paling banyak 25 tick.',
    },
  ],
  hints: [
    'Perhatikan meter baterai Pengepak. Apa yang ia lakukan selama menunggu barang?',
    'Mengecek terus-menerus disebut busy waiting: core terpakai padahal belum ada pekerjaan. Condition variable membuat Pengepak tidur; saat menunggu, ia melepas mutex dan mengambilnya lagi ketika bangun.',
    'Gunakan condition variable bersama Pintu Mutex. Pasang penunggu pada Pengepak dan sinyal pada Perakit setelah WRITE yang membuat jumlah barang menjadi 3. Setelah bangun, periksa lagi syaratnya; sinyal terlalu awal dapat membangunkan Pengepak sebelum barang cukup.',
  ],
  concepts: ['Condition variable', 'Blocking vs busy waiting', 'Wait & Signal'],
  explanation: {
    pass:
      'Pengepak menunggu pada Lampu Sinyal (condition variable), sehingga ' +
      'berstatus WAITING dan tidak memakai core untuk mengecek meja. Saat ' +
      'menunggu, ia melepas Pintu Mutex; ketika bangun, ia mengambil mutex ' +
      'kembali sebelum memeriksa jumlah barang. Condition variable bukan ' +
      'pengganti mutex: sinyal membangunkan penunggu, sedangkan syarat jumlah ' +
      'barang tetap harus diperiksa.',
    fail:
      'Tanpa menunggu pada Lampu Sinyal, Pengepak melakukan busy waiting: ia ' +
      'terus mengecek meja dan memakai core walau barang belum cukup. Jika ' +
      'sinyal dikirim sebelum jumlah barang mencapai 3, Pengepak juga dapat ' +
      'bangun terlalu awal. Gunakan condition variable bersama mutex dan ' +
      'kirim sinyal setelah Perakit menulis barang ketiga.',
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
