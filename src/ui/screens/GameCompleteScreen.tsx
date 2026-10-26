import type { ModuleDefinition } from '../../levels/types';
import type { ProgressData } from '../../progress/progressStore';
import { MandorPortrait } from '../components/MandorPortrait';
import { type LevelConceptsLookup, buildGameSummary } from '../completion';
import type { Navigation } from '../navigation';
import type { Screen } from '../screenState';

interface GameCompleteScreenProps {
  navigation: Navigation;
  modules: readonly ModuleDefinition[];
  progress: Readonly<ProgressData>;
  getLevelConcepts: LevelConceptsLookup;
}

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400';

/** Layar Tamat Game (S8). Kredit membuka Pengaturan, tempat daftar kredit. */
export function GameCompleteScreen({
  navigation,
  modules,
  progress,
  getLevelConcepts,
}: GameCompleteScreenProps) {
  const summary = buildGameSummary(modules, progress, getLevelConcepts);
  const firstModuleId = modules.length > 0 ? modules[0].id : 1;

  const actions: readonly { label: string; target: Screen }[] = [
    { label: 'Sandbox', target: { id: 'mode', tab: 'sandbox' } },
    { label: 'Bandingkan', target: { id: 'mode', tab: 'compare' } },
    {
      label: 'Ulangi Level',
      target: { id: 'levelMap', moduleId: firstModuleId },
    },
    { label: 'Kredit', target: { id: 'settings' } },
    { label: 'Beranda', target: { id: 'home' } },
  ];

  return (
    <main className="flex h-screen items-center justify-center gap-16 bg-linear-to-br from-navy-900 to-navy-700 px-12 text-ink-100">
      <MandorPortrait mood="senang" className="h-96 w-72 shrink-0" />

      <section className="flex max-w-2xl flex-col gap-5">
        <header className="space-y-2">
          <h1 className="text-5xl leading-tight font-black text-sun-400">
            Selamat, Mandor!
          </h1>
          <p className="text-lg text-ink-300">
            Seluruh pabrik sudah berjalan benar. Kamu sudah melewati semua level
            kampanye.
          </p>
        </header>

        <p className="text-2xl font-bold">
          <span aria-hidden="true" className="text-sun-400">
            ★{' '}
          </span>
          Total bintang: {summary.starsEarned} / {summary.starsMax}
        </p>

        <section aria-label="Semua konsep">
          <h2 className="mb-2 text-sm font-bold tracking-wide text-ink-300 uppercase">
            Semua konsep yang kamu pelajari
          </h2>
          <ul className="flex flex-wrap gap-2">
            {summary.concepts.map((concept) => (
              <li
                key={concept}
                className="rounded-full border border-navy-500 bg-navy-800 px-4 py-1 text-sm font-semibold"
              >
                {concept}
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="Setelah tamat" className="flex flex-wrap gap-3">
          {actions.map((action, index) => (
            <button
              key={action.label}
              type="button"
              disabled={!navigation.canGo(action.target)}
              onClick={() => navigation.go(action.target)}
              className={`rounded-xl px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS} ${
                index === 0
                  ? 'bg-sun-400 text-navy-900 hover:bg-sun-500'
                  : 'border border-navy-500 bg-navy-800 hover:bg-navy-700'
              }`}
            >
              {action.label}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
