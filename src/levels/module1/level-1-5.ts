import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';

export const LEVEL_1_5_ROBOTS = 8;
export const LEVEL_1_5_ROUNDS = 2;
export const LEVEL_1_5_TARGET = LEVEL_1_5_ROBOTS * LEVEL_1_5_ROUNDS;
export const LEVEL_1_5_CAPACITY = 2;

/** PROVISIONAL: ukur dulu (lihat tes "UKUR" di level-1-5.test.ts). */
const FAST = 85;
const LOW_WAIT = 350;

/** Perakit: A (WORK) -> B (aula) -> C (papan stok). */
export const LEVEL_1_5_ASSEMBLER_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'ENTER_AREA', area: 'aula' },
  { op: 'WORK', ticks: 2 },
  { op: 'LEAVE_AREA', area: 'aula' },
  { op: 'READ', from: 'barang', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'barang' },
];

/** Pengepak: menunggu barang (D), lalu mengepak. Tidak menyentuh stok. */
export const LEVEL_1_5_PACKER_PROGRAM: Instruction[] = [
  { op: 'SPIN_UNTIL', variable: 'barang', atLeast: 1 },
  { op: 'WORK', ticks: 3 },
];

export const LEVEL_1_5_THREADS: ThreadDef[] = [
  // Urutan penting: pemberi sinyal = thread pertama selain Pengepak (R1).
  ...Array.from({ length: LEVEL_1_5_ROBOTS }, (_, i) => ({
    id: `R${i + 1}`,
    label: `Robot ${i + 1}`,
    program: LEVEL_1_5_ASSEMBLER_PROGRAM.map((ins) => ({ ...ins })),
    repeat: LEVEL_1_5_ROUNDS,
  })),
  {
    id: 'P',
    label: 'Pengepak',
    program: LEVEL_1_5_PACKER_PROGRAM.map((ins) => ({ ...ins })),
    repeat: 1,
  },
];

export const level1_5: LevelDefinition = {
  id: '1-5',
  module: 1,
  title: 'Lini Gabungan',
  intro: [
    {
      mood: 'netral',
      text:
        'Delapan robot merakit produk, dua kali putaran. Tiap putaran, robot masuk ' +
        'Aula Mesin, lalu mencatat hasilnya di Papan Stok. Pengepak menunggu di ' +
        'ujung lini sampai ada barang yang siap dikepak.',
    },
    {
      mood: 'berpikir',
      text:
        `Aula hanya punya ${LEVEL_1_5_CAPACITY} mesin. Papan Stok diubah banyak robot ` +
        `dan harus berakhir tepat ${LEVEL_1_5_TARGET}. Pengepak tidak boleh terus ` +
        `mengecek barang. Bintang 1 butuh hasil benar tanpa bentrok dan tanpa busy ` +
        `waiting. Pada seed 10, bintang 2 jika selesai dalam ${FAST} tick, dan ` +
        `bintang 3 jika total waktu tunggu paling banyak ${LOW_WAIT} tick.`,
    },
    {
      mood: 'senang',
      text:
        'Ada tiga alat, urut dari kiri ke kanan: Kartu Akses untuk aula, Pintu Mutex ' +
        'untuk Papan Stok, dan Lampu Sinyal untuk Pengepak. Satu alat tidak bisa ' +
        'menggantikan yang lain. Amati dulu apa yang salah, baru pilih alatnya.',
    },
  ],
  hints: [
    'Jalankan tanpa alat dan perhatikan: mana yang bentrok, mana yang salah angka, mana yang kehabisan baterai?',
    'Bentrok di aula: Kartu Akses (samakan jumlah kartu dengan jumlah mesin). ' +
      'Salah angka di Papan Stok: Pintu Mutex. Boros baterai: Lampu Sinyal.',
    'Kartu Akses menutupi ENTER_AREA sampai LEAVE_AREA, Pintu Mutex menutupi READ sampai WRITE. ' +
      'Nyalakan Lampu Sinyal sesudah WRITE.',
  ],
  concepts: [
    'Counting semaphore dan kapasitas resource',
    'Race condition dan critical section',
    'Mutex: semaphore saja tidak cukup melindungi data',
    'Condition variable',
    'Blocking vs busy waiting',
  ],
  explanation: {
    pass:
      'Kartu Akses membatasi robot di aula sesuai jumlah mesin. Pintu Mutex menjaga ' +
      'READ, COMPUTE, dan WRITE agar tidak saling menimpa; semaphore saja tidak ' +
      'cukup karena dua robot tetap bisa menulis bersamaan. Lampu Sinyal membuat ' +
      'Pengepak tidur tanpa terus mengecek. Ketiganya saling melengkapi.',
    fail:
      'Periksa satu per satu. Bentrok di aula: nilai Kartu Akses harus sama dengan ' +
      'jumlah mesin. Stok kurang: Papan Stok butuh mutex. Baterai terkuras: ' +
      'Pengepak butuh condition variable agar tidur, bukan terus mengecek.',
  },
  resultTitle: {
    pass: 'Bagus! Lini Berjalan Serempak!',
    fail: 'Waduh, Lini Masih Bermasalah!',
  },
  layoutId: '1-5-flow',
  threads: LEVEL_1_5_THREADS,
  sharedVars: { barang: 0 },
  areas: { aula: LEVEL_1_5_CAPACITY },
  resources: [
    { kind: 'mutex', id: 'meja', label: 'Pintu Papan Stok' },
    {
      kind: 'semaphore',
      id: 'kartu',
      initialValue: LEVEL_1_5_CAPACITY,
      label: 'Kartu Akses Aula',
    },
    { kind: 'condition', id: 'lampu', mutex: 'meja', label: 'Lampu Sinyal' },
  ],
  availableTools: ['mutex', 'semaphore', 'condition'],
  scheduler: { kind: 'random', cores: 4 },
  tutorialSeed: 10,
  maxTicks: 1000,
  goal: {
    target: { variable: 'barang', value: LEVEL_1_5_TARGET },
    invariant: (snap) => {
      // Urutan: aula (bagian B), stok (C), baterai (D), agar penyebab pertama dilaporkan.
      if (snap.overloadTicks > 0) {
        return {
          ok: false,
          message:
            `Terjadi ${snap.overloadTicks} tick bentrok di aula. Jumlah kartu ` +
            'harus sama dengan jumlah mesin.',
        };
      }
      const barang = snap.sharedVars['barang'];
      if (barang !== LEVEL_1_5_TARGET) {
        return {
          ok: false,
          message: `Barang ${barang}, seharusnya ${LEVEL_1_5_TARGET}. Papan Stok butuh Pintu Mutex.`,
        };
      }
      if (snap.busyWaitTicks > 0) {
        return {
          ok: false,
          message: `Pengepak busy waiting ${snap.busyWaitTicks} tick dan baterainya terkuras.`,
        };
      }
      return {
        ok: true,
        message: 'Aula, Papan Stok, dan Pengepak sudah benar.',
      };
    },
    stars: { fast: FAST, lowWait: LOW_WAIT },
  },
};
