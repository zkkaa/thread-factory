/**
 * Latar layar Intro Level (S4) per level. Datanya dipisah dari komponen
 * supaya level baru cukup menambah satu baris di sini.
 * Jalur relatif terhadap halaman, sama seperti mandorPortraits.ts.
 * Level tanpa entri memakai warna polos navy.
 */
export const INTRO_BACKGROUNDS: Readonly<Record<string, string>> = {
  '1-1': 'assets/world/bg-intro-1-1.jpg',
};

/** Jalur latar untuk `levelId`; null bila belum ada gambarnya. */
export function introBackgroundFor(levelId: string): string | null {
  return INTRO_BACKGROUNDS[levelId] ?? null;
}