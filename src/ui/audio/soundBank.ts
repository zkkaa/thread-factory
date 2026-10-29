/** Nama efek suara; berkasnya ada di public/assets/audio. */
export type SoundName =
  'click' | 'lock' | 'unlock' | 'success' | 'fail' | 'star';

/** Jalur relatif terhadap halaman (sama seperti aset lain). */
export const SOUND_PATHS: Record<SoundName, string> = {
  click: 'assets/audio/click.ogg',
  lock: 'assets/audio/lock.ogg',
  unlock: 'assets/audio/unlock.ogg',
  success: 'assets/audio/success.ogg',
  fail: 'assets/audio/fail.ogg',
  star: 'assets/audio/star.ogg',
};

export const MUSIC_PATH = 'assets/audio/bgm-main.ogg';

/** Musik dibuat lebih pelan daripada efek suara pada volume utama yang sama. */
export const MUSIC_GAIN = 0.35;
