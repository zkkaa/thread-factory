import type { ModeTab } from './screenState';

/** Data tab Pilih Mode (S2), dipisah dari komponen agar fast refresh jalan. */
export const MODE_TABS: readonly {
  id: ModeTab;
  label: string;
  hint: string;
}[] = [
  {
    id: 'campaign',
    label: 'Kampanye',
    hint: 'Pilih modul dan selesaikan level demi level.',
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    hint: 'Ubah parameter bebas di level yang sudah selesai (tanpa bintang).',
  },
  {
    id: 'compare',
    label: 'Bandingkan',
    hint: 'Jalankan dua konfigurasi berdampingan dengan seed yang sama.',
  },
];

/** Kelas cincin fokus keyboard yang dipakai tombol di layar Pilih Mode. */
export const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400';
