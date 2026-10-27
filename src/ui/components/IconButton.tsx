import type { ReactNode } from 'react';
import { Tooltip, type TooltipPlacement } from './Tooltip';

export type IconButtonTone = 'default' | 'primary' | 'danger';

interface IconButtonProps {
  /**
   * Wajib. Menjadi aria-label (nama tombol untuk pembaca layar) sekaligus
   * isi tooltip (CLAUDE.md aturan 11).
   */
  label: string;
  /** Ikon dari components/icons, mis. <PlayIcon />. */
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: IconButtonTone;
  placement?: TooltipPlacement;
  className?: string;
}

const TONE: Record<IconButtonTone, string> = {
  default: 'border border-navy-500 bg-navy-800 text-ink-100 hover:bg-navy-700',
  primary: 'bg-sun-400 text-navy-900 hover:bg-sun-500',
  danger:
    'border border-ember-500 bg-navy-900 text-ember-500 hover:bg-navy-800',
};

/** Tombol berikon dengan tooltip. Setiap tombol ikon di game memakai ini. */
export function IconButton({
  label,
  icon,
  onClick,
  disabled = false,
  tone = 'default',
  placement = 'bottom',
  className = '',
}: IconButtonProps) {
  return (
    <Tooltip label={label} placement={placement}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400 disabled:cursor-not-allowed disabled:opacity-40 ${TONE[tone]} ${className}`}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
