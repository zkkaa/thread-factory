import { useEffect, useState } from 'react';
import type { LevelResult } from '../../../controller/evaluateLevel';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import { deriveResultView, type ResultView } from '../../resultView';
import { MandorPortrait } from '../MandorPortrait';
import { starClass } from '../../motion';
import { useSound } from '../../audio/soundContext';

interface ResultDialogProps {
  controller: SimulationController;
  state: ControllerState;
  reduceMotion?: boolean;
  /** Tampilkan tombol Petunjuk (setelah 2 kegagalan). */
  offerHint?: boolean;
  onHint?: () => void;
  /** Pindah ke level berikutnya (atau Tamat Modul). */
  onNext?: () => void;
}

interface Action {
  label: string;
  onClick: () => void;
}

interface ResultCardProps {
  view: ResultView;
  reduceMotion: boolean;
  actions: Action[];
  onClose: () => void;
}

function ResultCard({ view, reduceMotion, actions, onClose }: ResultCardProps) {
  const total = view.stars ?? 0;
  const [count, setCount] = useState(0);
  const player = useSound();
  // Bintang muncul satu per satu; "kurangi animasi" langsung menampilkan semua.
  const shown = reduceMotion ? total : Math.min(count, total);

  useEffect(() => {
    if (reduceMotion || count >= total) return;
    const id = window.setTimeout(() => setCount((c) => c + 1), 450);
    return () => window.clearTimeout(id);
  }, [reduceMotion, count, total]);

  // Satu bunyi tiap bintang yang muncul (dengan "kurangi animasi" semuanya muncul sekaligus).
  useEffect(() => {
    if (shown > 0) player.playSfx('star');
  }, [shown, player]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="max-h-full w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border-2 border-navy-500 bg-navy-900 p-6 text-ink-100 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="result-title" className="text-xl font-bold text-sun-400">
            {view.title}
          </h2>
          <span
            className={`rounded px-2 py-1 text-sm font-bold ${
              view.ok
                ? 'bg-emerald-800 text-emerald-100'
                : 'bg-red-900 text-red-100'
            }`}
          >
            <span aria-hidden="true">{view.ok ? '✓ ' : '✕ '}</span>
            {view.ok ? 'BENAR' : 'SALAH'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <MandorPortrait
            mood={view.ok ? 'senang' : 'sedih'}
            className="h-32 w-24 shrink-0"
          />
          <div className="space-y-1 rounded-xl border border-navy-500 bg-navy-800 p-3">
            <p className="text-lg font-semibold">{view.quote}</p>
            <p className="text-sm text-ink-300">{view.message}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {view.cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-navy-500 bg-navy-800 p-3 text-center"
            >
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-ink-300">{card.label}</p>
            </div>
          ))}
        </div>

        {view.stars !== null ? (
          <div className="space-y-1">
            <p
              role="img"
              aria-label={`${total} dari 3 bintang`}
              className="text-3xl text-sun-400"
            >
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className={starClass(index, shown, reduceMotion)}
                >
                  {index < shown ? '★' : '☆'}
                </span>
              ))}
            </p>
            <ul className="space-y-0.5 text-sm">
              {view.criteria.map((c) => (
                <li
                  key={c.label}
                  className={c.met ? 'text-emerald-300' : 'text-ink-300'}
                >
                  <span aria-hidden="true">{c.met ? '✓' : '✕'}</span> {c.label}
                  <span className="sr-only">
                    {c.met ? ' (terpenuhi)' : ' (tidak terpenuhi)'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          view.seedNote !== null && (
            <p className="text-sm text-ink-300">{view.seedNote}</p>
          )
        )}

        {view.explanation !== null && (
          <p className="rounded bg-navy-800 p-3 text-sm leading-relaxed">
            {view.explanation}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {actions.map((action, i) => (
            <button
              key={action.label}
              type="button"
              autoFocus={i === 0}
              onClick={action.onClick}
              className={
                i === 0
                  ? 'rounded bg-sun-400 px-4 py-1.5 text-sm font-semibold text-navy-900 hover:bg-sun-500'
                  : 'rounded border border-navy-500 px-3 py-1.5 text-sm hover:bg-navy-700'
              }
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-navy-500 px-3 py-1.5 text-sm hover:bg-navy-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/**
- Popup hasil (S6). Semua angka dan penilaian berasal dari state.result;
- komponen ini hanya menampilkan (lihat resultView.ts).
 */
export function ResultDialog({
  controller,
  state,
  reduceMotion = false,
  offerHint = false,
  onHint,
  onNext,
}: ResultDialogProps) {
  const [dismissed, setDismissed] = useState<LevelResult | null>(null);
  const { level, snapshot, result } = state;
  if (
    result === null ||
    result === dismissed ||
    level === null ||
    snapshot === null
  ) {
    return null;
  }

  const view = deriveResultView(level, snapshot, result);
  const close = (): void => setDismissed(result);
  const resetAnd = (): void => {
    close();
    controller.reset();
  };

  const actions: Action[] = [];
  if (!view.ok) {
    actions.push({ label: 'Reset Simulasi', onClick: resetAnd });
    if (offerHint && onHint !== undefined) {
      actions.push({ label: 'Petunjuk', onClick: onHint });
    }
  } else {
    if (onNext !== undefined) {
      actions.push({
        label: 'Lanjut ke Level Berikutnya',
        onClick: () => {
          close();
          onNext();
        },
      });
    }
    if (view.stars !== null && view.stars < 3) {
      actions.push({ label: 'Ulangi untuk Bintang', onClick: resetAnd });
    }
  }

  return (
    <ResultCard
      view={view}
      reduceMotion={reduceMotion}
      actions={actions}
      onClose={close}
    />
  );
}
