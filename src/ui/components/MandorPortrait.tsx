import type { MandorMood } from '../../levels/types';
import {
  MANDOR_PORTRAITS,
  portraitSrcFor,
  type PortraitSources,
} from '../mandorPortraits';

interface MandorPortraitProps {
  mood: MandorMood;
  className?: string;
  /** Daftar gambar; bawaannya data aktual (diganti hanya oleh tes). */
  sources?: PortraitSources;
}

/**
 * Potret Pak Mandor. Memakai gambar bila ada (U-074); bila belum, tampil
 * placeholder bertuliskan ekspresinya. Potret hanya dipakai di lapisan UI
 * (CLAUDE.md aturan 12).
 */
export function MandorPortrait({
  mood,
  className = '',
  sources = MANDOR_PORTRAITS,
}: MandorPortraitProps) {
  const src = portraitSrcFor(mood, sources);

  if (src !== null) {
    return (
      <img
        src={src}
        alt={`Pak Mandor, ekspresi ${mood}`}
        draggable={false}
        className={`rounded-2xl border-2 border-navy-500 bg-navy-800 object-contain object-bottom p-1 ${className}`}
      />
    );
  }

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
