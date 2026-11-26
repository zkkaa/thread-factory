import { useState } from 'react';

interface ComicImageProps {
  src: string;
  className?: string;
  alt?: string;
}

// Gambar yang menghilang sendiri bila berkasnya tidak ada, supaya layar
// tetap rapi (fallback berupa warna atau gradasi dari elemen induk).
export function ComicImage({ src, className, alt = '' }: ComicImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}