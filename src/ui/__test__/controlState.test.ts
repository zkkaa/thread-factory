import { describe, expect, it } from 'vitest';
import type { ControllerState } from '../../controller/SimulationController';
import { deriveControls } from '../controlState';

type Input = Pick<ControllerState, 'level' | 'runState' | 'error' | 'snapshot'>;

// Level dan snapshot cukup berupa objek apa pun yang non-null untuk logika ini.
const LEVEL = {} as NonNullable<ControllerState['level']>;
const SNAP = { tick: 7 } as NonNullable<ControllerState['snapshot']>;

const base: Input = {
  level: LEVEL,
  runState: 'idle',
  error: null,
  snapshot: SNAP,
};

describe('deriveControls', () => {
  it('idle: Run, Step, Reset aktif', () => {
    const v = deriveControls(base);
    expect(v.showPause).toBe(false);
    expect(v.canTogglePlay).toBe(true);
    expect(v.canStep).toBe(true);
    expect(v.canReset).toBe(true);
    expect(v.statusText).toBe('Siap · tick 7');
  });

  it('running: tombol utama jadi Pause, Step nonaktif', () => {
    const v = deriveControls({ ...base, runState: 'running' });
    expect(v.showPause).toBe(true);
    expect(v.canTogglePlay).toBe(true);
    expect(v.canStep).toBe(false);
    expect(v.status).toBe('running');
  });

  it('paused: Run dan Step aktif lagi', () => {
    const v = deriveControls({ ...base, runState: 'paused' });
    expect(v.showPause).toBe(false);
    expect(v.canTogglePlay).toBe(true);
    expect(v.canStep).toBe(true);
    expect(v.statusText).toBe('Dijeda · tick 7');
  });

  it('finished: Run dan Step nonaktif, Reset tetap aktif', () => {
    const v = deriveControls({ ...base, runState: 'finished' });
    expect(v.canTogglePlay).toBe(false);
    expect(v.canStep).toBe(false);
    expect(v.canReset).toBe(true);
    expect(v.statusText).toBe('Selesai · tick 7');
  });

  it('error: Run dan Step nonaktif, status Error, Reset tetap aktif', () => {
    const v = deriveControls({ ...base, runState: 'paused', error: 'rusak' });
    expect(v.canTogglePlay).toBe(false);
    expect(v.canStep).toBe(false);
    expect(v.canReset).toBe(true);
    expect(v.status).toBe('error');
    expect(v.statusText).toBe('Error · tick 7');
  });

  it('tanpa level: semuanya nonaktif', () => {
    const v = deriveControls({ ...base, level: null, snapshot: null });
    expect(v.canTogglePlay).toBe(false);
    expect(v.canStep).toBe(false);
    expect(v.canReset).toBe(false);
    expect(v.canChangeSeed).toBe(false);
    expect(v.statusText).toBe('Siap');
  });
});
