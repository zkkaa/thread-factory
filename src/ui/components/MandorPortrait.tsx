import type { MandorMood } from '../../levels/types';

interface MandorPortraitProps {
  mood: MandorMood;
  className?: string;
}

/**
 * Potret Pak Mandor. Sementara berupa kotak placeholder; gambar asli (4
 * ekspresi) menggantikannya di U-074. Potret hanya dipakai di lapisan UI
 * (CLAUDE.md aturan 12).
 */
export function MandorPortrait({ mood, className = '' }: MandorPortraitProps) {
  return (
    <div
      role="img"
      aria-label={`Pak Mandor, ekspresi ${mood} (gambar menyusul)`}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy-500 bg-navy-800 text-center ${className}`}
    >
      <span aria-hidden="true" className="text-8xl">
        👷
      </span>
      <span className="text-sm text-ink-300">Pak Mandor ({mood})</span>
    </div>
  );
}
