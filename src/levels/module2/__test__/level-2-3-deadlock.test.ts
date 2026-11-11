import { describe, it, expect } from 'vitest';
import { Engine } from '../../../engine/engine';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { level2_3 } from '../level-2-3';

function runToEnd(engine: Engine): void {
  let guard = 0;
  while (!engine.isFinished && guard++ < 2000) {
    engine.step();
  }
}

describe('Level 2-3: Meja Teknisi - Deadlock Detection (T-056)', () => {
  it('tanpa strategi: deadlock terdeteksi pada seed tutorial', () => {
    const engine = new Engine();
    engine.load(buildEngineConfig(level2_3, []), level2_3.tutorialSeed ?? 10);
    runToEnd(engine);

    const snap = engine.getSnapshot();

    // Simulasi harus berhenti karena deadlock (bukan semua TERMINATED)
    const terminatedCount = snap.threads.filter((t) => t.state === 'TERMINATED').length;
    expect(terminatedCount).toBeLessThan(5); // Tidak semua teknisi selesai

    const waitingCount = snap.threads.filter((t) => t.state === 'WAITING').length;
    expect(waitingCount).toBe(5); // Semua 5 teknisi menunggu

    // Evaluasi level harus gagal
    const result = evaluateLevel(level2_3, snap);
    expect(result.ok).toBe(false);
  });

  it('tanpa strategi: deadlock terdeteksi pada banyak seed', () => {
    let deadlockDetected = 0;
    let completed = 0;

    for (let seed = 1; seed <= 50; seed++) {
      const engine = new Engine();
      engine.load(buildEngineConfig(level2_3, []), seed);
      runToEnd(engine);

      const snap = engine.getSnapshot();
      const terminatedCount = snap.threads.filter((t) => t.state === 'TERMINATED').length;

      if (terminatedCount === 5) {
        completed++;
      } else {
        deadlockDetected++;
        const waitingCount = snap.threads.filter((t) => t.state === 'WAITING').length;
        expect(waitingCount).toBe(5);
      }
    }

    // Semua teknisi berjalan serentak: mereka mengambil kunci kiri, lalu
    // menunggu kunci kanan yang dipegang tetangganya.
    expect(deadlockDetected).toBe(50);
    expect(completed).toBe(0);
    expect(deadlockDetected + completed).toBe(50);
  });

  it('engine memancarkan event DEADLOCK_DETECTED dengan siklus yang benar', () => {
    // Gunakan scripted scheduler untuk memaksa deadlock:
    // Semua teknisi ambil kiri (fork0..fork4) -> semua WAITING di kanan
    const config = buildEngineConfig(level2_3, []);
    config.scheduler = {
      kind: 'scripted',
      cores: 5,
      script: [
        'T1', 'T2', 'T3', 'T4', 'T5', // WORK (thinking)
        'T1', 'T2', 'T3', 'T4', 'T5', // Selesaikan WORK
        'T1', 'T2', 'T3', 'T4', 'T5', // Ambil kunci kiri
        'T1', 'T2', 'T3', 'T4', 'T5', // Menunggu kunci kanan -> deadlock
      ],
    };

    const engine = new Engine();
    engine.load(config, 1);

    let deadlockEvent = null;
    let guard = 0;
    while (!engine.isFinished && guard++ < 100) {
      const { events } = engine.step();
      for (const event of events) {
        if (event.type === 'DEADLOCK_DETECTED') {
          deadlockEvent = event;
        }
      }
    }

    expect(deadlockEvent).not.toBeNull();
    expect(deadlockEvent?.cycle).toHaveLength(5);
    // Siklus harus berisi T1..T5 (urutan diputar supaya ID terkecil di depan)
    expect(deadlockEvent?.cycle.sort()).toEqual(['T1', 'T2', 'T3', 'T4', 'T5']);
  });
});