import { describe, expect, it, vi } from 'vitest';
import { Engine } from '../../engine/engine';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import type { Clock } from '../clock';
import { compareStates } from '../compareMetrics';
import { CompareSession } from '../CompareSession';
import { SimulationController } from '../SimulationController';

/** Jam palsu yang dipakai bersama: satu advance() menjalankan semua peminta frame. */
class SharedClock implements Clock {
  private next = 1;
  private callbacks = new Map<number, (time: number) => void>();
  requestFrame(callback: (time: number) => void): number {
    const handle = this.next++;
    this.callbacks.set(handle, callback);
    return handle;
  }
  cancelFrame(handle: number): void {
    this.callbacks.delete(handle);
  }
  advance(time: number): void {
    const due = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of due) callback(time);
  }
}

const MUTEX: PlacedTool = {
  id: 'pintu-papan',
  kind: 'mutex',
  mutex: 'papan',
  spans: [
    { thread: 'A', start: 1, end: 3 },
    { thread: 'B', start: 1, end: 3 },
  ],
};

function makeSession(clock: Clock = new SharedClock()) {
  return new CompareSession(
    new SimulationController(new Engine(), clock),
    new SimulationController(new Engine(), clock),
  );
}

function runWithClock(session: CompareSession, clock: SharedClock) {
  session.setSpeed(5);
  session.run();
  let time = 0;
  for (let i = 0; i < 2000; i++) {
    clock.advance(time);
    time += 250;
    const a = session.a.getState();
    const b = session.b.getState();
    // Selama keduanya masih berjalan, tick harus selalu sama.
    if (a.runState === 'running' && b.runState === 'running') {
      expect(a.snapshot?.tick).toBe(b.snapshot?.tick);
    }
    if (a.runState === 'finished' && b.runState === 'finished') break;
  }
}

describe('CompareSession: memuat', () => {
  it('kedua sisi memakai seed yang sama dan level yang sama', () => {
    const session = makeSession();
    session.load({ level: level1_1 });
    expect(session.a.getState().seed).toBe(level1_1.tutorialSeed);
    expect(session.b.getState().seed).toBe(session.a.getState().seed);
    expect(session.b.getState().level?.id).toBe('1-1');
  });

  it('seed eksplisit berlaku untuk keduanya', () => {
    const session = makeSession();
    session.load({ level: level1_1 }, { level: level1_1 }, 42);
    expect(session.a.getState().seed).toBe(42);
    expect(session.b.getState().seed).toBe(42);
    expect(session.getSeed()).toBe(42);
  });

  it('bintang tidak dinilai di kedua sisi', () => {
    const clock = new SharedClock();
    const session = makeSession(clock);
    session.load({ level: level1_1 });
    session.b.placeTool(MUTEX);
    runWithClock(session, clock);
    expect(session.a.getState().result?.stars).toBeNull();
    expect(session.b.getState().result?.stars).toBeNull();
  });
});

describe('CompareSession: serempak dan identik', () => {
  it('konfigurasi identik menghasilkan hasil identik dan tick serempak', () => {
    const clock = new SharedClock();
    const session = makeSession(clock);
    session.load({ level: level1_1 });
    runWithClock(session, clock);
    const a = session.a.getState();
    const b = session.b.getState();
    expect(a.runState).toBe('finished');
    expect(b.runState).toBe('finished');
    expect(a.snapshot?.tick).toBe(b.snapshot?.tick);
    expect(a.snapshot?.sharedVars).toEqual(b.snapshot?.sharedVars);
    expect(a.result?.ok).toBe(b.result?.ok);
    const summary = session.getSummary();
    expect(summary?.complete).toBe(true);
    expect(summary?.rows.every((row) => row.better === 'sama')).toBe(true);
  });

  it('step maju satu tick di kedua sisi', () => {
    const session = makeSession();
    session.load({ level: level1_1 });
    session.step();
    session.step();
    expect(session.a.getState().snapshot?.tick).toBe(2);
    expect(session.b.getState().snapshot?.tick).toBe(2);
  });
});

describe('CompareSession: konfigurasi berbeda', () => {
  it('tanpa alat gagal, dengan mutex lulus pada seed tutorial', () => {
    const clock = new SharedClock();
    const session = makeSession(clock);
    session.load({ level: level1_1 });
    session.b.placeTool(MUTEX);
    runWithClock(session, clock);
    const summary = session.getSummary();
    expect(summary?.okA).toBe(false);
    expect(summary?.okB).toBe(true);
    const violations = summary?.rows.find((row) => row.key === 'violations');
    expect(violations).toBeDefined();
  });
});

describe('CompareSession: perintah dan siklus hidup', () => {
  it('reset dengan seed baru menyamakan kedua sisi dan mengosongkan hasil', () => {
    const session = makeSession();
    session.load({ level: level1_1 });
    session.step();
    session.reset(7);
    expect(session.a.getState().seed).toBe(7);
    expect(session.b.getState().seed).toBe(7);
    expect(session.a.getState().snapshot?.tick).toBe(0);
    expect(session.b.getState().snapshot?.tick).toBe(0);
  });

  it('setSpeed dan pause diteruskan ke keduanya', () => {
    const session = makeSession();
    session.load({ level: level1_1 });
    session.setSpeed(5);
    session.run();
    session.pause();
    expect(session.a.getState().speed).toBe(5);
    expect(session.b.getState().speed).toBe(5);
    expect(session.a.getState().runState).toBe('paused');
    expect(session.b.getState().runState).toBe('paused');
  });

  it('subscribe dipanggil saat salah satu sisi berubah dan berhenti setelah unsubscribe', () => {
    const session = makeSession();
    const listener = vi.fn();
    const off = session.subscribe(listener);
    session.load({ level: level1_1 });
    expect(listener).toHaveBeenCalled();
    off();
    listener.mockClear();
    session.step();
    expect(listener).not.toHaveBeenCalled();
  });

  it('dispose menghentikan notifikasi', () => {
    const session = makeSession();
    const listener = vi.fn();
    session.subscribe(listener);
    session.dispose();
    session.a.loadLevel(level1_1);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('compareStates', () => {
  it('null bila salah satu sisi belum dimuat', () => {
    const a = new SimulationController();
    const b = new SimulationController();
    expect(compareStates(a.getState(), b.getState())).toBeNull();
  });
});