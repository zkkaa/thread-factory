import { describe, expect, it } from 'vitest';
import type { SimEvent } from '../../engine/types';
import { MUSIC_GAIN } from '../audio/soundBank';
import {
  musicVolume,
  sfxVolume,
  soundForResult,
  soundsForEvents,
} from '../audio/soundMixer';

const acquired: SimEvent = {
  type: 'LOCK_ACQUIRED',
  tick: 1,
  thread: 'A',
  mutex: 'm',
};
const released: SimEvent = {
  type: 'LOCK_RELEASED',
  tick: 2,
  thread: 'A',
  mutex: 'm',
};
const other: SimEvent = {
  type: 'INSTRUCTION',
  tick: 1,
  thread: 'A',
  index: 0,
  op: 'WORK',
};

describe('volume', () => {
  it('efek mengikuti volume utama dan dibatasi 0..1', () => {
    expect(sfxVolume(0.5)).toBe(0.5);
    expect(sfxVolume(2)).toBe(1);
    expect(sfxVolume(-1)).toBe(0);
  });

  it('musik lebih pelan daripada efek', () => {
    expect(musicVolume(1)).toBeCloseTo(MUSIC_GAIN);
    expect(musicVolume(0.5)).toBeCloseTo(0.5 * MUSIC_GAIN);
    expect(musicVolume(3)).toBeCloseTo(MUSIC_GAIN);
  });
});

describe('soundsForEvents', () => {
  it('kunci dipegang membunyikan lock, dilepas membunyikan unlock', () => {
    expect(soundsForEvents([acquired])).toEqual(['lock']);
    expect(soundsForEvents([released])).toEqual(['unlock']);
  });

  it('handoff dalam satu notifikasi: unlock lalu lock, masing-masing sekali', () => {
    expect(soundsForEvents([released, acquired, released, acquired])).toEqual([
      'unlock',
      'lock',
    ]);
  });

  it('event lain diabaikan', () => {
    expect(soundsForEvents([other])).toEqual([]);
    expect(soundsForEvents([])).toEqual([]);
  });
});

describe('soundForResult', () => {
  it('lulus membunyikan success, gagal membunyikan fail', () => {
    expect(soundForResult(true)).toBe('success');
    expect(soundForResult(false)).toBe('fail');
  });
});
