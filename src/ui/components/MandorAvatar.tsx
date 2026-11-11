import { HOME_CHARACTER, type CharacterId } from '../../levels/characters';
import { portraitSourcesFor } from '../mandorPortraits';

interface MandorAvatarProps {
  /** Karakter pemandu; bawaannya karakter Beranda. */
  character?: CharacterId;
}

/**
 * Avatar kepala karakter pemandu untuk ikon tombol petunjuk. Memakai potret
 * netral yang dipotong ke bagian atas. Dekoratif: tombol pembungkusnya
 * (IconButton) sudah punya aria-label.
 */
export function MandorAvatar({
  character = HOME_CHARACTER,
}: MandorAvatarProps) {
  const src = portraitSourcesFor(character).netral;
  return (
    <img
      src={src ?? ''}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-8 w-8 rounded-full object-cover object-top"
    />
  );
}
