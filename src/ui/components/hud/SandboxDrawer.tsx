import { useState } from 'react';
import { sandboxParamsFor, type SandboxValues } from '../../../levels/sandbox';
import { changeValue, currentNumber, stepValue } from '../../sandboxPanel';

interface SandboxDrawerProps {
  levelId: string;
  values: SandboxValues;
  /** Pesan kesalahan dari penerapan parameter; null bila tidak ada. */
  error: string | null;
  onChange: (values: SandboxValues) => void;
  onReset: () => void;
}

const STEP_BUTTON =
  'rounded border border-navy-500 bg-navy-700 px-2 py-0.5 text-xs font-bold hover:bg-navy-500 disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Laci Parameter Sandbox (S11). Mengubah parameter memuat ulang level dari awal
 * dan melepas alat yang terpasang. Tanpa aturan permainan di sini; batas nilai
 * dan penerapan ada di levels/sandbox.ts.
 */
export function SandboxDrawer({
  levelId,
  values,
  error,
  onChange,
  onReset,
}: SandboxDrawerProps) {
  const [open, setOpen] = useState(true);
  const defs = sandboxParamsFor(levelId);
  const hasPolicy = defs.some((def) => def.kind === 'choice');

  return (
    <section
      aria-label="Parameter Sandbox"
      className="space-y-2 rounded-lg border border-sun-500 bg-navy-900/90 p-3 text-ink-100 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-sun-400">Parameter Sandbox</h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={STEP_BUTTON}
        >
          {open ? 'Lipat' : 'Buka'}
        </button>
      </div>

      {open && (
        <>
          <p className="text-xs text-ink-300">
            Mengubah parameter memuat ulang level dan melepas alat. Tanpa
            bintang.
          </p>
          {defs.map((def) =>
            def.kind === 'number' ? (
              <div
                key={def.key}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span>{def.label}</span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Kurangi ${def.label}`}
                    disabled={currentNumber(def, values) <= def.min}
                    onClick={() =>
                      onChange(stepValue(levelId, values, def.key, -1))
                    }
                    className={STEP_BUTTON}
                  >
                    -
                  </button>
                  <span
                    data-testid={`sandbox-${def.key}`}
                    className="w-6 text-center font-bold text-sun-400"
                  >
                    {currentNumber(def, values)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Tambah ${def.label}`}
                    disabled={currentNumber(def, values) >= def.max}
                    onClick={() =>
                      onChange(stepValue(levelId, values, def.key, 1))
                    }
                    className={STEP_BUTTON}
                  >
                    +
                  </button>
                </span>
              </div>
            ) : (
              <label
                key={def.key}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span>{def.label}</span>
                <select
                  aria-label={def.label}
                  value={String(values[def.key] ?? def.initial)}
                  onChange={(event) =>
                    onChange(
                      changeValue(levelId, values, def.key, event.target.value),
                    )
                  }
                  className="rounded border border-navy-500 bg-navy-800 px-1 py-0.5"
                >
                  {def.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ),
          )}
          {hasPolicy && (
            <p className="text-xs text-ink-300">
              Kebijakan kunci diatur di sini dan menimpa pilihan di toolbox.
            </p>
          )}
          <button type="button" onClick={onReset} className={STEP_BUTTON}>
            Kembalikan nilai awal
          </button>
        </>
      )}
      {error !== null && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
