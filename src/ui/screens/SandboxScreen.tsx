import { useEffect, useMemo, useRef, useState } from 'react';
import type { SimulationController } from '../../controller/SimulationController';
import {
  defaultSandboxValues,
  isSandboxSupported,
  type SandboxValues,
} from '../../levels/sandbox';
import type { LevelDefinition } from '../../levels/types';
import { SandboxDrawer } from '../components/hud/SandboxDrawer';
import { planSandbox } from '../sandboxPanel';
import { PlayScreen } from './PlayScreen';

interface SandboxScreenProps {
  controller: SimulationController;
  level: LevelDefinition;
  /** Kembali ke daftar level Sandbox. */
  onExit: () => void;
  onSettings: () => void;
  reduceMotion?: boolean;
}

/**
 * Layar Sandbox (S11): Arena yang sama dengan Kampanye ditambah laci Parameter.
 * Level dimuat dengan `rated: false`, jadi popup hasil tanpa bintang dan
 * progres tidak tersimpan (recorder mengabaikan stars null).
 */
export function SandboxScreen({
  controller,
  level,
  onExit,
  onSettings,
  reduceMotion = false,
}: SandboxScreenProps) {
  const supported = isSandboxSupported(level.id);
  const [values, setValues] = useState<SandboxValues>(() =>
    defaultSandboxValues(level.id),
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const firstLoad = useRef(true);

  const plan = useMemo(
    () => (supported ? planSandbox(level, values) : null),
    [supported, level, values],
  );

  useEffect(() => {
    if (plan === null || !plan.ok) return;
    // Pemuatan pertama memakai seed tutorial; sesudahnya seed yang sedang dipakai dipertahankan.
    const seed = firstLoad.current ? undefined : controller.getState().seed;
    try {
      controller.loadLevel(plan.level, seed, plan.options);
      firstLoad.current = false;
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [controller, plan]);

  if (!supported) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4 bg-navy-900 text-ink-100">
        <p>Sandbox untuk Level {level.id} belum tersedia.</p>
        <button
          type="button"
          onClick={onExit}
          className="rounded bg-sun-500 px-4 py-2 font-semibold text-navy-900"
        >
          Kembali
        </button>
      </main>
    );
  }

  const error = plan !== null && !plan.ok ? plan.message : loadError;

  return (
    <PlayScreen
      controller={controller}
      onExit={onExit}
      onSettings={onSettings}
      reduceMotion={reduceMotion}
      modeLabel="Sandbox"
      sidePanel={
        <SandboxDrawer
          levelId={level.id}
          values={values}
          error={error}
          onChange={setValues}
          onReset={() => setValues(defaultSandboxValues(level.id))}
        />
      }
    />
  );
}