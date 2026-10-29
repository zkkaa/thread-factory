import { APP_VERSION } from '../../version';
import { MandorPortrait } from '../components/MandorPortrait';
import type { Navigation } from '../navigation';
import { UI_ASSETS } from '../uiAssets';

interface HomeScreenProps {
  navigation: Navigation;
  /** True bila sudah ada level yang selesai; mengubah "Mulai Game" jadi "Lanjutkan". */
  hasProgress: boolean;
}

interface MenuButtonProps {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

function MenuButton({ label, onClick, primary = false }: MenuButtonProps) {
  const tone = primary
    ? 'bg-sun-400 text-navy-900 hover:bg-sun-500 text-xl'
    : 'border border-navy-500 bg-navy-800 text-ink-100 hover:bg-navy-700 text-lg';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-72 rounded-xl px-6 py-3 text-left font-bold shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400 ${tone}`}
    >
      {label}
    </button>
  );
}

/**
 * Layar Beranda (S1): latar pabrik, logo, menu di kiri, dan Pak Mandor di
 * kanan. Gradasi gelap di kiri menjaga teks dan tombol tetap terbaca di atas
 * gambar latar.
 */
export function HomeScreen({ navigation, hasProgress }: HomeScreenProps) {
  return (
    <main
      className="relative flex h-screen items-center justify-center gap-16 overflow-hidden bg-navy-900 bg-cover bg-center px-12 text-ink-100"
      style={{ backgroundImage: `url(${UI_ASSETS.homeBackground})` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-navy-900/90 via-navy-900/55 to-navy-900/10"
      />

      <section className="relative flex max-w-md flex-col gap-6">
        <header className="space-y-3">
          <h1 className="sr-only">Thread Factory: Pabrik Rebutan</h1>
          <img
            src={UI_ASSETS.logo}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-full max-w-md drop-shadow-lg"
          />
          <p className="text-ink-100">
            Belajar sinkronisasi dan konkurensi thread lewat simulasi pabrik.
          </p>
        </header>

        <nav aria-label="Menu utama" className="flex flex-col gap-3">
          <MenuButton
            primary
            label={hasProgress ? 'Lanjutkan' : 'Mulai Game'}
            onClick={() => navigation.go({ id: 'mode', tab: 'campaign' })}
          />
          <MenuButton
            label="Panduan"
            onClick={() => navigation.go({ id: 'guide' })}
          />
          <MenuButton
            label="Pengaturan"
            onClick={() => navigation.go({ id: 'settings' })}
          />
        </nav>

        <p className="text-sm text-ink-300">v{APP_VERSION}</p>
      </section>

      <MandorPortrait
        mood="senang"
        className="relative h-[28rem] w-80 shrink-0"
      />
    </main>
  );
}
