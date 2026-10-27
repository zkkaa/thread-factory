import { useEffect } from 'react';
import { MandorPortrait } from '../MandorPortrait';

interface HintDialogProps {
  /** Petunjuk yang sudah dibuka, urut dari samar. */
  hints: readonly string[];
  hasMore: boolean;
  onMore: () => void;
  onClose: () => void;
}

/** Dialog "Tanya Pak Mandor": petunjuk dibuka satu per satu. Esc = Tutup. */
export function HintDialog({
  hints,
  hasMore,
  onMore,
  onClose,
}: HintDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-title"
        className="flex w-full max-w-2xl gap-4 rounded-2xl border-2 border-navy-500 bg-navy-900 p-5 text-ink-100 shadow-xl"
      >
        <MandorPortrait mood="berpikir" className="h-40 w-32 shrink-0" />
        <div className="flex-1 space-y-3">
          <h2 id="hint-title" className="text-base font-bold text-sun-400">
            Petunjuk Pak Mandor
          </h2>
          {hints.length === 0 ? (
            <p className="text-sm">Belum ada petunjuk untuk level ini.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
              {hints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ol>
          )}
          <div className="flex justify-end gap-2">
            {hasMore && (
              <button
                type="button"
                autoFocus
                onClick={onMore}
                className="rounded bg-sun-400 px-3 py-1.5 text-sm font-semibold text-navy-900 hover:bg-sun-500"
              >
                Petunjuk berikutnya
              </button>
            )}
            <button
              type="button"
              autoFocus={!hasMore}
              onClick={onClose}
              className="rounded border border-navy-500 px-3 py-1.5 text-sm hover:bg-navy-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
