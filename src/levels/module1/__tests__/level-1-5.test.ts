import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { evaluateLevel } from '../../../controller/evaluateLevel';
import { Engine } from '../../../engine/engine';
import type { PlacedTool } from '../../../engine/tools';
import { level1_5, LEVEL_1_5_TARGET } from '../level-1-5';

const SEED = level1_5.tutorialSeed as number;
const ASSEMBLERS = level1_5.threads.filter((t) => t.id !== 'P');

const mutex: PlacedTool = {
  id: 'mutex:meja',
  kind: 'mutex',
  mutex: 'meja',
  spans: ASSEMBLERS.map((t) => ({ thread: t.id, start: 4, end: 6 })),
};

const cards = (value: number): PlacedTool => ({
  id: 'semaphore:kartu',
  kind: 'semaphore',
  sem: 'kartu',
  value,
  spans: ASSEMBLERS.map((t) => ({ thread: t.id, start: 1, end: 3 })),
});

const lamp: PlacedTool = {
  id: 'condition:lampu',
  kind: 'condition',
  cond: 'lampu',
  mutex: 'meja',
  waiter: { thread: 'P', index: 0 },
  signaler: { thread: 'R1', slot: 7 },
  spans: [],
};

function play(tools: PlacedTool[], seed = SEED) {
  const engine = new Engine();
  engine.load(buildEngineConfig(level1_5, tools), seed);
  while (!engine.isFinished) engine.step();
  const snapshot = engine.getSnapshot();
  const result = evaluateLevel(level1_5, snapshot);
  const totalWait = Object.values(result.metrics.waitTicksByThread).reduce(
    (a, b) => a + b,
    0,
  );
  return { snapshot, result, totalWait };
}

const full = (value = 2) => [cards(value), mutex, lamp];

describe('Level 1-5: alur A sampai E (T-094, T-095)', () => {
  it('data: 8 perakit, 1 pengepak, aula kapasitas 2, stok target 16', () => {
    expect(level1_5.threads).toHaveLength(9);
    expect(level1_5.areas).toEqual({ aula: 2 });
    expect(level1_5.goal.target.value).toBe(LEVEL_1_5_TARGET);
    expect(LEVEL_1_5_TARGET).toBe(16);
  });

  it('jalur benar (kartu 2, mutex, lampu): lulus pada seed tutorial', () => {
    const { snapshot, result } = play(full());
    expect(snapshot.threads.every((t) => t.state === 'TERMINATED')).toBe(true);
    expect(snapshot.sharedVars['barang']).toBe(LEVEL_1_5_TARGET);
    expect(snapshot.overloadTicks).toBe(0);
    expect(snapshot.busyWaitTicks).toBe(0);
    expect(result.ok).toBe(true);
    expect(result.stars).toBeGreaterThanOrEqual(1);
  });

  it('jalur benar tetap lulus pada banyak seed (uji sinyal hilang)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      expect(play(full(), seed).result.ok, `seed ${seed}`).toBe(true);
    }
  });

  it('kartu 1: lulus tetapi lebih lambat daripada kartu 2', () => {
    const one = play(full(1));
    const two = play(full(2));
    expect(one.result.ok).toBe(true);
    expect(one.snapshot.tick).toBeGreaterThan(two.snapshot.tick);
    expect(one.result.stars).toBeLessThanOrEqual(two.result.stars ?? 3);
  });

  it('kartu 3 sampai 8: bentrok di aula, gagal, pesan menyebut aula', () => {
    for (let value = 3; value <= 8; value++) {
      const { snapshot, result } = play(full(value));
      expect(snapshot.overloadTicks, `kartu ${value}`).toBeGreaterThan(0);
      expect(result.ok, `kartu ${value}`).toBe(false);
      expect(result.message, `kartu ${value}`).toContain('aula');
    }
  });

  it('tanpa kartu: bentrok', () => {
    const { snapshot, result } = play([mutex, lamp]);
    expect(snapshot.overloadTicks).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('tanpa mutex: stok kurang dari 16 pada seed tutorial', () => {
    const { snapshot, result } = play([cards(2), lamp]);
    expect(snapshot.sharedVars['barang']).toBeLessThan(LEVEL_1_5_TARGET);
    expect(result.ok).toBe(false);
  });

  it('tanpa lampu: busy waiting, gagal', () => {
    const { snapshot, result } = play([cards(2), mutex]);
    expect(snapshot.busyWaitTicks).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('seed lain: bintang null', () => {
    expect(play(full(), 11).result.stars).toBeNull();
  });

  it('materi: intro 3 halaman, petunjuk 3 tingkat, konsep, penjelasan', () => {
    expect(level1_5.intro).toHaveLength(3);
    expect(level1_5.hints.length).toBeGreaterThanOrEqual(3);
    expect(level1_5.hints[1]).toContain('jumlah mesin');
    expect(level1_5.concepts.length).toBeGreaterThanOrEqual(4);
    expect(level1_5.explanation?.pass).toContain('semaphore saja tidak');
  });

  // Jalankan sekali untuk mengukur ambang bintang, lalu ubah FAST dan LOW_WAIT di level-1-5.ts.
  it.skip('UKUR: tick dan total tunggu tiap nilai kartu pada seed 10', () => {
    for (let value = 1; value <= 3; value++) {
      const { snapshot, totalWait } = play(full(value));
      console.log(`kartu ${value}: tick ${snapshot.tick}, tunggu ${totalWait}`);
    }
  });
  it('bintang: kartu 2 mendapat 3 bintang, kartu 1 hanya 1 bintang', () => {
    const two = play(full(2));
    expect(two.result.stars).toBe(3);

    const one = play(full(1));
    expect(one.result.ok).toBe(true);
    expect(one.result.stars).toBe(1);
  });
});
