import type { LevelDefinition } from '../types';
import type { Instruction, ThreadDef } from '../../engine/types';

/**
 * Program robot untuk Level 1-1 (Bug Papan Stok).
 * Tiap robot:
 * 1. WORK (merakit selama 1 tick)
 * 2. READ stok ke register 'r'
 * 3. COMPUTE 'r' + 1
 * 4. WRITE register 'r' ke stok
 */
export const LEVEL_1_1_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'READ', from: 'stok', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'stok' },
];

/**
 * Dua robot (A dan B), masing-masing merakit 5 produk (repeat = 5).
 */
export const LEVEL_1_1_THREADS: ThreadDef[] = [
  {
    id: 'A',
    label: 'Robot A',
    program: LEVEL_1_1_PROGRAM,
    repeat: 5,
  },
  {
    id: 'B',
    label: 'Robot B',
    program: LEVEL_1_1_PROGRAM,
    repeat: 5,
  },
];

export const level1_1: LevelDefinition = {
  id: '1-1',
  module: 1,
  title: 'Bug Papan Stok',
  intro: [
    {
      mood: 'netral',
      text:
        'Halo, Mandor baru! Selamat datang di pabrik. Dua robot kita masing-masing ' +
        'merakit 5 produk. Tiap satu produk selesai, robot menambah angka di Papan ' +
        'Stok sebanyak 1. Jadi di akhir, angkanya harus 10.',
    },
    {
      mood: 'berpikir',
      text:
        'Masalahnya, kadang angka akhir kurang dari 10. Bayangkan dua orang mencatat saldo di ' +
        'buku yang sama pada saat bersamaan. Keduanya melihat angka 5, keduanya menulis 6, ' +
        'padahal seharusnya 7. Satu tambahan hilang! Coba jalankan dulu tanpa pengaman dan lihat ' +
        'sendiri. Bintang 1: stok akhir tepat 10. Pada seed 10, bintang 2 jika selesai dalam 60 tick, dan ' +
        'bintang 3 jika total waktu tunggu kedua robot maksimal 25 tick.',
    },
    {
      mood: 'netral',
      text:
        'Alatmu adalah Pintu Mutex: pintu dengan satu kunci, seperti bilik toilet. ' +
        'Kalau ada yang di dalam, yang lain antre di luar. Pasang pintunya di bagian ' +
        'yang menyentuh Papan Stok, lalu jalankan lagi.',
    },
  ],
  hints: [
     'Tekan Step pelan-pelan dan lihat catatan di tangan robot. Adakah dua robot ' +
      'yang memegang data angka yang sama?',
      'Kekacauan terjadi di antara membaca angka dan menuliskannya kembali. ' +
        'Bagian itu yang perlu dijaga.',
      'Pasang pintu masuk sebelum READ dan pintu keluar sesudah WRITE.'
  ],
  concepts: ['Race condition', 'Critical section', 'Mutex'],
  explanation: {
    pass:
       'Pintu Mutex membuat hanya satu robot yang boleh mengurus Papan Stok pada satu ' +
      'waktu. Bagian yang dijaga itu disebut critical section. Robot lain menunggu ' +
      'giliran, jadi tidak ada tambahan yang hilang. Harganya: robot harus antre, ' +
      'sehingga ada waktu tunggu.',
    fail:
      'Ini disebut race condition. Kedua robot membaca angka stok yang sama, lalu ' +
      'masing-masing menulis hasilnya, sehingga satu tambahan tertimpa dan hilang. ' +
      'Bagian membaca, menambah, dan menulis harus dikerjakan satu robot dulu sampai ' +
      'selesai. Lindungi bagian itu dengan mutex.',
  },
  layoutId: '1-1',
  threads: LEVEL_1_1_THREADS,
  sharedVars: {
    stok: 0,
  },
  resultTitle: {
    pass: 'Bagus! Sinkronisasi Berhasil!',
    fail: 'Waduh, Stok Salah!',
  },
  resources: [
    {
      kind: 'mutex',
      id: 'papan',
      label: 'Pintu Papan Stok',
    },
  ],
  availableTools: ['mutex'],
  scheduler: {
    kind: 'random',
    cores: 1,
  },
  tutorialSeed: 10,
  maxTicks: 2000,
  goal: {
    target: { variable: 'stok', value: 10 },
    invariant: (snap) => {
      const actual = snap.sharedVars.stok;
      if (actual === 10) {
        return {
          ok: true,
          message:
            'Target tercapai! Stok akhir tepat 10 tanpa pembaruan hilang.',
        };
      }
      return {
        ok: false,
        message: `Stok akhir bernilai ${actual}, seharusnya 10. Terjadi pembaruan hilang (race condition)!`,
      };
    },
    stars: {
      fast: 60,
      lowWait: 25,
    },
  },
};
