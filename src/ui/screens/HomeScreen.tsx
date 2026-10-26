import { APP_VERSION } from '../../version';
import type { Navigation } from '../navigation';

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

/** Layar Beranda (S1). Gambar Pak Mandor dan logo menyusul di U-074 dan U-075. */
export function HomeScreen({ navigation, hasProgress }: HomeScreenProps) {
  return (
    <main className="flex h-screen items-center justify-center gap-16 bg-linear-to-br from-navy-900 to-navy-700 px-12 text-ink-100">
      <section className="flex max-w-md flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-6xl leading-none font-black tracking-tight text-sun-400">
            Thread Factory
          </h1>
          <p className="inline-block rounded-lg bg-ember-500 px-4 py-1 text-2xl font-bold text-navy-900">
            Pabrik Rebutan
          </p>
          <p className="pt-2 text-ink-300">
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

      <div
        role="img"
        aria-label="Gambar Pak Mandor (menyusul)"
        className="flex h-96 w-72 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy-500 bg-navy-800 text-center"
      >
        <span aria-hidden="true" className="text-8xl">
          👷
        </span>
        <span className="text-sm text-ink-300">Pak Mandor (gambar menyusul)</span>
      </div>
    </main>
  );
}