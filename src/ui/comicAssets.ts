// Jalur aset, tema, dan kelas gaya untuk layar komik Sandbox dan Bandingkan.
// Semua nama berkas ada di satu tempat agar mudah dicek oleh tes.

const BASE_URL: string = import.meta.env.BASE_URL;

export function assetUrl(path: string): string {
  return `${BASE_URL}assets/${path}`;
}

const PATHS = {
  bgSandbox: 'ui/komik/bg/bg-sandbox.jpg',
  bgCompare: 'ui/komik/bg/bg-bandingkan.jpg',
  badge: 'ui/komik/efek/lencana-bintang.png',
  tape: 'ui/komik/efek/selotip-terkunci.png',
  burstVs: 'ui/komik/efek/burst-vs.png',
  speedLines: 'ui/komik/efek/garis-kecepatan.png',
  mandorSandbox: 'characters/mandor-sandbox.png',
  mandorCompare: 'characters/mandor-bandingkan.png',
} as const;

// Dipakai tes untuk memastikan semua berkas ada di public/assets/.
export const COMIC_REQUIRED_PATHS: readonly string[] = Object.values(PATHS);

export const COMIC_EFFECTS = {
  badge: assetUrl(PATHS.badge),
  tape: assetUrl(PATHS.tape),
  burstVs: assetUrl(PATHS.burstVs),
  speedLines: assetUrl(PATHS.speedLines),
} as const;

export function levelThumbPath(levelId: string): string {
  return `ui/komik/level/level-${levelId}.jpg`;
}

export function levelThumbUrl(levelId: string): string {
  return assetUrl(levelThumbPath(levelId));
}

// Bayangan keras tanpa blur, ciri gaya komik. Heks sama dengan navy-900.
export const COMIC_SHADOW = {
  lg: 'shadow-[6px_6px_0_#0b1f3a]',
  md: 'shadow-[4px_4px_0_#0b1f3a]',
  sm: 'shadow-[3px_3px_0_#0b1f3a]',
} as const;

// Tulisan berkontur navy untuk efek seperti "VS".
export const TEXT_OUTLINE =
  '[text-shadow:2px_2px_0_#0b1f3a,-2px_-2px_0_#0b1f3a,2px_-2px_0_#0b1f3a,-2px_2px_0_#0b1f3a]';

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1'];

// Kemiringan panel bergantian supaya terlihat seperti halaman komik.
export function panelTilt(index: number): string {
  const n = TILTS.length;
  return TILTS[((index % n) + n) % n] ?? '';
}

export interface ComicTheme {
  title: string;
  bubble: string;
  background: string;
  mandor: string;
  accent: string; // kelas Tailwind untuk judul dan chip status
  showVs: boolean;
}

export const SANDBOX_THEME: ComicTheme = {
  title: 'SANDBOX',
  bubble: 'Sandbox: bebas ngoprek, tanpa bintang!',
  background: assetUrl(PATHS.bgSandbox),
  mandor: assetUrl(PATHS.mandorSandbox),
  accent: 'bg-sun-400',
  showVs: false,
};

export const COMPARE_THEME: ComicTheme = {
  title: 'BANDINGKAN',
  bubble: 'Adu dua pengaman, lihat mana yang paling jago!',
  background: assetUrl(PATHS.bgCompare),
  mandor: assetUrl(PATHS.mandorCompare),
  accent: 'bg-ember-500',
  showVs: true,
};