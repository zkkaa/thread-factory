import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';

export const LEVEL_2_1_ITEMS_PER_ROBOT = 4;
export const LEVEL_2_1_PRODUCERS = 2;
export const LEVEL_2_1_CONSUMERS = 2;
/** Total barang yang harus lewat ban. */
export const LEVEL_2_1_TOTAL_ITEMS =
  LEVEL_2_1_PRODUCERS * LEVEL_2_1_ITEMS_PER_ROBOT;
export const LEVEL_2_1_CAPACITY = 3;

/** Program asli (tanpa pengaman): producer merakit lalu menaruh, consumer mengambil lalu mengemas. */
export const PRODUCER_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'PUT_ITEM', buffer: 'ban' },
];
export const CONSUMER_PROGRAM: Instruction[] = [
  { op: 'TAKE_ITEM', buffer: 'ban' },
  { op: 'WORK', ticks: 1 },
];

function makeThreads(
  prefix: string,
  label: string,
  count: number,
  program: Instruction[],
): ThreadDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    label: `${label} ${i + 1}`,
    program: program.map((ins) => ({ ...ins })),
    repeat: LEVEL_2_1_ITEMS_PER_ROBOT,
  }));
}

export const LEVEL_2_1_THREADS: ThreadDef[] = [
  ...makeThreads('P', 'Perakit', LEVEL_2_1_PRODUCERS, PRODUCER_PROGRAM),
  ...makeThreads('C', 'Pengepak', LEVEL_2_1_CONSUMERS, CONSUMER_PROGRAM),
];

/**
 * Level 2-1 (Ban Berjalan, Producer-Consumer).
 * Tanpa pengaman, pengepak (consumer) mengambil dari ban kosong pada tick 1
 * (underflow) karena semua robot langsung berjalan di core terpisah; perakit
 * (producer) menumpuk barang hingga ban penuh (overflow).
 * Catatan penyederhanaan: PUT_ITEM dan TAKE_ITEM atomik dalam satu tick, jadi
 * mutex pelindung ban tidak mengubah hasil. Pembatas yang benar adalah
 * semaphore empty dan full.
 * TODO T-098: alat pemain untuk empty/full; sampai itu ada, availableTools kosong.
 */
export const level2_1: LevelDefinition = {
  id: '2-1',
  module: 2,
  title: 'Ban Berjalan',
  intro: [
    {
      mood: 'netral',
      text:
        'Selamat datang di ban berjalan, Mandor! Dua perakit menaruh barang di satu ujung ban, ' +
        'dua pengepak mengambilnya di ujung lain. Ban ini hanya muat 3 barang, ' +
        'sedangkan total ada 8 barang yang harus sampai ke pengepak.',
    },
    {
      mood: 'sedih',
      text:
        'Sekarang belum ada aturan, jadi kacau. Begitu mulai, pengepak langsung meraih ban yang ' +
        'masih kosong (underflow), dan kalau perakit lebih cepat, ban penuh lalu barang jatuh (overflow). ' +
        'Misimu: kedelapan barang lewat tanpa jatuh dan tanpa meraih kosong. ' +
        'Selesai cepat dan sedikit menunggu memberi bintang tambahan.',
    },
    {
      mood: 'berpikir',
      text:
        'Kuncinya dua penghitung, bukan satu kunci. "Slot Kosong" dimulai dari 3, ' +
        '"Barang Tersedia" dimulai dari 0. Perakit menunggu slot kosong sebelum menaruh, ' +
        'lalu menambah hitungan barang. Pengepak sebaliknya. Robot yang harus menunggu akan tidur, ' +
        'bukan terus mengecek.',
    },
  ],
  hints: [
    'Ada dua hal yang bisa salah di ban: menaruh barang saat ban penuh, dan mengambil barang saat ban kosong. Sebelum bertindak, tiap robot perlu bertanya: "boleh lanjut sekarang?"',
    'Tiap masalah butuh satu penghitung (semaphore): satu menghitung slot yang masih kosong, satu menghitung barang yang siap diambil.',
    'Penghitung slot kosong ("empty") dimulai dari kapasitas ban, yaitu 3. Penghitung barang ("full") dimulai dari 0 karena ban awalnya kosong.',
    'Perakit: wait(empty), taruh barang, lalu signal(full). Pengepak: wait(full), ambil barang, lalu signal(empty). Urutan "tunggu dulu, baru taruh atau ambil" tidak boleh terbalik.',
  ],
  concepts: [
    'Producer-Consumer',
    'Bounded buffer',
    'Semaphore empty dan full',
    'Overflow dan underflow',
  ],
  explanation: {
    pass:
      'Tidak ada overflow maupun underflow. Semaphore empty (Slot Kosong) membuat perakit menunggu ' +
      'saat ban penuh, dan semaphore full (Barang Tersedia) membuat pengepak menunggu saat ban kosong. ' +
      'Keduanya counting semaphore: penghitung, bukan kunci dengan satu pemilik seperti mutex. ' +
      'Robot yang menunggu tidur (WAITING), tidak terus mengecek. ' +
      'Di sistem nyata ban juga butuh mutex agar dua robot tidak mengubahnya bersamaan; ' +
      'di simulasi ini taruh dan ambil selesai dalam satu tick, jadi pembatas utamanya dua semaphore tadi.',
    fail:
      'Ban belum aman: robot menaruh barang di ban penuh (overflow), mengambil dari ban kosong ' +
      '(underflow), atau robot saling menunggu sampai simulasi macet. Pembatasnya dua semaphore: ' +
      'empty (slot kosong, nilai awal sama dengan kapasitas ban, 3) dan full (barang tersedia, ' +
      'nilai awal 0), dengan urutan tunggu dulu, baru taruh atau ambil.',
  },
  resultTitle: {
    pass: 'Bagus! Ban Lancar Jaya!',
    fail: 'Waduh, Barang Jatuh dan Tangan Kosong!',
  },
  layoutId: '2-1',
  threads: LEVEL_2_1_THREADS,
  sharedVars: { barang: 0 },
  buffers: { ban: LEVEL_2_1_CAPACITY },
  resources: [
    {
      kind: 'semaphore',
      id: 'empty',
      initialValue: LEVEL_2_1_CAPACITY,
      label: 'Slot Kosong',
    },
    {
      kind: 'semaphore',
      id: 'full',
      initialValue: 0,
      label: 'Barang Tersedia',
    },
    { kind: 'mutex', id: 'ban-lock', label: 'Kunci Ban' },
  ],
  availableTools: [],
  scheduler: { kind: 'random', cores: 4 },
  tutorialSeed: 10,
  maxTicks: 2000,
  goal: {
    // Placeholder: level ini dinilai dari ban, bukan variabel bersama.
    target: { variable: 'barang', value: 0 },
    invariant: (snap) => {
      const ban = snap.buffers[0];
      if (snap.overflowCount > 0 || snap.underflowCount > 0) {
        return {
          ok: false,
          message: `Overflow ${snap.overflowCount}x, underflow ${snap.underflowCount}x di ban.`,
        };
      }
      if (ban === undefined || ban.totalTaken !== LEVEL_2_1_TOTAL_ITEMS) {
        return {
          ok: false,
          message: `Seharusnya ${LEVEL_2_1_TOTAL_ITEMS} barang sampai di pengepak, hasilnya ${ban?.totalTaken ?? 0}.`,
        };
      }
      return {
        ok: true,
        message: 'Semua barang lewat ban tanpa jatuh atau meraih kosong.',
      };
    },
    // TODO: ukur pada seed 10 setelah T-098, lalu ganti angka perkiraan ini.
    stars: { fast: 60, lowWait: 200 },
  },
};
