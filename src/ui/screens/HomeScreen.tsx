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
  icon: React.ReactNode;
}

/* Icon Components */
function PlayIcon() {
  return (
    <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function GuideIcon() {
  return (
    <svg
      className="h-7 w-7 fill-none stroke-current stroke-2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-7 w-7 fill-none stroke-current stroke-2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function MenuButton({ label, onClick, primary = false, icon }: MenuButtonProps) {
  const tone = primary
    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 border-b-4 border-amber-600 active:translate-y-0.5 shadow-amber-500/20'
    : 'bg-slate-900/85 text-slate-100 hover:bg-slate-800/90 border border-slate-600/80 border-b-4 border-b-slate-950 active:translate-y-0.5 backdrop-blur-xs';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-5 py-3 text-left font-bold shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${tone}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="grow text-sm sm:text-base">{label}</span>
    </button>
  );
}

/**
 * Layar Beranda (S1): Latar pabrik, logo besar, menu di kiri, dan Pak Mandor di kanan.
 */
export function HomeScreen({ navigation, hasProgress }: HomeScreenProps) {
  return (
    <main
      className="relative flex h-screen min-h-125 w-full items-center justify-center overflow-hidden bg-cover bg-center px-6 sm:px-12 md:justify-start lg:px-28 xl:px-48"
      style={{ backgroundImage: `url(${UI_ASSETS.homeBackground})` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-navy-900/25 via-navy-900/20 to-navy-900/20"
      />

      {/* Container Utama Kiri: Logo, Deskripsi, dan Navigasi */}
      <section className="relative z-10 -mt-20 flex w-full max-w-md md:max-w-xl flex-col items-center gap-5 sm:gap-8">
        <header className="flex w-full flex-col items-center text-center ">
          <h1 className="sr-only">Thread Factory: Pabrik Rebutan</h1>
          
          <img
            src={UI_ASSETS.logo}
            alt="Thread Factory Logo"
            draggable={false}
            className="h-auto w-70 sm:w-95 md:w-135 drop-shadow-xl"
          />

          <p className="max-w-xs sm:max-w-sm text-xs sm:text-sm font-semibold text-slate-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] leading-relaxed">
            Belajar Sinkronisasi dan Konkurensi Thread lewat Simulasi Pabrik
          </p>
        </header>

        <nav aria-label="Menu utama" className="flex w-90 flex-col gap-2.5 sm:gap-3">
          <MenuButton
            primary
            label={hasProgress ? 'Lanjutkan' : 'Mulai Game'}
            icon={<PlayIcon />}
            onClick={() => navigation.go({ id: 'mode', tab: 'campaign' })}
          />
          <MenuButton
            label="Panduan"
            icon={<GuideIcon />}
            onClick={() => navigation.go({ id: 'guide' })}
          />
          <MenuButton
            label="Pengaturan"
            icon={<SettingsIcon />}
            onClick={() => navigation.go({ id: 'settings' })}
          />
        </nav>
      </section>

      {/* Pak Mandor: Di pojok kanan bawah tanpa boks latar */}
      <div className="pointer-events-none absolute bottom-0 right-0 md:right-16 lg:right-24 xl:right-40 z-0 md:z-10 flex items-end">
        <MandorPortrait
          mood="senang"
          className="h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[85vh] max-h-160 w-auto object-contain object-bottom drop-shadow-2xl opacity-35 sm:opacity-50 md:opacity-100 transition-all"
        />
      </div>

      {/* Versi App di Pojok Kiri Bawah */}
      <p className="absolute bottom-3 left-4 sm:left-6 z-10 text-[11px] sm:text-xs font-semibold text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        v{APP_VERSION}
      </p>
    </main>
  );
}