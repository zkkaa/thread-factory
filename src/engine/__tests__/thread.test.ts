import { describe, it, expect } from 'vitest';
import {
  createThread,
  executeInstruction,
  snapshotThread,
  transition,
  type ThreadRuntime,
} from '../thread';
import type { Instruction, ThreadDef } from '../types';

const TICK = 1;

function makeRunning(program: Instruction[], repeat?: number): ThreadRuntime {
  const def: ThreadDef = { id: 'A', label: 'Robot A', program, repeat };
  const thread = createThread(def);
  transition(thread, 'READY', TICK);
  transition(thread, 'RUNNING', TICK);
  return thread;
}

describe('transition: state machine', () => {
  it('thread baru berstatus NEW', () => {
    expect(createThread({ id: 'A', label: 'A', program: [] }).state).toBe('NEW');
  });

  it('transisi sah menghasilkan event THREAD_STATE', () => {
    const thread = createThread({ id: 'A', label: 'A', program: [] });
    expect(transition(thread, 'READY', 3)).toEqual({
      type: 'THREAD_STATE',
      tick: 3,
      thread: 'A',
      from: 'NEW',
      to: 'READY',
    });
    expect(thread.state).toBe('READY');
  });

  it('state yang sama tidak menghasilkan event', () => {
    const thread = makeRunning([{ op: 'WORK', ticks: 1 }]);
    expect(transition(thread, 'RUNNING', TICK)).toBeNull();
  });

  it('menolak transisi tidak sah', () => {
    const thread = createThread({ id: 'A', label: 'A', program: [] });
    expect(() => transition(thread, 'RUNNING', TICK)).toThrow(/tidak sah/);
    expect(() => transition(thread, 'WAITING', TICK)).toThrow(/tidak sah/);
    transition(thread, 'READY', TICK);
    transition(thread, 'RUNNING', TICK);
    transition(thread, 'TERMINATED', TICK);
    expect(() => transition(thread, 'READY', TICK)).toThrow(/tidak sah/);
  });

  it('keluar dari WAITING menghapus waitingOn', () => {
    const thread = makeRunning([{ op: 'WORK', ticks: 1 }]);
    transition(thread, 'WAITING', TICK);
    thread.waitingOn = 'mutex:papan';
    transition(thread, 'READY', TICK);
    expect(thread.waitingOn).toBeNull();
  });
});

describe('executeInstruction: READ, COMPUTE, WRITE', () => {
  it('menjalankan satu instruksi per pemanggilan dan memajukan pc', () => {
    const vars = { stok: 4 };
    const thread = makeRunning([
      { op: 'READ', from: 'stok', into: 'r' },
      { op: 'COMPUTE', reg: 'r', add: 1 },
      { op: 'WRITE', reg: 'r', to: 'stok' },
    ]);

    executeInstruction(thread, 1, vars);
    expect(thread.registers).toEqual({ r: 4 });
    expect(thread.pc).toBe(1);

    executeInstruction(thread, 2, vars);
    expect(thread.registers).toEqual({ r: 5 });
    expect(vars.stok).toBe(4); // belum ditulis

    const events = executeInstruction(thread, 3, vars);
    expect(vars.stok).toBe(5);
    expect(events).toContainEqual({
      type: 'VAR_WRITTEN',
      tick: 3,
      thread: 'A',
      name: 'stok',
      oldValue: 4,
      newValue: 5,
    });
  });

  it('selalu memancarkan event INSTRUCTION dengan indeks dan op', () => {
    const thread = makeRunning([{ op: 'READ', from: 'stok', into: 'r' }]);
    const events = executeInstruction(thread, 7, { stok: 0 });
    expect(events[0]).toEqual({
      type: 'INSTRUCTION',
      tick: 7,
      thread: 'A',
      index: 0,
      op: 'READ',
    });
  });

  it('COMPUTE sebelum READ melempar error jelas', () => {
    const thread = makeRunning([{ op: 'COMPUTE', reg: 'r', add: 1 }]);
    expect(() => executeInstruction(thread, 1, {})).toThrow(/register "r"/);
  });

  it('READ dari variabel yang tidak ada melempar error jelas', () => {
    const thread = makeRunning([{ op: 'READ', from: 'hantu', into: 'r' }]);
    expect(() => executeInstruction(thread, 1, {})).toThrow(/variabel bersama "hantu"/);
  });

  it('nama variabel bawaan objek (mis. toString) tidak dianggap ada', () => {
    const thread = makeRunning([{ op: 'READ', from: 'toString', into: 'r' }]);
    expect(() => executeInstruction(thread, 1, {})).toThrow(/tidak ada/);
  });
});

describe('executeInstruction: WORK', () => {
  it('WORK n memakan n tick sebelum pc maju', () => {
    const thread = makeRunning([
      { op: 'WORK', ticks: 3 },
      { op: 'READ', from: 'stok', into: 'r' },
    ]);
    const vars = { stok: 0 };

    executeInstruction(thread, 1, vars);
    expect(thread.pc).toBe(0);
    expect(thread.workRemaining).toBe(2);

    executeInstruction(thread, 2, vars);
    expect(thread.pc).toBe(0);
    expect(thread.workRemaining).toBe(1);

    executeInstruction(thread, 3, vars);
    expect(thread.pc).toBe(1);
    expect(thread.workRemaining).toBe(0);
  });
});

describe('executeInstruction: pengulangan dan terminasi', () => {
  it('program diulang sesuai repeat lalu thread TERMINATED', () => {
    const vars = { stok: 0 };
    const thread = makeRunning(
      [
        { op: 'READ', from: 'stok', into: 'r' },
        { op: 'COMPUTE', reg: 'r', add: 1 },
        { op: 'WRITE', reg: 'r', to: 'stok' },
      ],
      2,
    );

    for (let i = 0; i < 5; i++) executeInstruction(thread, i + 1, vars);
    expect(thread.state).toBe('RUNNING');
    expect(thread.iteration).toBe(1);

    const events = executeInstruction(thread, 6, vars);
    expect(thread.state).toBe('TERMINATED');
    expect(thread.iteration).toBe(2);
    expect(vars.stok).toBe(2);
    expect(events).toContainEqual({
      type: 'THREAD_STATE',
      tick: 6,
      thread: 'A',
      from: 'RUNNING',
      to: 'TERMINATED',
    });
  });

  it('repeat default = 1', () => {
    const thread = makeRunning([{ op: 'WORK', ticks: 1 }]);
    executeInstruction(thread, 1, {});
    expect(thread.state).toBe('TERMINATED');
  });
});

describe('executeInstruction: instruksi yang belum didukung', () => {
  it('LOCK melempar error yang menyebut tugas terkait', () => {
    const thread = makeRunning([{ op: 'LOCK', mutex: 'papan' }]);
    expect(() => executeInstruction(thread, 1, {})).toThrow(/belum didukung.*T-018/);
  });
});

describe('snapshotThread', () => {
  it('mengembalikan salinan: mengubahnya tidak memengaruhi thread', () => {
    const thread = makeRunning([{ op: 'READ', from: 'stok', into: 'r' }]);
    executeInstruction(thread, 1, { stok: 9 });
    const snap = snapshotThread(thread);
    snap.registers.r = 123;
    expect(thread.registers.r).toBe(9);
  });
});
