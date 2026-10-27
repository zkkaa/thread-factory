import { useEffect } from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMap: () => void;
  onSettings: () => void;
}

const BUTTON =
  'w-full rounded border border-navy-500 bg-navy-700 px-4 py-2 text-sm font-semibold hover:bg-navy-500';

/**
 * Menu Jeda (S13): dialog di atas Arena dengan empat pilihan.
 * Esc sama dengan "Lanjut". Tombol Lanjut mendapat fokus awal.
 */
export function PauseMenu({
  onResume,
  onRestart,
  onMap,
  onSettings,
}: PauseMenuProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onResume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResume]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu Jeda"
        className="w-72 space-y-3 rounded-lg border border-navy-500 bg-navy-900 p-5 text-ink-100 shadow-xl"
      >
        <h2 className="text-center text-lg font-bold">Jeda</h2>
        <button type="button" autoFocus onClick={onResume} className={BUTTON}>
          Lanjut
        </button>
        <button type="button" onClick={onRestart} className={BUTTON}>
          Ulangi Level
        </button>
        <button type="button" onClick={onMap} className={BUTTON}>
          Peta Level
        </button>
        <button type="button" onClick={onSettings} className={BUTTON}>
          Pengaturan
        </button>
      </div>
    </div>
  );
}
