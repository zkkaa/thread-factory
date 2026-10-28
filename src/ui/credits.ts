/** Satu entri kredit aset atau library. */
export interface AssetCredit {
  name: string;
  source: string;
  license: string;
}

/**
 * Daftar kredit untuk layar Pengaturan (S10). Tambahkan baris di sini setiap
 * ada aset atau library baru, bersamaan dengan docs/ASSETS.md dan README
 * bagian Kredit (CLAUDE.md bagian 8). Entri Kenney menunggu U-070; verifikasi
 * lisensi di halaman paket saat mengunduh.
 */
export const ASSET_CREDITS: readonly AssetCredit[] = [
  { name: 'Phaser 3', source: 'phaser.io', license: 'MIT' },
  { name: 'React', source: 'react.dev', license: 'MIT' },
  {
    name: 'Template phaserjs/template-react-ts',
    source: 'github.com/phaserjs/template-react-ts',
    license: 'MIT',
  },
  {
    name: 'Kenney: Tiny Factory (dunia permainan)',
    source: 'kenney.nl',
    license: 'CC0',
  },
];

export const ICON_NOTE = 'Ikon antarmuka dibuat oleh tim.';

export const GENERATOR_NOTE =
  'Potret Pak Mandor dibuat dengan bantuan generator gambar (ChatGPT, OpenAI), dan latarnya dihapus dengan Photoroom.';

/** Ganti dengan nama enam anggota tim. */
export const TEAM_MEMBERS: readonly string[] = [
  'Azka',
  'Anggota 2',
  'Anggota 3',
  'Anggota 4',
  'Anggota 5',
  'Anggota 6',
];
