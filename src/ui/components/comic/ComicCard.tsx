import type { ReactNode } from 'react';
import { COMIC_SHADOW } from '../../comicAssets';

interface ComicCardProps {
  title: string;
  ariaLabel: string;
  /** Tombol kecil di sudut kanan atas (mis. Lipat). */
  headerAction?: ReactNode;
  children: ReactNode;
}

// Kartu krem berbingkai navy tebal dengan pita judul miring di sudut kiri atas.
// Dasar untuk panel bergaya komik di HUD (laci Parameter, nanti Misi dan Log).
export function ComicCard({
  title,
  ariaLabel,
  headerAction,
  children,
}: ComicCardProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={`relative rounded-2xl border-[3px] border-navy-900 bg-cream-50 px-3 pb-3 pt-7 text-navy-900 ${COMIC_SHADOW.lg}`}
    >
      <h2
        className={`absolute -left-1.5 -top-4 -skew-x-6 border-[3px] border-navy-900 bg-sun-400 px-3 py-0.5 ${COMIC_SHADOW.sm}`}
      >
        <span className="block skew-x-6 text-sm font-black italic">
          {title}
        </span>
      </h2>
      {headerAction !== undefined && (
        <div className="absolute -right-1.5 -top-3.5">{headerAction}</div>
      )}
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}
