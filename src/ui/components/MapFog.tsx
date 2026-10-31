import type { CSSProperties } from 'react';

interface MapFogProps {
  /**
   * 'back': di bawah bangunan, menutup tepi atas/bawah dan beberapa gumpalan.
   * 'front': di atas bangunan, hanya wisp tipis supaya bangunan tetap jelas.
   */
  layer: 'back' | 'front';
}

const putih = (alpha: number): string => `rgba(255, 255, 255, ${alpha})`;

/** Gumpalan elips lembut; `ukuran` = lebar dan tinggi dalam persen kotak. */
function gumpalan(
  lebar: number,
  tinggi: number,
  x: number,
  y: number,
  alpha: number,
): string {
  return `radial-gradient(ellipse ${lebar}% ${tinggi}% at ${x}% ${y}%, ${putih(alpha)}, ${putih(0)} 70%)`;
}

const BACK: CSSProperties = {
  backgroundImage: [
    `linear-gradient(to bottom, ${putih(0.45)} 0%, ${putih(0)} 32%)`,
    `linear-gradient(to top, ${putih(0.4)} 0%, ${putih(0)} 40%)`,
    gumpalan(38, 22, 12, 24, 0.55),
    gumpalan(34, 20, 88, 30, 0.5),
    gumpalan(45, 16, 50, 62, 0.4),
  ].join(', '),
};

const FRONT: CSSProperties = {
  backgroundImage: [
    gumpalan(30, 12, 28, 78, 0.35),
    gumpalan(32, 12, 74, 72, 0.3),
    gumpalan(26, 8, 52, 10, 0.3),
  ].join(', '),
};

/**
 * Kabut putih di atas peta Pilih Modul supaya tidak terlalu cerah.
 * Dekoratif saja: tidak ada teks, tidak menangkap klik.
 * Kabut ini statis; efek melayang menyusul bersama pengaturan "kurangi animasi".
 */
export function MapFog({ layer }: MapFogProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${
        layer === 'back' ? 'z-[5] opacity-90' : 'z-[15] opacity-70'
      }`}
      style={layer === 'back' ? BACK : FRONT}
    />
  );
}
