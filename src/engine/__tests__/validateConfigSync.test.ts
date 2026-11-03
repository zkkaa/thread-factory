import { describe, expect, it } from 'vitest';
import { Engine } from '../engine';
import { validateConfig } from '../validateConfig';
import type { EngineConfig, Instruction } from '../types';

function makeConfig(
  program: Instruction[],
  extra: Partial<EngineConfig> = {},
): EngineConfig {
  return {
    threads: [{ id: 'A', label: 'Robot A', program }],
    sharedVars: {},
    mutexes: [],
    semaphores: { kartu: 1 },
    conditions: [],
    areas: { aula: 3 },
    scheduler: { kind: 'random', cores: 1 },
    maxTicks: 100,
    ...extra,
  };
}

describe('validateConfig: semaphore dan area (T-040, T-041)', () => {
  it('menolak program yang berakhir dengan SEM_WAIT', () => {
    const config = makeConfig([
      { op: 'WORK', ticks: 1 },
      { op: 'SEM_WAIT', sem: 'kartu' },
    ]);
    expect(() => validateConfig(config)).toThrow(
      /instruksi terakhir tidak boleh SEM_WAIT/,
    );
  });

  it('program yang berakhir dengan SEM_SIGNAL sah', () => {
    const config = makeConfig([
      { op: 'SEM_WAIT', sem: 'kartu' },
      { op: 'WORK', ticks: 1 },
      { op: 'SEM_SIGNAL', sem: 'kartu' },
    ]);
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('regresi: SEM_WAIT terakhir ditolak saat load, bukan crash di tengah simulasi', () => {
    const config: EngineConfig = {
      threads: [
        {
          id: 'A',
          label: 'Robot A',
          program: [
            { op: 'SEM_WAIT', sem: 'kartu' },
            { op: 'WORK', ticks: 3 },
            { op: 'SEM_SIGNAL', sem: 'kartu' },
          ],
        },
        {
          id: 'B',
          label: 'Robot B',
          program: [{ op: 'SEM_WAIT', sem: 'kartu' }],
        },
      ],
      sharedVars: {},
      mutexes: [],
      semaphores: { kartu: 1 },
      conditions: [],
      scheduler: {
        kind: 'scripted',
        cores: 1,
        script: ['A', 'B', 'A', 'A', 'A', 'A'],
      },
      maxTicks: 50,
    };
    expect(() => new Engine().load(config, 1)).toThrow(/instruksi terakhir/);
  });

  it('menolak SEM_WAIT dan SEM_SIGNAL pada semaphore yang tidak dideklarasikan', () => {
    const wait = makeConfig([
      { op: 'SEM_WAIT', sem: 'hantu' },
      { op: 'WORK', ticks: 1 },
    ]);
    expect(() => validateConfig(wait)).toThrow(
      /semaphore "hantu" tidak dideklarasikan/,
    );
    const signal = makeConfig([
      { op: 'WORK', ticks: 1 },
      { op: 'SEM_SIGNAL', sem: 'hantu' },
    ]);
    expect(() => validateConfig(signal)).toThrow(
      /semaphore "hantu" tidak dideklarasikan/,
    );
  });

  it('menolak ENTER_AREA dan LEAVE_AREA pada area yang tidak dideklarasikan', () => {
    const enter = makeConfig([
      { op: 'ENTER_AREA', area: 'gudang' },
      { op: 'LEAVE_AREA', area: 'gudang' },
    ]);
    expect(() => validateConfig(enter)).toThrow(
      /area "gudang" tidak dideklarasikan/,
    );
    const tanpaAreas = makeConfig(
      [
        { op: 'ENTER_AREA', area: 'aula' },
        { op: 'LEAVE_AREA', area: 'aula' },
      ],
      { areas: undefined },
    );
    expect(() => validateConfig(tanpaAreas)).toThrow(/tidak dideklarasikan/);
  });

  it('menolak kapasitas area yang bukan bilangan bulat >= 1', () => {
    const program: Instruction[] = [
      { op: 'ENTER_AREA', area: 'aula' },
      { op: 'LEAVE_AREA', area: 'aula' },
    ];
    expect(() =>
      validateConfig(makeConfig(program, { areas: { aula: 0 } })),
    ).toThrow(/Kapasitas area "aula"/);
    expect(() =>
      validateConfig(makeConfig(program, { areas: { aula: 1.5 } })),
    ).toThrow(/Kapasitas area "aula"/);
  });

  it('konfigurasi lengkap dan benar lolos', () => {
    const config = makeConfig([
      { op: 'SEM_WAIT', sem: 'kartu' },
      { op: 'ENTER_AREA', area: 'aula' },
      { op: 'WORK', ticks: 2 },
      { op: 'LEAVE_AREA', area: 'aula' },
      { op: 'SEM_SIGNAL', sem: 'kartu' },
    ]);
    expect(() => validateConfig(config)).not.toThrow();
  });
});
