import type { ModuleDefinition } from './types';

/**
 * Daftar modul dan urutan levelnya (PRD bagian 9).
 * Level yang datanya belum dibuat tetap dicantumkan agar hitungan progres
 * ("x / y level") sudah benar sejak awal.
 */
export const MODULES: readonly ModuleDefinition[] = [
  {
    id: 1,
    title: 'Modul 1',
    subtitle: 'Sinkronisasi Dasar',
    description:
      'Robot-robot pabrik berebut papan stok dan mesin. Kamu belajar memasang ' +
      'pengaman agar data tetap benar tanpa membuat pabrik menjadi lambat.',
    concepts: [
      'Race condition',
      'Critical section',
      'Mutex',
      'Granularitas lock',
      'Counting semaphore',
      'Condition variable',
      'Blocking vs busy waiting',
    ],
    levelIds: ['1-1', '1-2', '1-3', '1-4', '1-5'],
  },
  {
    id: 2,
    title: 'Modul 2',
    subtitle: 'Masalah Klasik Konkurensi',
    description:
      'Tiga masalah klasik yang menjebak banyak sistem: ban berjalan yang ' +
      'penuh atau kosong, papan pengumuman yang membuat penulis kelaparan, ' +
      'dan teknisi yang saling menunggu selamanya.',
    concepts: [
      'Producer-Consumer dan bounded buffer',
      'Readers-Writers',
      'Starvation',
      'Dining Philosophers',
      'Deadlock dan kondisi Coffman',
    ],
    levelIds: ['2-1', '2-2', '2-3', '2-4'],
  },
];

/** Seluruh id level dalam urutan main (modul 1 lalu modul 2). */
export const LEVEL_ORDER: readonly string[] = MODULES.flatMap(
  (moduleDef) => moduleDef.levelIds,
);

export function findModuleById(id: number): ModuleDefinition | undefined {
  return MODULES.find((moduleDef) => moduleDef.id === id);
}

/** Modul yang memuat level tertentu, atau undefined bila id tidak dikenal. */
export function findModuleOfLevel(
  levelId: string,
): ModuleDefinition | undefined {
  return MODULES.find((moduleDef) => moduleDef.levelIds.includes(levelId));
}
