import { useState } from 'react';
import { sandboxParamsFor, type SandboxValues } from '../../../levels/sandbox';
import {
  COMIC_FIELD,
  COMIC_PILL_BUTTON,
  COMIC_ROUND_BUTTON,
  COMIC_STICKER_BUTTON,
} from '../../comicStyles';
import { limitLabel } from '../../limitLabel';
import { MANDOR_AVATAR } from '../../mandorPortraits';
import { changeValue, currentNumber, stepValue } from '../../sandboxPanel';
import { ComicCard } from '../comic/ComicCard';
import { ComicImage } from '../comic/ComicImage';

interface SandboxDrawerProps {
  levelId: string;
  values: SandboxValues;
  error: string | null;
  onChange: (values: SandboxValues) => void;
  onReset: () => void;
}

// Laci Parameter di arena Sandbox (dan panel Bandingkan): pemain mengubah
// angka dan kebijakan lalu level dimuat ulang.
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
    <ComicCard
      ariaLabel="Parameter Sandbox"
      title="Parameter Sandbox"
      headerAction={
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={COMIC_PILL_BUTTON}
        >
          {open ? 'Lipat' : 'Buka'}
        </button>
      }
    >
      {open && (
        <div className="flex max-h-[40vh] flex-col gap-2.5 overflow-y-auto px-1 pb-1">
          <div className="flex items-center gap-2">
            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-[3px] border-navy-900 bg-sun-400">
              <ComicImage
                src={MANDOR_AVATAR}
                className="h-full w-full object-cover object-top"
              />
            </span>
            <p className="relative flex-1 rounded-2xl border-2 border-navy-900 bg-white px-2.5 py-1.5 text-[11px] font-semibold leading-snug">
              <span
                aria-hidden="true"
                className="absolute -left-1.5 top-3 h-2.5 w-2.5 rotate-45 border-b-2 border-l-2 border-navy-900 bg-white"
              />
              Mengubah parameter memuat ulang level dan melepas alat. Tanpa
              bintang.
            </p>
          </div>

          {defs.map((def) =>
            def.kind === 'number' ? (
              <div
                key={def.key}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 flex-1 text-[13px] font-extrabold leading-tight">
                  {def.label}
                </span>
                <span className="flex items-start gap-1.5">
                  <button
                    type="button"
                    aria-label={`Kurangi ${def.label}`}
                    disabled={currentNumber(def, values) <= def.min}
                    onClick={() =>
                      onChange(stepValue(levelId, values, def.key, -1))
                    }
                    className={COMIC_ROUND_BUTTON}
                  >
                    -
                  </button>
                  <span className="flex w-10 flex-col items-center">
                    <span
                      data-testid={`sandbox-${def.key}`}
                      className="w-full rounded-lg border-[3px] border-navy-900 bg-white text-center text-lg font-black leading-6"
                    >
                      {currentNumber(def, values)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-3 text-[9px] font-black leading-3"
                    >
                      {limitLabel(currentNumber(def, values), def.min, def.max)}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Tambah ${def.label}`}
                    disabled={currentNumber(def, values) >= def.max}
                    onClick={() =>
                      onChange(stepValue(levelId, values, def.key, 1))
                    }
                    className={COMIC_ROUND_BUTTON}
                  >
                    +
                  </button>
                </span>
              </div>
            ) : (
              <label
                key={def.key}
                className="flex flex-col gap-1 text-[13px] font-extrabold leading-tight"
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
                  className={COMIC_FIELD}
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
            <p className="text-[11px] font-semibold leading-snug text-navy-700">
              Kebijakan kunci diatur di sini dan menimpa pilihan di toolbox.
            </p>
          )}

          <button
            type="button"
            onClick={onReset}
            className={COMIC_STICKER_BUTTON}
          >
            <span aria-hidden="true">↻ </span>
            Kembalikan nilai awal
          </button>
        </div>
      )}

      {error !== null && (
        <p
          role="alert"
          className="rounded-lg border-[3px] border-navy-900 bg-red-100 px-2 py-1 text-xs font-bold text-red-800 shadow-[2px_2px_0_#0b1f3a]"
        >
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </ComicCard>
  );
}
