import { useState } from 'react';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import { deriveControls, SPEEDS, type StatusKind } from '../../controlState';
import { parseSeed } from '../../parseSeed';
import { PauseIcon, PlayIcon, ResetIcon, StepIcon } from '../icons/glyphs';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';

const CHIP =
  'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400 disabled:cursor-not-allowed disabled:opacity-40';

// Status selalu punya teks; warna hanya penegas (CLAUDE.md aturan 8).
const STATUS_TONE: Record<StatusKind, string> = {
  idle: 'border-navy-500 text-ink-100',
  running: 'border-sun-400 text-sun-400',
  paused: 'border-sun-500 text-sun-500',
  finished: 'border-ink-300 text-ink-300',
  error: 'border-ember-500 text-ember-500',
};

interface SeedChipProps {
  controller: SimulationController;
  seed: number;
  tutorialSeed: number | undefined;
  disabled: boolean;
}

/**
 * Chip seed: diklik untuk membuka isian. Dipasang ulang (key) tiap seed
 * controller berubah supaya teksnya selalu sinkron. Esc menutup isian.
 */
function SeedChip({ controller, seed, tutorialSeed, disabled }: SeedChipProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(String(seed));
  const parsed = parseSeed(text);
  const invalid = text.trim() !== '' && parsed === null;

  const apply = (value: number) => {
    controller.reset(value);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Tooltip
        label="Ubah seed (otomatis me-reset simulasi)"
        placement="bottom"
      >
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-label={`Ubah seed, sekarang ${seed}`}
          onClick={() => setOpen((value) => !value)}
          className={`${CHIP} border border-navy-500 bg-navy-800 hover:bg-navy-700`}
        >
          Seed {seed}
        </button>
      </Tooltip>

      {open && (
        <form
          className="absolute right-0 top-full z-10 mt-2 w-64 space-y-2 rounded-lg border border-navy-500 bg-navy-900 p-3 shadow-lg"
          onSubmit={(event) => {
            event.preventDefault();
            if (parsed !== null) apply(parsed);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          <label
            htmlFor="hud-seed-input"
            className="block text-xs font-semibold text-ink-300"
          >
            Seed sama = kejadian sama persis
          </label>
          <input
            id="hud-seed-input"
            autoFocus
            inputMode="numeric"
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-invalid={invalid}
            className="w-full rounded border border-navy-500 bg-navy-800 px-2 py-1 text-sm text-ink-100"
          />
          {invalid && (
            <p className="text-xs text-ember-500">
              Seed harus bilangan bulat 0 atau lebih.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={parsed === null}
              className={`${CHIP} bg-sun-400 text-navy-900 hover:bg-sun-500`}
            >
              Pakai
            </button>
            {tutorialSeed !== undefined && (
              <button
                type="button"
                onClick={() => apply(tutorialSeed)}
                className={`${CHIP} border border-navy-500 bg-navy-800 hover:bg-navy-700`}
              >
                Seed tutorial ({tutorialSeed})
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

interface ControlHudProps {
  controller: SimulationController;
  state: ControllerState;
}

/**
 * Kontrol simulasi di HUD kanan atas (PRD 17.2): toggle Play/Pause, Step,
 * Reset, chip kecepatan, chip seed, dan chip status dengan tick.
 */
export function ControlHud({ controller, state }: ControlHudProps) {
  const view = deriveControls(state);

  return (
    <section aria-label="Kontrol simulasi" className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl border border-navy-500 bg-navy-900/90 p-2 shadow-lg">
        {view.showPause ? (
          <IconButton
            label="Jeda"
            icon={<PauseIcon />}
            tone="primary"
            onClick={() => controller.pause()}
          />
        ) : (
          <IconButton
            label="Jalankan"
            icon={<PlayIcon />}
            tone="primary"
            disabled={!view.canTogglePlay}
            onClick={() => controller.run()}
          />
        )}
        <IconButton
          label="Step"
          icon={<StepIcon />}
          disabled={!view.canStep}
          onClick={() => controller.step()}
        />
        <IconButton
          label="Reset"
          icon={<ResetIcon />}
          disabled={!view.canReset}
          onClick={() => controller.reset()}
        />

        <div role="group" aria-label="Kecepatan" className="flex gap-1">
          {SPEEDS.map((value) => (
            <Tooltip
              key={value}
              label={`Kecepatan ${value}x`}
              placement="bottom"
            >
              <button
                type="button"
                aria-pressed={state.speed === value}
                onClick={() => controller.setSpeed(value)}
                className={`${CHIP} ${
                  state.speed === value
                    ? 'bg-sun-400 text-navy-900'
                    : 'border border-navy-500 bg-navy-800 hover:bg-navy-700'
                }`}
              >
                {value}x
              </button>
            </Tooltip>
          ))}
        </div>

        <SeedChip
          key={state.seed}
          controller={controller}
          seed={state.seed}
          tutorialSeed={state.level?.tutorialSeed}
          disabled={!view.canChangeSeed}
        />

        <span
          data-status={view.status}
          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${STATUS_TONE[view.status]}`}
        >
          {view.statusText}
        </span>
      </div>

      {/* Sementara; diganti panel error bergaya baru pada U-042. */}
      {state.error !== null && (
        <p
          role="alert"
          className="rounded-lg border border-ember-500 bg-navy-900 p-2 text-sm text-ember-500"
        >
          {state.error} Tekan Reset untuk mengulang.
        </p>
      )}
    </section>
  );
}
