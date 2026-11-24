import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';

/** Program untuk setiap robot di Level 1-3. */
export const LEVEL_1_3_ROBOT_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'ENTER_AREA', area: 'aula' },
  { op: 'WORK', ticks: 3 },
  { op: 'LEAVE_AREA', area: 'aula' },
];

/** 8 robot pekerja aula Level 1-3. */
export const LEVEL_1_3_THREADS: ThreadDef[] = Array.from(
  { length: 8 },
  (_, i) => ({
    id: `R${i + 1}`,
    label: `Robot ${i + 1}`,
    program: LEVEL_1_3_ROBOT_PROGRAM.map((ins) => ({ ...ins })),
    repeat: 3,
  }),
);

/**
 * Level 1-3 (Tiga Mesin, Delapan Robot):
 * Aula pabrik memiliki 3 mesin (kapasitas 3). 8 robot berebut memakai mesin
 * dengan 8 core CPU yang berjalan berbarengan.
 * Jika pemain tidak memakai semaphore atau nilai semaphore > 3, terjadi bentrok (overload).
 * Jika nilai semaphore = 3, kapasitas aula termanfaatkan maksimal tanpa bentrok.
 * Jika nilai semaphore < 3, tidak ada bentrok tetapi utilisasi mesin rendah
 * sehingga bintangnya lebih sedikit.
 */
export const level1_3: LevelDefinition = {
  id: '1-3',
  module: 1,
  title: 'Tiga Mesin, Delapan Robot',
  intro: [
    {
      mood: 'netral',
      text:
        'Selamat datang di Aula Mesin! Hari ini 8 robot ingin masuk ke aula sekaligus. ' +
        'Tapi aula hanya punya 3 mesin, jadi paling banyak 3 robot boleh berada di dalam.',
    },
    {
      mood: 'berpikir',
      text:
        'Kalau lebih dari 3 robot masuk, listrik korsleting dan terjadi BENTROK. ' +
        'Jangan sampai! Pada seed 10, bintang 2 jika selesai dalam 80 tick, dan ' +
        'bintang 3 jika total waktu tunggu paling banyak 170 tick.',
    },
    {
      mood: 'senang',
      text:
        'Alatmu adalah Kartu Akses (counting semaphore): jumlah kartu ' +
        'menentukan berapa robot boleh berada di dalam aula. Pasang gerbang ' +
        'kartu dari pintu masuk sampai pintu keluar aula, lalu coba beberapa ' +
        'jumlah kartu dan bandingkan hasilnya. Selamat bekerja!',
    },
  ],
  hints: [
    'Aula hanya muat 3 robot. Itu batas amannya.',
    'Kalau kartu lebih dari 3, robot ke-4 ikut masuk dan terjadi BENTROK.',
    'Kalau kartu hanya 1 atau 2, tidak ada bentrok, tapi ada mesin yang menganggur. ' +
      'Coba nilai 3.',
  ],
  concepts: ['Counting semaphore', 'Antrean'],
  explanation: {
    pass:
      'Tidak ada bentrok karena Kartu Akses membatasi jumlah robot yang masuk ' +
      'sesuai kapasitas aula. Kapasitas 3 sesuai dengan jumlah mesin, sehingga ' +
      'ketiga mesin bisa digunakan secara bersamaan tanpa mengalami overload. ' +
      'Dengan begitu, pekerjaan berjalan lebih efisien.',
    fail:
      'Terjadi bentrok: lebih dari 3 robot berada di aula mesin pada saat yang ' +
      'sama. Pasang gerbang Kartu Akses yang menutupi masuk dan keluar aula ' +
      '(dari ENTER_AREA sampai LEAVE_AREA), lalu setel kapasitasnya tidak ' +
      'lebih dari 3.',
    partial:
      'Tidak ada bentrok: Kartu Akses berhasil mencegah bentrok karena ' +
      'membatasi jumlah robot yang masuk ke aula. Namun, kapasitas yang ' +
      'digunakan terlalu kecil dibandingkan jumlah mesin. Akibatnya, beberapa ' +
      'mesin menganggur, pekerjaan menjadi lebih lama, dan bintangmu berkurang.',
  },
  resultTitle: {
    pass: 'Bagus! Aula Aman dari Bentrok!',
    fail: 'Waduh, Mesin Korslet!',
  },
  layoutId: '1-3',
  threads: LEVEL_1_3_THREADS,
  sharedVars: { mesin: 3 },
  areas: { aula: 3 },
  resources: [
    {
      kind: 'semaphore',
      id: 'kartu',
      initialValue: 3,
      label: 'Kartu Akses Aula',
    },
  ],
  availableTools: ['semaphore'],
  scheduler: { kind: 'random', cores: 8 },
  tutorialSeed: 10,
  maxTicks: 2000,
  goal: {
    target: { variable: 'mesin', value: 3 },
    invariant: (snap) => {
      if (snap.overloadTicks > 0) {
        return {
          ok: false,
          message: `Terjadi ${snap.overloadTicks} kali bentrok (overload) di aula mesin!`,
        };
      }
      return {
        ok: true,
        message: 'Semua robot selesai bekerja tanpa ada bentrok di aula mesin.',
      };
    },
    // Diukur pada seed tutorial 10 (gerbang menutupi ENTER_AREA sampai LEAVE_AREA):
    //   kapasitas 1: tick 146, total tunggu 808 -> 1 bintang
    //   kapasitas 2: tick 74,  total tunggu 328 -> 2 bintang
    //   kapasitas 3: tick 50,  total tunggu 160 -> 3 bintang
    //   kapasitas 4 sampai 8 dan tanpa gerbang: bentrok -> gagal
    stars: { fast: 80, lowWait: 170 },
  },
  resultQuote: {
    stars1:
      'Tidak ada bentrok, aman! Tapi masih ada mesin yang menganggur. ' +
      'Coba tambah jumlah Kartu Akses.',
    stars2:
      'Hampir pas! Aula sudah cukup sibuk. Hitung lagi: ada berapa mesin ' +
      'yang benar-benar tersedia?',
    stars3:
      'Sempurna! Jumlah Kartu Akses sama dengan jumlah mesin. Tidak ada ' +
      'bentrok dan tidak ada mesin yang menganggur.',
  },
};
