import { describe, expect, it } from 'vitest';
import { createAudioPlayer, type AudioLike } from '../audio/audioPlayer';
import { MUSIC_GAIN, MUSIC_PATH, SOUND_PATHS } from '../audio/soundBank';

interface FakeAudio extends AudioLike {
  src: string;
  plays: number;
  pauses: number;
}

function setup() {
  const created: FakeAudio[] = [];
  const player = createAudioPlayer((src) => {
    const audio: FakeAudio = {
      src,
      volume: 1,
      loop: false,
      plays: 0,
      pauses: 0,
      play() {
        audio.plays += 1;
      },
      pause() {
        audio.pauses += 1;
      },
    };
    created.push(audio);
    return audio;
  });
  return { player, created };
}

describe('efek suara', () => {
  it('memutar berkas yang tepat dengan volume utama', () => {
    const { player, created } = setup();
    player.setVolume(0.6);
    player.playSfx('lock');
    expect(created).toHaveLength(1);
    expect(created[0]?.src).toBe(SOUND_PATHS.lock);
    expect(created[0]?.volume).toBeCloseTo(0.6);
    expect(created[0]?.plays).toBe(1);
  });

  it('volume 0: tidak ada suara dan tidak ada elemen yang dibuat', () => {
    const { player, created } = setup();
    player.setVolume(0);
    player.playSfx('click');
    expect(created).toHaveLength(0);
  });

  it('tiap pemutaran membuat elemen baru (efek boleh tumpang tindih)', () => {
    const { player, created } = setup();
    player.playSfx('click');
    player.playSfx('click');
    expect(created).toHaveLength(2);
  });
});

describe('musik latar', () => {
  it('berulang, lebih pelan, dan hanya dibuat satu kali', () => {
    const { player, created } = setup();
    player.setVolume(1);
    player.startMusic();
    player.startMusic();
    expect(created).toHaveLength(1);
    expect(created[0]?.src).toBe(MUSIC_PATH);
    expect(created[0]?.loop).toBe(true);
    expect(created[0]?.volume).toBeCloseTo(MUSIC_GAIN);
  });

  it('mengatur volume sebelum musik dimulai tidak membuat elemen', () => {
    const { player, created } = setup();
    player.setVolume(0.5);
    expect(created).toHaveLength(0);
  });

  it('volume 0 menjeda musik dan volume naik memutarnya lagi', () => {
    const { player, created } = setup();
    player.startMusic();
    const music = created[0];
    const playsBefore = music?.plays ?? 0;
    player.setVolume(0);
    expect(music?.pauses).toBe(1);
    player.setVolume(0.8);
    expect(music?.plays).toBe(playsBefore + 1);
    expect(music?.volume).toBeCloseTo(0.8 * MUSIC_GAIN);
  });

  it('volume utama dibatasi 0..1', () => {
    const { player, created } = setup();
    player.setVolume(5);
    player.playSfx('click');
    expect(created[0]?.volume).toBe(1);
  });
});

describe('kegagalan memutar tidak mengganggu game', () => {
  it('play() yang ditolak peramban diabaikan', async () => {
    const player = createAudioPlayer(() => ({
      volume: 1,
      loop: false,
      play: () => Promise.reject(new Error('autoplay diblokir')),
      pause: () => {},
    }));
    expect(() => player.startMusic()).not.toThrow();
    expect(() => player.playSfx('click')).not.toThrow();
    await Promise.resolve();
  });

  it('play() yang melempar langsung diabaikan', () => {
    const player = createAudioPlayer(() => ({
      volume: 1,
      loop: false,
      play: () => {
        throw new Error('gagal');
      },
      pause: () => {},
    }));
    expect(() => player.playSfx('fail')).not.toThrow();
  });
});
