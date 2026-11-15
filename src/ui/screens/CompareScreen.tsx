import { useEffect, useMemo, useRef, useState } from 'react';
import { CompareSession } from '../../controller/CompareSession';
import { compareStates } from '../../controller/compareMetrics';
import {
  defaultSandboxValues,
  type SandboxValues,
} from '../../levels/sandbox';
import type { LevelDefinition } from '../../levels/types';
import { CompareControls } from '../components/hud/CompareControls';
import { ComparePanel } from '../components/hud/ComparePanel';
import { CompareSummaryTable } from '../components/hud/CompareSummaryTable';
import { planSide } from '../comparePanel';
import { useSimulation } from '../hooks/useSimulation';

interface CompareScreenProps {
  level: LevelDefinition;
  /** Kembali ke daftar level Bandingkan. */
  onExit: () => void;
  reduceMotion?: boolean;
}

const errorText = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

/**
 * Layar Bandingkan (S12): dua arena dengan seed yang sama, dikendalikan
 * bersama lewat CompareSession. Tiap sisi punya alat dan parameter sendiri.
 * Bintang tidak dinilai dan progres tidak tersimpan (controller sendiri,
 * bukan controller utama aplikasi).
 */
export function CompareScreen({
  level,
  onExit,
  reduceMotion = false,
}: CompareScreenProps) {
  const [session] = useState(() => new CompareSession());
  const stateA = useSimulation(session.a);
  const stateB = useSimulation(session.b);

  const [valuesA, setValuesA] = useState<SandboxValues>(() =>
    defaultSandboxValues(level.id),
  );
  const [valuesB, setValuesB] = useState<SandboxValues>(() =>
    defaultSandboxValues(level.id),
  );
  const [loadErrorA, setLoadErrorA] = useState<string | null>(null);
  const [loadErrorB, setLoadErrorB] = useState<string | null>(null);
  const loadedA = useRef(false);

  const planA = useMemo(() => planSide(level, valuesA), [level, valuesA]);
  const planB = useMemo(() => planSide(level, valuesB), [level, valuesB]);

  // Urutan efek penting: sisi A dimuat lebih dulu (seed tutorial), lalu B
  // memakai seed A. Sesudahnya tiap sisi dimuat ulang dengan seed bersama.
  useEffect(() => {
    if (!planA.ok) return;
    try {
      const seed = loadedA.current ? session.getSeed() : undefined;
      session.a.loadLevel(planA.level, seed, planA.options);
      loadedA.current = true;
      setLoadErrorA(null);
    } catch (e) {
      setLoadErrorA(errorText(e));
    }
  }, [session, planA]);

  useEffect(() => {
    if (!planB.ok) return;
    try {
      session.b.loadLevel(planB.level, session.getSeed(), planB.options);
      setLoadErrorB(null);
    } catch (e) {
      setLoadErrorB(errorText(e));
    }
  }, [session, planB]);

  useEffect(() => () => session.dispose(), [session]);

  const summary = useMemo(
    () => compareStates(stateA, stateB),
    [stateA, stateB],
  );

  const errorA = !planA.ok ? planA.message : loadErrorA;
  const errorB = !planB.ok ? planB.message : loadErrorB;

  return (
    <main className="h-screen space-y-3 overflow-y-auto bg-navy-900 p-3 text-ink-100">
      <header className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold hover:bg-navy-700"
        >
          Kembali
        </button>
        <h1 className="text-lg font-bold">
          Level {level.id}: {level.title} (Bandingkan)
        </h1>
      </header>

      <CompareControls session={session} stateA={stateA} stateB={stateB} />

      <div className="grid grid-cols-2 gap-3">
        <ComparePanel
          label="A"
          arenaId="compare-arena-a"
          controller={session.a}
          state={stateA}
          levelId={level.id}
          values={valuesA}
          error={errorA}
          onChange={setValuesA}
          onReset={() => setValuesA(defaultSandboxValues(level.id))}
          reduceMotion={reduceMotion}
        />
        <ComparePanel
          label="B"
          arenaId="compare-arena-b"
          controller={session.b}
          state={stateB}
          levelId={level.id}
          values={valuesB}
          error={errorB}
          onChange={setValuesB}
          onReset={() => setValuesB(defaultSandboxValues(level.id))}
          reduceMotion={reduceMotion}
        />
      </div>

      <CompareSummaryTable summary={summary} />
    </main>
  );
}