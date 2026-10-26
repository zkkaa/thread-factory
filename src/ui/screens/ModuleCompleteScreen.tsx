import type { ModuleDefinition } from '../../levels/types';
import type { ProgressData } from '../../progress/progressStore';
import { type UnlockContext, isModuleUnlocked } from '../../progress/unlocks';
import { MandorPortrait } from '../components/MandorPortrait';
import {
  type LevelConceptsLookup,
  buildModuleSummary,
  findNextModule,
} from '../completion';
import type { Navigation } from '../navigation';
import type { Screen } from '../screenState';

interface ModuleCompleteScreenProps {
  navigation: Navigation;
  moduleDef: ModuleDefinition;
  context: UnlockContext;
  progress: Readonly<ProgressData>;
  getLevelConcepts: LevelConceptsLookup;
}

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400';

/** Layar Tamat Modul (S7). */
export function ModuleCompleteScreen({
  navigation,
  moduleDef,
  context,
  progress,
  getLevelConcepts,
}: ModuleCompleteScreenProps) {
  const summary = buildModuleSummary(moduleDef, progress, getLevelConcepts);
  const nextModule = findNextModule(context.modules, moduleDef.id);
  const nextUnlocked =
    nextModule !== undefined && isModuleUnlocked(context, nextModule.id);

  const forwardLabel =
    nextModule !== undefined
      ? 'Lanjut ke Modul Berikutnya'
      : 'Lanjut ke Akhir Game';
  const forwardTarget: Screen =
    nextModule !== undefined
      ? { id: 'moduleIntro', moduleId: nextModule.id }
      : { id: 'gameComplete' };
  const mapTarget: Screen = { id: 'levelMap', moduleId: moduleDef.id };

  return (
    <main className="flex h-screen items-center justify-center gap-16 bg-linear-to-br from-navy-900 to-navy-700 px-12 text-ink-100">
      <MandorPortrait mood="senang" className="h-96 w-72 shrink-0" />

      <section className="flex max-w-xl flex-col gap-5">
        <header className="space-y-2">
          <h1 className="text-5xl leading-tight font-black text-sun-400">
            {moduleDef.title} selesai!
          </h1>
          <p className="text-lg text-ink-300">
            Kerja bagus, Mandor! Semua level {moduleDef.subtitle} sudah beres.
          </p>
        </header>

        <p className="text-2xl font-bold">
          <span aria-hidden="true" className="text-sun-400">
            ★{' '}
          </span>
          Bintang modul: {summary.starsEarned} / {summary.starsMax}
        </p>

        <section aria-label="Konsep yang dikuasai">
          <h2 className="mb-2 text-sm font-bold tracking-wide text-ink-300 uppercase">
            Konsep yang dikuasai
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

        {nextModule !== undefined && nextUnlocked && (
          <p className="text-xl font-black text-ember-500">
            {nextModule.title} terbuka!
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!navigation.canGo(forwardTarget)}
            onClick={() => navigation.go(forwardTarget)}
            className={`rounded-xl bg-sun-400 px-6 py-3 text-lg font-bold text-navy-900 shadow-md hover:bg-sun-500 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
          >
            {forwardLabel}
          </button>
          <button
            type="button"
            disabled={!navigation.canGo(mapTarget)}
            onClick={() => navigation.go(mapTarget)}
            className={`rounded-xl border border-navy-500 bg-navy-800 px-6 py-3 text-lg font-bold hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
          >
            Peta Level
          </button>
        </div>
      </section>
    </main>
  );
}
