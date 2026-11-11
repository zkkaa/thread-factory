/** Karakter pemandu (anggota tim). Nama berkas potret: <id>-<ekspresi>.png. */
export type CharacterId = 'aldi' | 'azka' | 'fikri' | 'rifal' | 'widad';

export interface CharacterInfo {
  id: CharacterId;
  /** Nama yang tampil di UI, mis. "Pak Aldi". */
  name: string;
}

export const CHARACTERS: Readonly<Record<CharacterId, CharacterInfo>> = {
  aldi: { id: 'aldi', name: 'Pak Aldi' },
  azka: { id: 'azka', name: 'Pak Azka' },
  fikri: { id: 'fikri', name: 'Pak Fikri' },
  rifal: { id: 'rifal', name: 'Pak Rifal' },
  widad: { id: 'widad', name: 'Bu Widad' },
};

/** Karakter di Beranda dan Layar Tamat Game, juga cadangan bila level tidak dikenal. */
export const HOME_CHARACTER: CharacterId = 'aldi';

/** Pemandu tiap level (data murni; level baru cukup menambah satu baris). */
export const LEVEL_CHARACTERS: Readonly<Record<string, CharacterId>> = {
  '1-1': 'aldi',
  '1-2': 'azka',
  '1-3': 'fikri',
  '1-4': 'rifal',
  '1-5': 'widad',
  '2-1': 'widad',
  '2-2': 'azka',
  '2-3': 'fikri',
  '2-4': 'rifal',
};

export function characterForLevel(levelId: string): CharacterId {
  return LEVEL_CHARACTERS[levelId] ?? HOME_CHARACTER;
}
