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
        'core, dua meja kerja Si Penjadwal, jadi kedua robot benar-benar bisa ' +
        'bekerja bersamaan. Misinya masih sama: stok akhir harus tepat 10.',
    },
    {
      mood: 'berpikir',
      text:
        'Bedanya, pintu kali ini boleh dipasang di mana saja, bahkan sebelum ' +
        'merakit. Pintu yang terlalu besar membuat robot lain menunggu di depan ' +
        'pintu, dan satu core jadi menganggur. Datanya tetap benar, tetapi ' +
        'pabrik jadi lambat. Bintang kedua untuk selesai cepat, bintang ketiga ' +
        'untuk waktu tunggu yang sedikit.',
    },
    {
      mood: 'netral',
      text:
        'Coba dulu tanpa pintu, lalu pasang pintu yang menutupi semuanya dan ' +
        'catat total tick-nya. Setelah itu coba pintu yang hanya menjaga bagian ' +
        'yang menyentuh papan. Bandingkan hasilnya. Selamat bekerja!',
    },
  ],
  hints: [
    'Jalankan dulu tanpa pintu. Dengan dua core, kedua robot membaca stok ' +
      'hampir bersamaan. Lihat angka akhirnya.',
    'Pintu yang menutupi seluruh jalur memang aman, tetapi merakit (WORK) tidak ' +
      'menyentuh papan. Perlukah robot lain menunggu selama robot pertama merakit?',
    'Pasang pintu masuk tepat sebelum READ dan pintu keluar tepat sesudah WRITE. ' +
      'Dengan begitu satu robot bisa merakit di luar pintu saat robot lain ' +
      'sedang menulis stok.',
  ],
  concepts: ['Granularitas lock', 'Trade-off aman vs cepat', 'Utilisasi core'],
  explanation: {
    pass:
      'Pintu yang hanya menjaga critical section (baca, hitung, tulis) membuat ' +
      'data tetap benar sekaligus membiarkan robot lain merakit di luar pintu, ' +
      'sehingga kedua core tetap terpakai. Itu lock berbutir halus. Bila pintumu ' +
      'menutupi lebih dari yang perlu, data tetap benar tetapi satu core ' +
      'menganggur dan bintangmu berkurang.',
    fail:
      'Stok salah karena kedua robot berada di critical section pada saat yang ' +
      'sama, sehingga satu pembaruan tertimpa (race condition). Pastikan pintu ' +
      'menutupi seluruh bagian baca, hitung, dan tulis stok. Melindungi hanya ' +
      'sebagian dari ketiganya tidak cukup.',
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
    // SEMENTARA: diganti dengan angka hasil ukur di T-039.
    stars: { fast: 60, lowWait: 30 },
  },
};
