import { MUSIC_PATH, SOUND_PATHS, type SoundName } from './soundBank';
import { musicVolume, sfxVolume } from './soundMixer';

export interface AudioPlayer {
  playSfx(name: SoundName): void;
  /** Memulai musik latar berulang; aman dipanggil berkali-kali. */
  startMusic(): void;
  /** Volume utama 0..1 (dari pengaturan). */
  setVolume(volume: number): void;
}

/** Bagian HTMLAudioElement yang dipakai pemutar (supaya bisa diganti di tes). */
export interface AudioLike {
  volume: number;
  loop: boolean;
  play(): Promise<void> | void;
  pause(): void;
}

/** Pemutar yang tidak berbunyi; bawaan SoundContext dan dipakai di tes. */
export const SILENT_PLAYER: AudioPlayer = {
  playSfx: () => {},
  startMusic: () => {},
  setVolume: () => {},
};

/** play() bisa ditolak peramban (autoplay) atau melempar; keduanya diabaikan. */
function safePlay(audio: AudioLike): void {
  try {
    const result = audio.play();
    if (result !== undefined) result.catch(() => {});
  } catch {
    // Suara bersifat tambahan; kegagalan memutar tidak boleh mengganggu game.
  }
}

export function createAudioPlayer(
  create: (src: string) => AudioLike,
): AudioPlayer {
  let master = 1;
  let music: AudioLike | null = null;
  let wantMusic = false;

  const applyMusic = (): void => {
    if (music === null) return;
    music.volume = musicVolume(master);
    if (master <= 0) music.pause();
    else if (wantMusic) safePlay(music);
  };

  return {
    playSfx(name) {
      if (master <= 0) return;
      const audio = create(SOUND_PATHS[name]);
      audio.volume = sfxVolume(master);
      safePlay(audio);
    },
    startMusic() {
      wantMusic = true;
      if (music === null) {
        music = create(MUSIC_PATH);
        music.loop = true;
      }
      applyMusic();
    },
    setVolume(volume) {
      master = Math.min(1, Math.max(0, volume));
      applyMusic();
    },
  };
}

/** Pemutar nyata untuk peramban. Elemen Audio baru dibuat saat bunyi diputar. */
export function createBrowserAudioPlayer(): AudioPlayer {
  return createAudioPlayer((src) => new Audio(src));
}
