interface MapPinProps {
  className?: string;
}

/**
 * Pin lokasi kuning penanda modul terpilih di denah (S2). Dekoratif: arti
 * "Dipilih" disampaikan lewat teks sr-only dan aria-pressed pada tombolnya.
 */
export function MapPin({ className = '' }: MapPinProps) {
  return (
    <span className={`pointer-events-none inline-block ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 36 46"
        className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]"
      >
        <path
          d="M18 2C9.2 2 2 9.1 2 17.9c0 11.8 16 26.1 16 26.1s16-14.3 16-26.1C34 9.1 26.8 2 18 2z"
          className="fill-sun-400 stroke-navy-900"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle
          cx="18"
          cy="18"
          r="6.5"
          className="fill-cream-50 stroke-navy-900"
          strokeWidth="2.5"
        />
      </svg>
      <span className="sr-only">Dipilih</span>
    </span>
  );
}
