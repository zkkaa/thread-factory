import { useEffect, useState } from 'react';
import type { IntroPage } from '../../../levels/types';
import { pageInfo } from '../../dialogPages';
import { MandorPortrait } from '../MandorPortrait';

interface MandorDialogProps {
  pages: readonly IntroPage[];
  /** Judul kecil di atas gelembung, mis. "Level 1-1: Bug Papan Stok". */
  title?: string;
  /** Dipanggil saat tombol "Mulai" (halaman terakhir) ditekan. */
  onFinish: () => void;
  /** Dipanggil saat "Lewati" ditekan atau Esc. */
  onSkip: () => void;
}

/**
 * Dialog bergaya komik Pak Mandor (S4): potret besar di kiri, gelembung di
 * kanan. Tombol Lanjut/Mulai mendapat fokus awal; Esc sama dengan Lewati.
 * Belum ada animasi, jadi pengaturan "kurangi animasi" belum berpengaruh di
 * sini; dikerjakan bersama efek lain di U-076.
 */
export function MandorDialog({
  pages,
  title,
  onFinish,
  onSkip,
}: MandorDialogProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  const info = pageInfo(index, pages.length);
  const page = pages[info.index];
  if (page === undefined) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dialog Pak Mandor"
      className="flex h-full w-full items-center justify-center gap-6 p-8 text-ink-100"
    >
      <MandorPortrait
        mood={page.mood ?? 'netral'}
        className="h-96 w-72 shrink-0"
      />
      <div className="w-full max-w-xl space-y-4 rounded-2xl border-2 border-navy-500 bg-navy-900 p-6 shadow-xl">
        {title !== undefined && (
          <p className="text-sm font-bold text-sun-400">{title}</p>
        )}
        <p className="text-lg leading-relaxed">{page.text}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-300">{info.label}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="rounded border border-navy-500 px-3 py-1.5 text-sm hover:bg-navy-700"
            >
              Lewati
            </button>
            <button
              type="button"
              autoFocus
              onClick={() =>
                info.isLast ? onFinish() : setIndex(info.index + 1)
              }
              className="rounded bg-sun-400 px-4 py-1.5 text-sm font-semibold text-navy-900 hover:bg-sun-500"
            >
              {info.isLast ? 'Mulai' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
