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
        'Mandor, lihat ban berjalan ini! Dua perakit menaruh barang di satu ujung, ' +
        'dua pengepak mengambilnya di ujung lain. Ban hanya muat 3 barang.',
    },
    {
      mood: 'sedih',
      text:
        'Tanpa aturan, perakit tetap menaruh barang saat ban penuh sehingga barang ' +
        'jatuh (overflow), dan pengepak meraih ban kosong (underflow).',
    },
    {
      mood: 'berpikir',
      text:
        'Kita butuh dua penghitung: satu untuk slot kosong, satu untuk slot berisi. ' +
        'Perakit menunggu slot kosong, pengepak menunggu barang. Semua 8 barang harus lewat tanpa masalah.',
    },
  ],
  hints: [
    'Ada dua hal yang bisa salah: menaruh barang di ban penuh, dan mengambil dari ban kosong.',
    'Setiap masalah butuh satu penghitung (semaphore): satu menghitung slot kosong, satu menghitung barang yang tersedia.',
    'Semaphore "empty" dimulai dari kapasitas ban (3) dan "full" dimulai dari 0. Perakit: wait(empty) lalu signal(full). Pengepak: wait(full) lalu signal(empty).',
  ],
  concepts: [
    'Producer-Consumer',
    'Bounded buffer',
    'Semaphore empty dan full',
    'Overflow dan underflow',
  ],
  explanation: {
    pass:
      'Tidak ada overflow maupun underflow: semaphore empty membuat perakit menunggu ' +
      'saat ban penuh, dan semaphore full membuat pengepak menunggu saat ban kosong. ' +
      'Robot yang menunggu tidur (WAITING), tidak terus mengecek.',
    fail:
      'Terjadi overflow atau underflow: robot menaruh barang di ban penuh atau mengambil ' +
      'dari ban kosong. Pembatasnya adalah dua semaphore: empty (slot kosong) dan full ' +
      '(barang tersedia).',
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
