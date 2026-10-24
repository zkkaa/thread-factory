import { useState } from 'react';
import type {
  ControllerState,
  RunState,
  SimulationController,
  Speed,
} from '../../controller/SimulationController';
import { parseSeed } from '../parseSeed';

const SPEEDS: readonly Speed[] = [0.5, 1, 5];

const RUN_STATE_LABEL: Record<RunState, string> = {
  idle: 'Siap',
  running: 'Berjalan',
  paused: 'Dijeda',
  finished: 'Selesai',
};

const BUTTON =
  'rounded px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

interface ControlBarProps {
  controller: SimulationController;
  state: ControllerState;
}

/** Isian seed. Dipasang ulang (key) tiap seed controller berubah agar teksnya selalu sinkron. */
function SeedField({
  controller,
  seed,
  tutorialSeed,
}: {
  controller: SimulationController;
  seed: number;
  tutorialSeed: number | undefined;
}) {
  const [text, setText] = useState(String(seed));
  const parsed = parseSeed(text);
  const invalid = text.trim() !== '' && parsed === null;

  return (
    <form
      className="space-y-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (parsed !== null) controller.reset(parsed);
      }}
    >
      <label htmlFor="seed-input" className="block text-xs font-semibold text-gray-300">
        Seed (seed sama = kejadian sama persis)
      </label>
      <div className="flex gap-2">
        <input
          id="seed-input"
          inputMode="numeric"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-invalid={invalid}
          className="w-28 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={parsed === null}
          className={`${BUTTON} bg-gray-700 hover:bg-gray-600`}
        >
          Pakai seed
        </button>
        {tutorialSeed !== undefined && (
          <button
            type="button"
            onClick={() => controller.reset(tutorialSeed)}
            className={`${BUTTON} bg-gray-700 hover:bg-gray-600`}
          >
            Seed tutorial ({tutorialSeed})
          </button>
        )}
      </div>
      {invalid && (
        <p className="text-xs text-red-300">Seed harus bilangan bulat 0 atau lebih.</p>
      )}
      <p className="text-xs text-gray-400">Memakai seed otomatis me-reset simulasi.</p>
    </form>
  );
}

/** Tombol Run/Pause/Step/Reset, pilihan kecepatan, dan isian seed. */
export function ControlBar({ controller, state }: ControlBarProps) {
  const { level, runState, error, speed } = state;
  const canStart =
    level !== null && error === null && (runState === 'idle' || runState === 'paused');

  return (
    <section aria-label="Kontrol simulasi" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {runState === 'running' ? (
          <button
            type="button"
            onClick={() => controller.pause()}
            className={`${BUTTON} bg-amber-600 hover:bg-amber-500`}
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            disabled={!canStart}
            onClick={() => controller.run()}
            className={`${BUTTON} bg-emerald-600 hover:bg-emerald-500`}
          >
            Run
          </button>
        )}
        <button
          type="button"
          disabled={!canStart}
          onClick={() => controller.step()}
          className={`${BUTTON} bg-sky-700 hover:bg-sky-600`}
        >
          Step
        </button>
        <button
          type="button"
          disabled={level === null}
          onClick={() => controller.reset()}
          className={`${BUTTON} bg-gray-700 hover:bg-gray-600`}
        >
          Reset
        </button>
        <span className="ml-auto text-sm text-gray-300">
          Status: <strong>{RUN_STATE_LABEL[runState]}</strong>
          {state.snapshot !== null && <> · tick {state.snapshot.tick}</>}
        </span>
      </div>

      <div role="group" aria-label="Kecepatan" className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-300">Kecepatan</span>
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={speed === value}
            onClick={() => controller.setSpeed(value)}
            className={`${BUTTON} ${
              speed === value ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {value}x
          </button>
        ))}
      </div>

      <SeedField
        key={state.seed}
        controller={controller}
        seed={state.seed}
        tutorialSeed={level?.tutorialSeed}
      />

      {error !== null && (
        <p role="alert" className="rounded border border-red-500 bg-red-950 p-2 text-sm text-red-200">
          {error} Tekan Reset untuk mengulang.
        </p>
      )}
      {runState === 'finished' && error === null && (
        <p className="text-xs text-gray-400">Simulasi selesai. Tekan Reset untuk mengulang.</p>
      )}
    </section>
  );
}
