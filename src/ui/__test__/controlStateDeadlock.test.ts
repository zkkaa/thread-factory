import { describe, expect, it } from 'vitest';
import type { Snapshot } from '../../engine/types';
import type { LevelDefinition } from '../../levels/types';
import { deriveControls } from '../controlState';

const level = {} as LevelDefinition;

function snapshot(deadlock: string[] | null, tick = 7): Readonly<Snapshot> {
  return { tick, deadlock } as unknown as Readonly<Snapshot>;
}

describe('deriveControls: deadlock (T-058)', () => {
  it('saat macet: status Deadlock, Run dan Step mati, Rampas kunci aktif', () => {
    const view = deriveControls({
      level,
      runState: 'paused',
      error: null,
      snapshot: snapshot(['A', 'B']),
    });

    expect(view.status).toBe('deadlock');
    expect(view.statusText).toBe('Deadlock · tick 7');
    expect(view.canTogglePlay).toBe(false);
    expect(view.canStep).toBe(false);
    expect(view.canPreempt).toBe(true);
    expect(view.canReset).toBe(true);
  });

  it('tanpa deadlock: perilaku lama, Rampas kunci mati', () => {
    const view = deriveControls({
      level,
      runState: 'paused',
      error: null,
      snapshot: snapshot(null),
    });

    expect(view.status).toBe('paused');
    expect(view.canStep).toBe(true);
    expect(view.canPreempt).toBe(false);
  });

  it('snapshot lama tanpa field deadlock dianggap tidak macet', () => {
    const view = deriveControls({
      level,
      runState: 'idle',
      error: null,
      snapshot: { tick: 0 } as unknown as Readonly<Snapshot>,
    });

    expect(view.canPreempt).toBe(false);
    expect(view.canTogglePlay).toBe(true);
  });

  it('error engine mengalahkan deadlock: status Error, Rampas kunci mati', () => {
    const view = deriveControls({
      level,
      runState: 'paused',
      error: 'rusak',
      snapshot: snapshot(['A']),
    });

    expect(view.status).toBe('error');
    expect(view.canPreempt).toBe(false);
  });
});
