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
        'Halo, Mandor baru! Selamat datang di pabrik. Hari ini dua robot kita, ' +
        'Robot A dan Robot B, masing-masing merakit 5 produk. Setiap selesai ' +
        'merakit, robot membaca angka di Papan Stok, menambahnya satu, lalu ' +
        'menulis angka baru itu kembali ke papan.',
    },
    {
      mood: 'berpikir',
      text:
        'Misimu: stok akhir harus tepat 10. Tapi kadang angkanya kurang dari 10, ' +
        'padahal tidak ada produk yang hilang. Jalankan dulu tanpa pengaman dan ' +
        'perhatikan apa yang terjadi. Bintang pertama untuk hasil yang benar, ' +
        'bintang kedua untuk selesai cepat, dan bintang ketiga untuk waktu ' +
        'tunggu robot yang sedikit.',
    },
    {
      mood: 'netral',
      text:
        'Alat kita adalah Pintu Mutex. Seret pintu masuk ke celah di jalur robot, ' +
        'lalu seret pintu keluarnya ke celah sesudahnya. Bagian jalur di antara ' +
        'kedua pintu hanya boleh dimasuki satu robot pada satu waktu; robot lain ' +
        'menunggu di depan pintu. Pikirkan bagian mana yang perlu dijaga. ' +
        'Selamat bekerja!',
    },
  ],
  hints: [
    'Jalankan dulu tanpa alat. Perhatikan catatan di tangan kedua robot: ' +
      'pernahkah mereka memegang angka yang sama?',
    'Ada tiga langkah berurutan yang saling bergantung: baca stok, tambah satu, ' +
      'tulis stok. Kalau robot lain ikut membaca sebelum robot pertama selesai ' +
      'menulis, tulisan salah satunya akan tertimpa.',
    'Pasang pintu masuk tepat sebelum READ dan pintu keluar tepat sesudah WRITE. ' +
      'Merakit (WORK) tidak menyentuh papan, jadi tidak perlu dijaga.',
  ],
  concepts: [
    'Race condition',
    'Critical section',
    'Mutual exclusion dan mutex',
  ],
  explanation: {
    pass:
      'Mutex menjamin mutual exclusion: hanya satu robot yang boleh berada di critical section ' +
      '(baca stok, tambah, tulis stok) pada satu waktu. Robot lain menunggu di depan pintu ' +
      '(WAITING) sampai pintu dilepas, sehingga tidak ada pembaruan yang hilang. ' +
      'Harganya adalah waktu tunggu.',
    fail:
      'Ini race condition: kedua robot bisa membaca angka stok yang sama sebelum salah satunya ' +
      'menulis. Tulisan yang datang belakangan menimpa yang lebih dulu, sehingga satu pembaruan ' +
      'hilang (lost update). Bagian baca-hitung-tulis adalah critical section dan harus dijaga ' +
      'dengan mutex agar hanya satu robot yang memasukinya pada satu waktu.',
  },
  layoutId: '1-1',
  threads: LEVEL_1_1_THREADS,
  sharedVars: {
    stok: 0,
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
