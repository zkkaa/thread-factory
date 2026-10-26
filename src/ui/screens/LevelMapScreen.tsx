import type { ModuleDefinition } from '../../levels/types';
import type { ProgressData } from '../../progress/progressStore';
import type { UnlockContext } from '../../progress/unlocks';
import { type LevelNode, buildLevelMap } from '../levelMap';
import type { Navigation } from '../navigation';
import type { Screen } from '../screenState';

interface LevelMapScreenProps {
  navigation: Navigation;
  moduleDef: ModuleDefinition;
  context: UnlockContext;
  progress: Readonly<ProgressData>;
  /** Judul level, atau undefined bila datanya belum dibuat. */
  getLevelTitle: (levelId: string) => string | undefined;
}

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400';

/** Teks pembaca layar untuk satu titik level. */
function describeNode(node: LevelNode): string {
  const name =
    node.title === null
      ? `Level ${node.levelId}`
      : `Level ${node.levelId}: ${node.title}`;
  switch (node.status) {
    case 'comingSoon':
      return `${name}, segera hadir`;
    case 'locked':
      return `${name}, terkunci`;
    case 'cleared':
      return `${name}, ${node.stars} dari 3 bintang`;
    case 'open':
      return `${name}, belum selesai`;
  }
}

function StarRow({ stars }: { stars: number }) {
  return (
    <span aria-hidden="true" className="text-xl tracking-widest text-sun-400">
      {'★'.repeat(stars)}
      {'☆'.repeat(3 - stars)}
    </span>
  );
}

interface NodeButtonProps {
  node: LevelNode;
  disabled: boolean;
  onOpen: () => void;
}

function NodeButton({ node, disabled, onOpen }: NodeButtonProps) {
  const tone =
    node.status === 'cleared'
      ? 'border-sun-500 bg-sun-400 text-navy-900'
      : node.status === 'open'
        ? 'border-ember-500 bg-navy-800 text-ink-100 hover:bg-navy-700'
        : 'border-navy-700 bg-navy-900 text-ink-300 opacity-60';
  const ring = node.isNext
    ? 'ring-4 ring-ember-500 ring-offset-2 ring-offset-navy-900'
    : '';
  const locked = node.status === 'locked' || node.status === 'comingSoon';
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={describeNode(node)}
      onClick={onOpen}
      className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-xl font-black transition-colors disabled:cursor-not-allowed ${FOCUS} ${tone} ${ring}`}
    >
      {locked ? (
        <span aria-hidden="true">🔒</span>
      ) : (
        <span aria-hidden="true">{node.levelId}</span>
      )}
    </button>
  );
}

/**
 * Peta Level (S3 bagian B): titik level berurutan dengan bintang tertinggi,
 * kunci, sorotan level berikutnya, dan tombol Mulai/Lanjut. Ikon kunci
 * sementara berupa emoji; diganti ikon SVG di U-023. Denyut pada level
 * berikutnya menyusul di U-076 supaya ikut pengaturan "kurangi animasi".
 */
export function LevelMapScreen({
  navigation,
  moduleDef,
  context,
  progress,
  getLevelTitle,
}: LevelMapScreenProps) {
  const view = buildLevelMap(moduleDef, context, progress, getLevelTitle);
  const intro = (levelId: string): Screen => ({ id: 'levelIntro', levelId });

  return (
    <main className="flex h-screen flex-col gap-8 overflow-y-auto bg-linear-to-br from-navy-900 to-navy-700 px-12 py-8 text-ink-100">
      <header className="flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={navigation.back}
          className={`rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold hover:bg-navy-700 ${FOCUS}`}
        >
          Kembali
        </button>
        <div className="text-center">
          <p className="text-sm font-bold tracking-widest text-ember-500 uppercase">
            {moduleDef.title}
          </p>
          <h1 className="text-3xl font-black text-sun-400">
            {moduleDef.subtitle}
          </h1>
        </div>
        <p className="w-24 text-right text-sm font-semibold text-ink-300">
          <span aria-hidden="true">★ </span>
          {view.starsEarned} / {view.starsMax}
        </p>
      </header>

      <section
        aria-label="Peta level"
        className="flex flex-1 flex-col items-center justify-center gap-10"
      >
        <ol className="flex items-start">
          {view.nodes.map((node, index) => (
            <li key={node.levelId} className="flex items-start">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="mt-9 h-1.5 w-12 rounded bg-navy-500"
                />
              )}
              <div className="flex w-32 flex-col items-center gap-1 text-center">
                <NodeButton
                  node={node}
                  disabled={
                    (node.status !== 'open' && node.status !== 'cleared') ||
                    !navigation.canGo(intro(node.levelId))
                  }
                  onOpen={() => navigation.go(intro(node.levelId))}
                />
                <span className="text-sm font-bold">Level {node.levelId}</span>
                <span className="text-xs text-ink-300">
                  {node.title ?? node.note}
                </span>
                {node.status === 'cleared' && (
                  <>
                    <span className="text-xs font-bold text-sun-400">
                      Selesai
                    </span>
                    <StarRow stars={node.stars} />
                  </>
                )}
                {node.status === 'locked' && node.note !== null && (
                  <span className="text-xs text-ember-500">{node.note}</span>
                )}
                {node.isNext && (
                  <span className="rounded bg-ember-500 px-2 py-0.5 text-xs font-bold text-navy-900">
                    Berikutnya
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>

        {view.action !== null ? (
          <button
            type="button"
            disabled={!navigation.canGo(intro(view.action.levelId))}
            onClick={() => {
              if (view.action !== null) {
                navigation.go(intro(view.action.levelId));
              }
            }}
            className={`rounded-xl bg-sun-400 px-8 py-3 text-xl font-bold text-navy-900 shadow-md hover:bg-sun-500 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
          >
            {view.action.verb} Level {view.action.levelId}
          </button>
        ) : (
          <p className="max-w-md text-center text-ink-300">{view.message}</p>
        )}

        <p className="text-sm text-ink-300">
          Level yang sudah selesai bisa diulang untuk mengejar bintang.
        </p>
      </section>
    </main>
  );
}
