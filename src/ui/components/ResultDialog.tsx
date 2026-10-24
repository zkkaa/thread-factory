import { useEffect, useRef, useState } from 'react';
import type { ControllerState, SimulationController } from '../../controller/SimulationController';
import type { LevelResult } from '../../controller/evaluateLevel';

interface ResultDialogProps {
  controller: SimulationController;
  state: ControllerState;
}

function Criterion({ met, children }: { met: boolean; children: string }) {
  return (
    <li className={met ? 'text-emerald-300' : 'text-gray-400'}>
      <span aria-hidden="true">{met ? '✓' : '✕'}</span> {children}{' '}
      <span className="sr-only">{met ? '(terpenuhi)' : '(tidak terpenuhi)'}</span>
    </li>
  );
}

/**
 * Dialog hasil setelah simulasi selesai: "Seharusnya X, hasilnya Y", status
 * benar/salah, bintang, dan penjelasan konsep. Semua angka dan penilaian dibaca
 * dari state.result (dihitung controller); dialog ini tidak menghitung apa pun.
 */
export function ResultDialog({ controller, state }: ResultDialogProps) {
  const [dismissed, setDismissed] = useState<LevelResult | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { level, snapshot, result } = state;
  const visible = result !== null && result !== dismissed && level !== null && snapshot !== null;

  useEffect(() => {
    if (visible) closeRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    if (!visible || result === null) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDismissed(result);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, result]);

  if (!visible || result === null || level === null || snapshot === null) return null;

  const { variable, value: target } = level.goal.target;
  const actual = snapshot.sharedVars[variable];
  const totalWait = Object.values(result.metrics.waitTicksByThread).reduce((a, b) => a + b, 0);
  const explanation = level.explanation
    ? result.ok
      ? level.explanation.pass
      : level.explanation.fail
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="max-h-full w-full max-w-lg space-y-3 overflow-y-auto rounded-lg border border-gray-600 bg-gray-900 p-5 shadow-xl"
      >
        <h2 id="result-title" className="text-xl font-bold">
          Seharusnya {target}, hasilnya {actual}
        </h2>

        <p
          className={`inline-block rounded px-2 py-1 text-sm font-bold ${
            result.ok ? 'bg-emerald-800 text-emerald-100' : 'bg-red-900 text-red-100'
          }`}
        >
          <span aria-hidden="true">{result.ok ? '✓ ' : '✕ '}</span>
          {result.ok ? 'BENAR' : 'SALAH'}
        </p>
        <p className="text-sm">{result.message}</p>

        {result.stars !== null ? (
          <div className="space-y-1">
            <p className="text-2xl text-yellow-300" aria-label={`${result.stars} dari 3 bintang`}>
              {'★'.repeat(result.stars)}
              {'☆'.repeat(3 - result.stars)}
            </p>
            <ul className="space-y-0.5 text-sm">
              <Criterion met={result.ok}>Benar: tidak ada data rusak</Criterion>
              <Criterion met={result.ok && result.metrics.tick <= level.goal.stars.fast}>
                {`Efisien: selesai dalam ${level.goal.stars.fast} tick atau kurang (tick: ${result.metrics.tick})`}
              </Criterion>
              <Criterion
                met={
                  result.ok &&
                  result.metrics.tick <= level.goal.stars.fast &&
                  totalWait <= level.goal.stars.lowWait
                }
              >
                {`Hemat: total waktu tunggu ${level.goal.stars.lowWait} tick atau kurang (total: ${totalWait})`}
              </Criterion>
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-300">
            Bintang hanya dinilai pada seed tutorial ({level.tutorialSeed}). Seed sekarang:{' '}
            {snapshot.seed}.
          </p>
        )}

        <p className="text-sm text-gray-300">
          Pembaruan hilang: <strong>{result.metrics.lostUpdates ?? '-'}</strong> · Total tick:{' '}
          <strong>{result.metrics.tick}</strong> · Total waktu tunggu: <strong>{totalWait}</strong>
        </p>

        {explanation !== null && (
          <p className="rounded bg-gray-800 p-3 text-sm leading-relaxed">{explanation}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDismissed(result);
              controller.reset();
            }}
            className="rounded bg-gray-700 px-3 py-1.5 text-sm font-semibold hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setDismissed(result)}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold hover:bg-indigo-500"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
