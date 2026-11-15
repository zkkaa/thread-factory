import { useState } from 'react';
import type { CompareSession } from '../../../controller/CompareSession';
import type { ControllerState } from '../../../controller/SimulationController';
import { combineFlags } from '../../comparePanel';
import { deriveControls, SPEEDS } from '../../controlState';
import { parseSeed } from '../../parseSeed';
import { PauseIcon, PlayIcon, ResetIcon, StepIcon } from '../icons/glyphs';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';

const CHIP =
  'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400 disabled:cursor-not-allowed disabled:opacity-40';

interface SeedFormProps {
  session: CompareSession;
  seed: number;
  disabled: boolean;
}

/** Isian seed bersama; dipasang ulang (key) tiap seed berubah agar teksnya sinkron. */
function SeedForm({ session, seed, disabled }: SeedFormProps) {
  const [text, setText] = useState(String(seed));
  const parsed = parseSeed(text);
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (parsed !== null) session.reset(parsed);
      }}
    >
      <label htmlFor="compare-seed" className="text-sm text-ink-300">
        Seed
      </label>
      <input
        id="compare-seed"
        inputMode="numeric"
        value={text}
        disabled={disabled}
        aria-invalid={text.trim() !== '' && parsed === null}
        onChange={(event) => setText(event.target.value)}
        className="w-20 rounded border border-navy-500 bg-navy-800 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={disabled || parsed === null}
        className={`${CHIP} bg-sun-400 text-navy-900 hover:bg-sun-500`}
      >
        Pakai
      </button>
    </form>
  );
}

interface CompareControlsProps {
  session: CompareSession;
  stateA: ControllerState;
  stateB: ControllerState;
}

/** Kontrol bersama: Run/Jeda, Step, Reset, kecepatan, seed, dan status. */
export function CompareControls({
  session,
  stateA,
  stateB,
}: CompareControlsProps) {
  const viewA = deriveControls(stateA);
  const viewB = deriveControls(stateB);
  const flags = combineFlags(viewA, viewB);

  return (
    <section
      aria-label="Kontrol bersama"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-navy-500 bg-navy-900/90 p-2"
    >
      {flags.showPause ? (
        <IconButton
          label="Jeda kedua sisi"
          icon={<PauseIcon />}
          tone="primary"
          onClick={() => session.pause()}
        />
      ) : (
        <IconButton
          label="Jalankan kedua sisi"
          icon={<PlayIcon />}
          tone="primary"
          disabled={!flags.canTogglePlay}
          onClick={() => session.run()}
        />
      )}
      <IconButton
        label="Step kedua sisi"
        icon={<StepIcon />}
        disabled={!flags.canStep}
        onClick={() => session.step()}
      />
      <IconButton
        label="Reset kedua sisi"
        icon={<ResetIcon />}
        disabled={!flags.canReset}
        onClick={() => session.reset()}
      />

      <div role="group" aria-label="Kecepatan" className="flex gap-1">
        {SPEEDS.map((value) => (
          <Tooltip key={value} label={`Kecepatan ${value}x`} placement="bottom">
            <button
              type="button"
              aria-pressed={stateA.speed === value}
              onClick={() => session.setSpeed(value)}
              className={`${CHIP} ${
                stateA.speed === value
                  ? 'bg-sun-400 text-navy-900'
                  : 'border border-navy-500 bg-navy-800 hover:bg-navy-700'
              }`}
            >
              {value}x
            </button>
          </Tooltip>
        ))}
      </div>

      <SeedForm
        key={stateA.seed}
        session={session}
        seed={stateA.seed}
        disabled={!flags.canChangeSeed}
      />

      <span className="rounded-lg border border-navy-500 px-3 py-1.5 text-sm font-semibold text-ink-100">
        A: {viewA.statusText} · B: {viewB.statusText}
      </span>
    </section>
  );
}