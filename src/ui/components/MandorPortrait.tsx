import {
  CHARACTERS,
  HOME_CHARACTER,
  type CharacterId,
} from '../../levels/characters';
import type { MandorMood } from '../../levels/types';
import {
  portraitSourcesFor,
  portraitSrcFor,
  type PortraitSources,
} from '../mandorPortraits';

interface MandorPortraitProps {
  mood: MandorMood;
  /** Karakter pemandu; bawaannya karakter Beranda. */
  character?: CharacterId;
  className?: string;
  /** Daftar gambar; bawaannya potret `character` (diganti hanya oleh tes). */
  sources?: PortraitSources;
  /**
   * Tanpa sudut membulat dan padding, supaya gambar bisa dipotong sampai
   * tepi layar (dialog S4). Bawaannya false, jadi Beranda tidak berubah.
   */
  bare?: boolean;
}

/**
 * Potret karakter pemandu. Memakai gambar bila ada; bila belum, tampil
 * placeholder bertuliskan ekspresinya. Potret hanya dipakai di lapisan UI
 * (CLAUDE.md aturan 12).
 */
export function MandorPortrait({
  mood,
  character = HOME_CHARACTER,
  className = '',
  sources,
  bare = false,
}: MandorPortraitProps) {
  const name = CHARACTERS[character].name;
  const src = portraitSrcFor(mood, sources ?? portraitSourcesFor(character));

  if (src !== null) {
    const shape = bare ? '' : 'rounded-2xl p-1';
    return (
      <img
        src={src}
        alt={`${name}, ekspresi ${mood}`}
        draggable={false}
        className={`${shape} object-contain object-bottom ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${name}, ekspresi ${mood} (gambar menyusul)`}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl text-center ${className}`}
    >
      <span aria-hidden="true" className="text-8xl">
        👷
      </span>
      <span className="text-sm text-ink-300">
        {name} ({mood})
      </span>
    </div>
  );
}
