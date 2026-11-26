// Daftar gambar yang dimuat lebih awal, ditulis sebagai jalur relatif
// terhadap public/assets/. Tes assetTiers memastikan semua gambar di ui/,
// characters/, dan world/ terdaftar di sini (atau di NOT_PRELOADED).
import { HOME_CHARACTER } from '../levels/characters';

const EXPRESSIONS = ['senang', 'netral', 'sedih', 'berpikir'] as const;
const CHARACTERS = ['aldi', 'azka', 'fikri', 'rifal', 'widad'] as const;

// Ekspresi potret yang tampil di Beranda. Bila Mandor di Beranda masih muncul
// belakangan saat pertama dibuka, ganti nilai ini dengan ekspresi yang dipakai.
const HOME_EXPRESSION: (typeof EXPRESSIONS)[number] = 'senang';

const home = String(HOME_CHARACTER);

const portrait = (id: string, expression: string) =>
  `characters/${id}/${id}-${expression}.png`;

/** Tahap 1: ditunggu sebelum Beranda tampil (target di bawah sekitar 1 MB). */
export const TIER_BOOT: readonly string[] = [
  'ui/bg-beranda.jpg',
  'ui/logo-thread-factory.png',
  portrait(home, HOME_EXPRESSION),
];

/** Tahap 2: diunduh diam-diam, diurutkan menurut alur layar. */
export const TIER_BACKGROUND: readonly string[] = [
  // Pilih Modul
  'ui/map-modules.jpg',
  'ui/building-module-1.png',
  'ui/building-module-2.png',
  // Peta Level modul 1
  'ui/map-levels-1.jpg',
  'ui/pedestal.png',
  'ui/robot-guide.png',
  // Intro level dan potret Mandor
  'world/bg-intro-1-1.jpg',
  ...EXPRESSIONS.filter((e) => e !== HOME_EXPRESSION).map((e) =>
    portrait(home, e),
  ),
  // Arena (Phaser memuat berkas yang sama dari cache)
  'world/bg-arena.png',
  'world/road-curve.png',
  'world/road-straight.png',
  'world/tiny-factory.png',
  // Popup hasil dan HUD
  'ui/ribbon-benar.png',
  'ui/ribbon-salah.png',
  'ui/star-kosong.png',
  'ui/star-penuh.png',
  'characters/mandor-avatar.png',
  // Sandbox dan Bandingkan
  'ui/komik/bg/bg-sandbox.jpg',
  'ui/komik/bg/bg-bandingkan.jpg',
  'ui/komik/efek/burst-vs.png',
  'ui/komik/efek/garis-kecepatan.png',
  'ui/komik/efek/lencana-bintang.png',
  'ui/komik/efek/selotip-terkunci.png',
  'characters/mandor-sandbox.png',
  'characters/mandor-bandingkan.png',
  'ui/komik/level/level-1-1.jpg',
  'ui/komik/level/level-1-2.jpg',
  'ui/komik/level/level-1-3.jpg',
  'ui/komik/level/level-1-4.jpg',
  'ui/komik/level/level-1-5.jpg',
  'ui/komik/level/level-2-1.jpg',
  'ui/komik/level/level-2-2.jpg',
  'ui/komik/level/level-2-3.jpg',
  'ui/komik/level/level-2-4.jpg',
  // Pengaturan dan Panduan
  'ui/catatan/bg-catatan.jpg',
  'ui/catatan/papan-klip.png',
  'ui/catatan/mandor-intip.png',
  'ui/catatan/catatan-kuning.png',
  // Peta Level modul 2
  'ui/map-levels-2.jpg',
  // Karakter lain (dipakai di level tertentu)
  ...CHARACTERS.filter((c) => c !== home).flatMap((c) =>
    EXPRESSIONS.map((e) => portrait(c, e)),
  ),
];

/** Sengaja tidak dimuat lebih awal (belum dipakai kode). */
export const NOT_PRELOADED: readonly string[] = [
  'ui/fx-komik.png',
  'ui/komik/efek/burst-kuning.png',
  'ui/komik/efek/burst-oranye.png',
];
