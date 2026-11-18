import type { LevelDefinition } from '../types';
import { LEVEL_1_1_THREADS } from './level-1-1';

/**
 * Level 1-2 (Pintu Kebesaran): program robot sama dengan Level 1-1, tetapi
 * scheduler memakai 2 core. Dengan 1 core, besar pintu tidak mengubah total
 * tick (selalu ada robot yang bisa jalan); dengan 2 core, pintu yang terlalu
 * besar membuat satu core menganggur sehingga pabrik melambat.
 */
export const level1_2: LevelDefinition = {
  id: '1-2',
  module: 1,
  title: 'Pintu Kebesaran',
  intro: [
    {
      mood: 'netral',
      text:
        'Kerja bagus, Mandor! Papan Stok sudah aman. Sekarang pabrik punya dua ' +
        'core atau tempat kerja, sehingga kedua robot bisa bekerja bersamaan. ' +
        'Misimu masih sama, yaitu memastikan stok akhir tepat 10.',
    },
    {
      mood: 'berpikir',
      text:
        'Bedanya, pintu kali ini bisa dipasang di bagian mana saja, bahkan ' +
        'sebelum proses perakitan. Jika pintu terlalu besar, robot lain harus ' +
        'menunggu dan satu core bisa menganggur. Data tetap benar, tetapi ' +
        'pekerjaan menjadi lebih lambat. Pada seed 10, bintang kedua didapat ' +
        'jika selesai dalam 45 tick dan bintang ketiga jika total waktu tunggu ' +
        'maksimal 25 tick.',
    },
    {
      mood: 'netral',
      text:
        'Coba jalankan tanpa pintu, lalu pasang pintu yang menutupi seluruh ' +
        'proses dan catat total langkahnya. Setelah itu, coba pasang pintu ' +
        'yang hanya melindungi bagian yang berhubungan dengan papan stok. ' +
        'Bandingkan hasilnya. Selamat bekerja!',
    },
  ],
  hints: [
    'Jalankan tanpa pintu terlebih dahulu. Dengan dua core, kedua robot bisa membaca stok hampir bersamaan. Perhatikan hasil akhirnya.',
    'Pintu yang melindungi seluruh proses memang aman. Namun, proses merakit (WORK) tidak berhubungan dengan papan stok. Jadi, apakah robot lain perlu menunggu saat robot pertama sedang merakit?',
    'Pasang pintu masuk sebelum READ dan pintu keluar setelah WRITE. Dengan begitu, satu robot tetap bisa merakit di luar pintu saat robot lain sedang memperbarui stok.',
  ],
  concepts: ['Ukuran kunci (granularitas lock)', 'Aman versus cepat'],
  explanation: {
    pass:
      'Pintu Mutex hanya melindungi critical section (proses membaca, ' +
      'menghitung, dan menulis stok). Dengan begitu, robot lain tetap bisa ' +
      'merakit produk di luar pintu. Kedua core dapat bekerja secara bersamaan ' +
      'sehingga pekerjaan selesai lebih cepat dan waktu tunggu lebih sedikit. ' +
      'Cara ini disebut lock berbutir halus.',
    fail:
      'Stok menjadi salah karena kedua robot mengakses dan mengubah stok secara ' +
      'bersamaan. Akibatnya, salah satu perubahan tertimpa (race condition). ' +
      'Pastikan pintu melindungi seluruh proses membaca, menghitung, dan ' +
      'menulis stok. Jika hanya sebagian proses yang dilindungi, masalah tetap ' +
      'bisa terjadi.',
    partial:
      'Pintu Mutex yang melindungi critical section (membaca, menghitung, dan ' +
      'menulis stok) membuat data tetap aman. Namun, jika pintu dipasang ' +
      'terlalu luas, robot lain harus menunggu lebih lama dan salah satu core ' +
      'bisa menganggur, sehingga bintangmu berkurang. Pintu yang hanya ' +
      'melindungi bagian yang menyentuh papan (lock berbutir halus) membuat ' +
      'robot lain tetap bisa merakit di luar pintu.',
  },
  resultTitle: {
    pass: 'Bagus! Pintunya Pas!',
    fail: 'Waduh, Stok Salah Lagi!',
  },
  layoutId: '1-2',
  threads: LEVEL_1_1_THREADS,
  sharedVars: { stok: 0 },
  resources: [{ kind: 'mutex', id: 'papan', label: 'Pintu Papan Stok' }],
  availableTools: ['mutex'],
  scheduler: { kind: 'random', cores: 2 },
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
    // Diukur pada seed tutorial 10: pintu pas [1, 3] selesai tick 42 (wait 20);
    // pintu terlalu besar [0, 3] selesai tick 51 (wait 37) karena satu core menganggur.
    stars: { fast: 45, lowWait: 25 },
  },
};
