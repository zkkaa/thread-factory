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
  /**
   * Tanpa sudut membulat dan padding, supaya gambar bisa dipotong sampai
   * tepi layar (dialog S4). Bawaannya false, jadi Beranda tidak berubah.
   */
  bare?: boolean;
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
  bare = false,
}: MandorPortraitProps) {
  const src = portraitSrcFor(mood, sources);

  if (src !== null) {
    const shape = bare ? '' : 'rounded-2xl p-1';
    return (
      <img
        src={src}
        alt={`Pak Mandor, ekspresi ${mood}`}
        draggable={false}
        className={`${shape} object-contain object-bottom ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Pak Mandor, ekspresi ${mood} (gambar menyusul)`}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl text-center ${className}`}
    >
      <span aria-hidden="true" className="text-8xl">
        👷
      </span>
      <span className="text-sm text-ink-300">Pak Mandor ({mood})</span>
    </div>
  );
}