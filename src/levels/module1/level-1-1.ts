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
        'Halo, Mandor baru! Selamat datang di pabrik. Hari ini dua robot kita ' +
        'masing-masing merakit 5 produk. Tiap produk selesai, robot menambah ' +
        'angka di Papan Stok sebanyak 1. Jadi akhirnya harus 10.',
    },
    {
      mood: 'berpikir',
      text:
        'Misimu: pastikan stok akhir tepat 10. Namun, terkadang jumlah stok ' +
        'kurang dari 10 karena kedua robot memperbarui angka secara bersamaan. ' +
        'Coba jalankan tanpa pengaman dan lihat apa yang terjadi. Bintang ' +
        'pertama didapat jika hasilnya benar. Pada seed 10, bintang kedua jika ' +
        'selesai dalam 60 tick dan bintang ketiga jika total waktu tunggu ' +
        'kedua robot maksimal 25 tick.',
    },
    {
      mood: 'netral',
      text:
        'Tugasmu: pasang Pintu Mutex, yaitu pintu dengan satu kunci, supaya ' +
        'hanya satu robot boleh masuk. Jalankan dulu tanpa pintu dan lihat ' +
        'kekacauannya.',
    },
  ],
  hints: [
    'Perhatikan catatan pada robot saat Step. Adakah dua robot yang memegang angka sama?',
    'Kekacauan terjadi di antara membaca dan menulis. Bagian itu yang perlu dijaga.',
    'Pasang pintu masuk sebelum READ, pintu keluar sesudah WRITE.',
  ],
  concepts: ['Race condition', 'Critical section', 'Mutex'],
  explanation: {
    pass:
      'Mutex memastikan hanya satu robot yang boleh masuk ke critical section ' +
      '(membaca, menambah, dan menulis stok) dalam satu waktu. Robot lain harus ' +
      'menunggu sampai pintu dibuka kembali. Dengan begitu, tidak ada pembaruan ' +
      'stok yang hilang. Namun, robot harus bergantian sehingga menimbulkan ' +
      'waktu tunggu.',
    fail:
      'Ini disebut race condition karena kedua robot membaca jumlah stok yang ' +
      'sama sebelum memperbaruinya. Akibatnya, salah satu perubahan bisa hilang ' +
      'karena tertimpa oleh perubahan lainnya. Oleh karena itu, proses membaca, ' +
      'menghitung, dan menulis harus dilindungi mutex agar robot melakukannya ' +
      'secara bergantian.',
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
