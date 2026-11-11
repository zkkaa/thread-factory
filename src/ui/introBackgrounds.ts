/**
 * Latar layar Intro Level (S4) per level. Datanya dipisah dari komponen
 * supaya level baru cukup menambah satu baris di sini.
 * Jalur relatif terhadap halaman, sama seperti mandorPortraits.ts.
 * Level tanpa entri khusus memakai latar arena umum (DEFAULT_INTRO_BACKGROUND).
 */

/** Latar arena umum untuk level yang belum punya latar intro sendiri. */
export const DEFAULT_INTRO_BACKGROUND = 'assets/world/bg-intro-1-1.jpg';

export const INTRO_BACKGROUNDS: Readonly<Record<string, string>> = {
  '1-1': 'assets/world/bg-intro-1-1.jpg',
};

/** Jalur latar untuk `levelId`; level tanpa entri khusus memakai latar arena umum. */
export function introBackgroundFor(levelId: string): string {
  return INTRO_BACKGROUNDS[levelId] ?? DEFAULT_INTRO_BACKGROUND;
}
