import type { ReactNode } from 'react';

export interface IconProps {
  /** Sisi ikon dalam piksel (ikon berbentuk persegi). */
  size?: number;
  className?: string;
}

interface IconBaseProps extends IconProps {
  /** True: bentuk padat (fill). False: bentuk garis (stroke). */
  filled?: boolean;
  children: ReactNode;
}

/**
 * Kerangka semua ikon. Warna mengikuti teks sekitarnya (currentColor), dan
 * ikon disembunyikan dari pembaca layar karena nama tombolnya ada di
 * aria-label IconButton (CLAUDE.md aturan 11).
 */
export function IconBase({
  size = 24,
  className,
  filled = false,
  children,
}: IconBaseProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}
