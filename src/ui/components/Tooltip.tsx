import type { ReactNode } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: string;
  placement?: TooltipPlacement;
  children: ReactNode;
}

const PLACEMENT: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

/**
 * Tooltip murni CSS: muncul saat hover dan saat fokus keyboard pada isinya.
 * Tanpa animasi, jadi tidak perlu mengikuti "kurangi animasi". Hanya bantuan
 * visual (aria-hidden): nama untuk pembaca layar harus ada di aria-label
 * elemen yang dibungkus (lihat IconButton).
 */
export function Tooltip({ label, placement = 'top', children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none invisible absolute z-50 rounded-md border border-navy-500 bg-navy-900 px-2 py-1 text-xs font-semibold whitespace-nowrap text-ink-100 opacity-0 group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100 group-hover:visible group-hover:opacity-100 ${PLACEMENT[placement]}`}
      >
        {label}
      </span>
    </span>
  );
}
