import { MANDOR_AVATAR } from '../mandorPortraits';

/**
 * Avatar kepala Pak Mandor untuk ikon tombol petunjuk. Dekoratif: tombol
 * pembungkusnya (IconButton) sudah punya aria-label.
 */
export function MandorAvatar() {
  return (
    <img
      src={MANDOR_AVATAR}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-8 w-8 rounded-full object-cover"
    />
  );
}
