interface ErrorPanelProps {
  message: string;
  onReset: () => void;
}

/** Panel error engine (PRD 17.2). Run dan Step terkunci sampai Reset. */
export function ErrorPanel({ message, onReset }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="max-w-sm space-y-2 rounded-lg border-2 border-ember-500 bg-navy-900 p-3 text-sm text-ink-100 shadow-lg"
    >
      <p className="font-bold text-ember-500">
        <span aria-hidden="true">⚠ </span>
        Simulasi berhenti karena error
      </p>
      <p>{message}</p>
      <p className="text-xs text-ink-300">Tekan Reset untuk mengulang.</p>
      <button
        type="button"
        onClick={onReset}
        className="rounded bg-sun-400 px-3 py-1.5 text-sm font-semibold text-navy-900 hover:bg-sun-500"
      >
        Reset
      </button>
    </div>
  );
}
