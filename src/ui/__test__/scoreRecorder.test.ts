import { describe, expect, it } from 'vitest';
import type { ControllerState } from '../../controller/SimulationController';
import { level1_1 } from '../../levels';
import { ScoreboardStore } from '../../progress/scoreboardStore';
import { createMemoryStorage } from '../../progress/storage';
import { startScoreRecorder, type ScoreSource } from '../scoreRecorder';

type Listener = (
  state: Pick<ControllerState, 'level' | 'result' | 'seed'>,
) => void;

function fakeSource() {
  const listeners = new Set<Listener>();
  const source: ScoreSource = {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  const emit = (state: Pick<ControllerState, 'level' | 'result' | 'seed'>) => {
    for (const listener of [...listeners]) listener(state);
  };
  return { source, emit, count: () => listeners.size };
}

function resultOf(ok: boolean, stars: 0 | 1 | 2 | 3 | null, tick: number) {
  return {
    ok,
    message: '',
    stars,
    metrics: {
      tick,
      waitTicksByThread: { A: 4, B: 6 },
    },
  } as unknown as NonNullable<ControllerState['result']>;
}

describe('startScoreRecorder', () => {
  it('mencatat hasil benar dengan total tunggu semua robot', () => {
    const { source, emit } = fakeSource();
    const store = new ScoreboardStore(createMemoryStorage());
    startScoreRecorder(source, store);
    emit({ level: level1_1, seed: 10, result: resultOf(true, 2, 41) });
    expect(store.top('1-1', 10)[0]).toMatchObject({
      stars: 2,
      ticks: 41,
      waitTicks: 10,
    });
  });

  it('tidak mencatat hasil yang salah atau saat belum ada hasil', () => {
    const { source, emit } = fakeSource();
    const store = new ScoreboardStore(createMemoryStorage());
    startScoreRecorder(source, store);
    emit({ level: level1_1, seed: 10, result: resultOf(false, 0, 41) });
    emit({ level: level1_1, seed: 10, result: null });
    emit({ level: null, seed: 10, result: resultOf(true, 1, 41) });
    expect(store.getState().groups).toEqual({});
  });

  it('mencatat bintang null pada seed bukan tutorial', () => {
    const { source, emit } = fakeSource();
    const store = new ScoreboardStore(createMemoryStorage());
    startScoreRecorder(source, store);
    emit({ level: level1_1, seed: 77, result: resultOf(true, null, 55) });
    expect(store.top('1-1', 77)[0]?.stars).toBeNull();
  });

  it('objek hasil yang sama hanya diproses sekali dan berhenti setelah dilepas', () => {
    const { source, emit, count } = fakeSource();
    const store = new ScoreboardStore(createMemoryStorage());
    const stop = startScoreRecorder(source, store);
    const result = resultOf(true, 1, 41);
    emit({ level: level1_1, seed: 10, result });
    emit({ level: level1_1, seed: 10, result });
    expect(store.top('1-1', 10)).toHaveLength(1);
    stop();
    expect(count()).toBe(0);
  });
});