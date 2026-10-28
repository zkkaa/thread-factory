import { describe, expect, it } from 'vitest';
import { deriveRobotFx } from '../robotFx';

describe('deriveRobotFx', () => {
  it('RUNNING menyala dan berdenyut', () => {
    expect(deriveRobotFx('RUNNING', false)).toEqual({
      glow: true,
      pulse: true,
      frozen: false,
      float: false,
    });
  });

  it('READY dibekukan dan zzz melayang', () => {
    expect(deriveRobotFx('READY', false)).toEqual({
      glow: false,
      pulse: false,
      frozen: true,
      float: true,
    });
  });

  it('kurangi animasi: efek tetap tampil tetapi tidak bergerak', () => {
    expect(deriveRobotFx('RUNNING', true)).toMatchObject({
      glow: true,
      pulse: false,
    });
    expect(deriveRobotFx('READY', true)).toMatchObject({
      frozen: true,
      float: false,
    });
  });

  it('WAITING, NEW, dan TERMINATED tanpa efek penjadwal', () => {
    for (const state of ['WAITING', 'NEW', 'TERMINATED'] as const) {
      expect(deriveRobotFx(state, false)).toEqual({
        glow: false,
        pulse: false,
        frozen: false,
        float: false,
      });
    }
  });
});