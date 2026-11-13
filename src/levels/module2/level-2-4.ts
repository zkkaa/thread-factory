import type { LevelDefinition } from '../types';
import type { Snapshot } from '../../engine/types';
import { LEVEL_2_4_CONTENT } from './level-2-4.content';

/**
 * Level 2-4: Lini Produksi Penuh (Kombinasi Ban + Papan + Meja Teknisi).
 * Ketiga masalah klasik berjalan bersamaan dengan anggaran alat terbatas.
 * Pemain harus memilih kombinasi pengaman yang tepat dalam batas koin.
 */
export const level2_4: LevelDefinition = {
  id: '2-4',
  module: 2,
  title: 'Lini Produksi Penuh',
  ...LEVEL_2_4_CONTENT,
  layoutId: '2-4',
  threads: [
    {
      id: 'P',
      label: 'Perakit',
      program: [
        { op: 'WORK', ticks: 2 },
        { op: 'ENTER_AREA', area: 'ban' },
        { op: 'WORK', ticks: 2 },
        { op: 'LEAVE_AREA', area: 'ban' },
      ],
      repeat: 2,
    },
    {
      id: 'W',
      label: 'Penggudang',
      program: [
        { op: 'WORK', ticks: 2 },
        { op: 'ENTER_AREA', area: 'ban' },
        { op: 'WORK', ticks: 2 },
        { op: 'LEAVE_AREA', area: 'ban' },
      ],
      repeat: 2,
    },
    {
      id: 'C',
      label: 'Pengepak',
      program: [
        { op: 'WORK', ticks: 2 },
        { op: 'ENTER_AREA', area: 'ban' },
        { op: 'WORK', ticks: 2 },
        { op: 'LEAVE_AREA', area: 'ban' },
      ],
      repeat: 2,
    },
  ],
  sharedVars: { total: 0 },
  resources: [
    { kind: 'mutex', id: 'meja', label: 'Kunci' },
    { kind: 'semaphore', id: 'ban', label: 'Semaphore Ban', initialValue: 3 },
    { kind: 'condition', id: 'papan', label: 'Lampu Sinyal', mutex: 'meja' },
  ],
  availableTools: ['mutex', 'semaphore', 'condition', 'rwlock'],
  toolBudget: 4,
  scheduler: { kind: 'random', cores: 5 },
  tutorialSeed: 42,
  maxTicks: 800,
  areas: {
    ban: 3,
  },
  goal: {
    target: { variable: 'total', value: 15 },
    invariant: (snap: Snapshot) => {
      const allTerminated = snap.threads.every(
        (t: { state: string }) => t.state === 'TERMINATED',
      );
      if (!allTerminated) {
        return {
          ok: false,
          message: 'Simulasi belum selesai (mungkin deadlock atau melewati batas tick).',
        };
      }
      return {
        ok: true,
        message: 'Semua area selesai dengan baik.',
      };
    },
    stars: { fast: 200, lowWait: 100 },
  },
};