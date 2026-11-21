import { describe, expect, it } from 'vitest';
import type { ThreadSnapshot } from '../../engine/types';
import { robotDetail, robotLabelLines, statusLabel } from '../robotLabel';

function thread(patch: Partial<ThreadSnapshot> = {}): ThreadSnapshot {
  return {
    id: 'A',
    label: 'Perakit',
    state: 'RUNNING',
    pc: 0,
    iteration: 0,
    registers: {},
    waitingOn: null,
    workRemaining: 0,
    waitTicks: 0,
    busyWaitTicks: 0,
    ...patch,
  };
}

describe('robotLabelLines', () => {
  it('mode ringkas hanya satu baris nama dan status', () => {
    expect(robotLabelLines(thread(), 3, true)).toEqual(['Perakit · RUNNING']);
  });

  it('mode lengkap sama dengan label lama (tanpa regresi Level 1-1)', () => {
    expect(
      robotLabelLines(thread({ registers: { r: 3 }, waitTicks: 2 }), 5, false),
    ).toEqual([
      'Perakit · RUNNING',
      'Produk 1/5 · tunggu 2',
      'catatan: r = 3',
    ]);
  });

  it('menampilkan sumber yang ditunggu, bukan catatan', () => {
    const lines = robotLabelLines(
      thread({ state: 'WAITING', waitingOn: 'mutex:meja', registers: { r: 1 } }),
      3,
      false,
    );
    expect(lines[2]).toBe('menunggu mutex:meja');
  });

  it('putaran penuh saat TERMINATED', () => {
    expect(
      robotLabelLines(thread({ state: 'TERMINATED', iteration: 2 }), 3, false)[1],
    ).toBe('Produk 3/3 · tunggu 0');
  });
});

describe('statusLabel dan robotDetail', () => {
  it('READY diberi penanda zzz agar tidak hanya warna', () => {
    expect(statusLabel(thread({ state: 'READY' }))).toBe('READY (zzz)');
  });

  it('detail kartu menggabungkan baris selain nama', () => {
    expect(robotDetail(thread({ registers: { r: 1 }, waitTicks: 4 }), 3)).toBe(
      'Produk 1/3 · tunggu 4 · catatan: r = 1',
    );
  });
});