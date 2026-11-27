import { describe, expect, it } from 'vitest';
import {
  buildSharedSemaphoreTool,
  clampCards,
  readSharedSemaphore,
  semaphoreToolId,
} from '../semaphoreTool';

const THREADS = ['R1', 'R2', 'R3'];

describe('buildSharedSemaphoreTool', () => {
  it('mengubah slot masuk 1 dan keluar 4 menjadi start 1 dan end 3 untuk semua robot', () => {
    const tool = buildSharedSemaphoreTool(
      'kartu',
      THREADS,
      { entry: 1, exit: 4 },
      3,
    );
    expect(tool).toEqual({
      id: 'semaphore:kartu',
      kind: 'semaphore',
      sem: 'kartu',
      value: 3,
      spans: THREADS.map((thread) => ({ thread, start: 1, end: 3 })),
    });
  });

  it('mengembalikan null bila tidak ada gerbang', () => {
    expect(buildSharedSemaphoreTool('kartu', THREADS, null, 3)).toBeNull();
  });

  it('menolak pintu keluar sebelum pintu masuk', () => {
    expect(() =>
      buildSharedSemaphoreTool('kartu', THREADS, { entry: 3, exit: 3 }, 3),
    ).toThrow();
  });
});

describe('readSharedSemaphore', () => {
  it('membaca balik gerbang dan nilai', () => {
    const tool = buildSharedSemaphoreTool(
      'kartu',
      THREADS,
      { entry: 1, exit: 4 },
      2,
    );
    expect(readSharedSemaphore(tool)).toEqual({
      door: { entry: 1, exit: 4 },
      value: 2,
    });
  });

  it('mengembalikan null bila alat tidak ada', () => {
    expect(readSharedSemaphore(null)).toBeNull();
    expect(readSharedSemaphore(undefined)).toBeNull();
  });
});

describe('clampCards dan id', () => {
  it('membatasi ke 1..8 dan membulatkan', () => {
    expect(clampCards(0)).toBe(1);
    expect(clampCards(9)).toBe(8);
    expect(clampCards(2.6)).toBe(3);
    expect(clampCards(Number.NaN)).toBe(1);
  });

  it('id alat memuat nama semaphore', () => {
    expect(semaphoreToolId('kartu')).toBe('semaphore:kartu');
  });
});