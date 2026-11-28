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
 * Alat pemain: dua penjaga semaphorePair (Penjaga Slot dan Penjaga Barang),
 * lihat ui/beltTool.ts.
 * Kriteria bintang (goal.stars) tampil di chip Misi dan disebut di intro
 * halaman 2; bila angkanya diubah, ubah keduanya.
 */
export const level2_1: LevelDefinition = {
  id: '2-1',
  module: 2,
  title: 'Ban Berjalan',
  intro: [
    {
      mood: 'netral',
      text:
        'Selamat datang di Modul 2, Mandor! Dua perakit di kiri menaruh barang ke ban berjalan, ' +
        'dan dua pengepak di kanan mengambilnya dari ujung satunya. ' +
        'Ban ini hanya muat 3 barang, sedangkan total ada 8 barang yang harus sampai ke pengepak.',
    },
    {
      mood: 'sedih',
      text:
        'Sekarang belum ada aturan, jadi kacau. Kalau perakit terlalu cepat, ban penuh dan barang ' +
        'jatuh (overflow). Kalau pengepak terlalu cepat, tangannya meraih ban kosong (underflow). ' +
        'Misimu: 8 barang sampai ke pengepak, tidak ada yang jatuh, dan tidak ada yang meraih kosong. ' +
        'Pada seed 10, bintang 2 jika selesai dalam 24 tick, dan bintang 3 jika total waktu tunggu ' +
        'semua robot maksimal 12 tick.',
    },
    {
      mood: 'berpikir',
      text:
        'Alatmu dua penghitung, seperti papan di gudang. Penjaga Slot untuk perakit: menghitung ' +
        'tempat kosong di ban, dan kalau sudah habis, perakit menunggu. Penjaga Barang untuk ' +
        'pengepak: menghitung barang yang siap diambil, dan kalau nol, pengepak menunggu. ' +
        'Pasang keduanya, lalu tekan Run.',
    },
  ],
  hints: [
    'Ada dua masalah: barang jatuh karena ban penuh, dan pengepak meraih ban kosong. Tanyakan pada tiap robot: kapan ia seharusnya berhenti dan menunggu?',
    'Perakit harus menunggu kalau ban penuh. Pengepak harus menunggu kalau belum ada barang di ban.',
    'Penjaga Slot mulai dari 3 karena ban punya 3 tempat kosong. Penjaga Barang mulai dari 0 karena ban masih kosong.',
    'Perakit menunggu dulu sampai ada tempat kosong, baru menaruh barang, lalu memberi kabar bahwa barang sudah ada. Pengepak melakukan hal yang sama dengan arah sebaliknya: menunggu barang, mengambil, lalu memberi kabar bahwa ada tempat kosong. Urutannya tidak boleh terbalik.',
  ],
  concepts: [
    'Producer-Consumer',
    'Bounded buffer',
    'Semaphore empty dan full',
    'Overflow dan underflow',
  ],
  explanation: {
    pass:
      'Ban aman! Tidak ada barang yang jatuh (overflow) dan tidak ada yang diambil dari ban kosong ' +
      '(underflow). Penjaga Slot membuat perakit menunggu saat ban penuh, dan Penjaga Barang ' +
      'membuat pengepak menunggu saat ban kosong. Robot yang menunggu benar-benar berhenti, ' +
      'tidak sibuk mengecek ban. Penghitung seperti ini disebut semaphore, dan pola perakit ' +
      'dan pengepak berbagi ban disebut producer-consumer. Catatan: di pabrik sungguhan ban juga ' +
      'butuh mutex agar tidak disentuh dua robot sekaligus. Di simulasi ini menaruh dan mengambil ' +
      'selesai dalam satu tick, jadi dua semaphore sudah cukup.',
    fail:
      'Ban belum aman. Mungkin barang masih jatuh karena ban penuh, pengepak masih meraih ban ' +
      'kosong, atau robot saling menunggu sampai pekerjaan berhenti. Cek apakah Penjaga Slot ' +
      'dan Penjaga Barang sudah terpasang dua-duanya.',
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
  availableTools: ['semaphorePair'],
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
    // Diukur pada seed 10 dengan kedua penjaga: 19 tick, total waitTicks 6.
    // Hanya ada satu susunan benar, jadi ★★ dan ★★★ ikut bersama ★; ambang
    // diberi sedikit ruang agar tidak rapuh.
    stars: { fast: 24, lowWait: 12 },
  },
};