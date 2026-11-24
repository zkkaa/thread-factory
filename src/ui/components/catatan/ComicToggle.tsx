import type { ReactNode } from 'react';

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900';

interface ComicToggleProps {
  /** Nama sakelar untuk pembaca layar. */
  label: string;
  checked: boolean;
  onToggle: () => void;
  reduceMotion: boolean;
}

/** Sakelar dua segmen "Mati | Hidup"; segmen aktif bertanda warna dan teks. */
export function ComicToggle({
  label,
  checked,
  onToggle,
  reduceMotion,
}: ComicToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`relative grid h-11 w-40 shrink-0 grid-cols-2 rounded-full border-[3px] border-navy-900 bg-[#d9dde3] shadow-[3px_3px_0_#0b1f3a] ${FOCUS}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-[2px] left-[2px] w-[calc(50%-2px)] rounded-full border-[3px] border-navy-900 ${
          reduceMotion ? '' : 'transition-transform'
        } ${checked ? 'translate-x-full bg-[#3fd05b]' : 'translate-x-0 bg-[#6b7280]'}`}
      />
      <span
        className={`relative z-10 grid place-items-center text-sm font-black uppercase ${
          checked ? 'text-navy-700' : 'text-white'
        }`}
      >
        Mati
      </span>
      <span
        className={`relative z-10 grid place-items-center text-sm font-black uppercase ${
          checked ? 'text-navy-900' : 'text-navy-700'
        }`}
      >
        Hidup
      </span>
    </button>
  );
}

type RowIconName = 'speaker' | 'gamepad';

const ROW_ICON_PATHS: Record<RowIconName, string> = {
  speaker: 'M4 9v6h4l5 4V5L8 9H4zM16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12',
  gamepad:
    'M7 9h10a4 4 0 014 4v1a3 3 0 01-5.2 2L14 14h-4l-1.8 2A3 3 0 013 14v-1a4 4 0 014-4zM8 11v3M6.5 12.5h3M15.5 11.5h.01M17.5 13.5h.01',
};

function RowIcon({ name }: { name: RowIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-8 w-8 shrink-0 text-navy-900"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ROW_ICON_PATHS[name]} />
    </svg>
  );
}

interface ComicRowProps {
  icon: RowIconName;
  label: string;
  hint?: string;
  /** id kontrol yang dilabeli; bila ada, label dirender sebagai <label>. */
  htmlFor?: string;
  children: ReactNode;
}

/** Satu baris "buku tulis": ikon, label kapital, kontrol, dan garis di bawahnya. */
export function ComicRow({
  icon,
  label,
  hint,
  htmlFor,
  children,
}: ComicRowProps) {
  const labelClass = 'block font-black uppercase tracking-wide';
  return (
    <div className="flex items-center gap-3 border-b-2 border-navy-900/20 py-3">
      <RowIcon name={icon} />
      <div className="w-32 shrink-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={labelClass}>
            {label}
          </label>
        ) : (
          <p className={labelClass}>{label}</p>
        )}
        {hint && <p className="text-xs leading-tight text-navy-700">{hint}</p>}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {children}
      </div>
    </div>
  );
}
