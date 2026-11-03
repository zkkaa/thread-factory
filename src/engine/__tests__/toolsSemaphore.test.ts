import { describe, it, expect } from 'vitest';
import { applyTools, applyToolsDetailed, type PlacedSemaphoreTool } from '../tools';
import type { Instruction, ThreadDef } from '../types';

function makeRobots(): ThreadDef[] {
  const program: Instruction[] = [
    { op: 'WORK', ticks: 1 },
    { op: 'ENTER_AREA', area: 'aula' },
    { op: 'WORK', ticks: 2 },
    { op: 'LEAVE_AREA', area: 'aula' },
  ];
  return [
    {
      id: 'A',
      label: 'Robot A',
      program: program.map((i) => ({ ...i })),
      repeat: 1,
    },
    {
      id: 'B',
      label: 'Robot B',
      program: program.map((i) => ({ ...i })),
      repeat: 1,
    },
  ];
}

function semaphoreTool(
  value: number,
  spans = [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
  id = 'sem-kartu',
  sem = 'kartu',
): PlacedSemaphoreTool {
  return { id, kind: 'semaphore', sem, value, spans };
}

describe('PlacedSemaphoreTool & applyTools (T-088)', () => {
  it('menyisipkan SEM_WAIT sebelum start dan SEM_SIGNAL sesudah end', () => {
    const tool = semaphoreTool(3);
    const [robotA, robotB] = applyTools(makeRobots(), [tool]);

    expect(robotA.program).toEqual([
      { op: 'WORK', ticks: 1 },
      { op: 'SEM_WAIT', sem: 'kartu' },
      { op: 'ENTER_AREA', area: 'aula' },
      { op: 'WORK', ticks: 2 },
      { op: 'LEAVE_AREA', area: 'aula' },
      { op: 'SEM_SIGNAL', sem: 'kartu' },
    ]);

    expect(robotB.program).toEqual([
      { op: 'WORK', ticks: 1 },
      { op: 'SEM_WAIT', sem: 'kartu' },
      { op: 'ENTER_AREA', area: 'aula' },
      { op: 'WORK', ticks: 2 },
      { op: 'LEAVE_AREA', area: 'aula' },
      { op: 'SEM_SIGNAL', sem: 'kartu' },
    ]);
  });

  it('merekam instruction origins dengan jenis inserted SEM_WAIT dan SEM_SIGNAL', () => {
    const tool = semaphoreTool(2);
    const { origins } = applyToolsDetailed(makeRobots(), [tool]);

    expect(origins['A']).toEqual([
      { kind: 'original', index: 0 },
      { kind: 'inserted', op: 'SEM_WAIT', slot: 1 },
      { kind: 'original', index: 1 },
      { kind: 'original', index: 2 },
      { kind: 'original', index: 3 },
      { kind: 'inserted', op: 'SEM_SIGNAL', slot: 4 },
    ]);
  });

  it('menolak nilai semaphore di luar rentang 1 sampai 8', () => {
    expect(() => applyTools(makeRobots(), [semaphoreTool(0)])).toThrow(
      'Nilai semaphore harus berupa bilangan bulat antara 1 dan 8.',
    );
    expect(() => applyTools(makeRobots(), [semaphoreTool(9)])).toThrow(
      'Nilai semaphore harus berupa bilangan bulat antara 1 dan 8.',
    );
    expect(() => applyTools(makeRobots(), [semaphoreTool(-1)])).toThrow(
      'Nilai semaphore harus berupa bilangan bulat antara 1 dan 8.',
    );
    expect(() => applyTools(makeRobots(), [semaphoreTool(2.5)])).toThrow(
      'Nilai semaphore harus berupa bilangan bulat antara 1 dan 8.',
    );
  });

  it('menerima batas bawah 1 dan batas atas 8', () => {
    expect(() => applyTools(makeRobots(), [semaphoreTool(1)])).not.toThrow();
    expect(() => applyTools(makeRobots(), [semaphoreTool(8)])).not.toThrow();
  });

  it('tidak memutasi program asli atau objek masukan', () => {
    const robots = makeRobots();
    const originalLen = robots[0].program.length;
    const tool = semaphoreTool(3);
    const result = applyTools(robots, [tool]);

    expect(robots[0].program.length).toBe(originalLen);
    expect(result[0].program.length).toBe(originalLen + 2);
  });
});
