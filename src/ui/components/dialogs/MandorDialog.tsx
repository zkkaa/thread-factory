import { useEffect, useState } from 'react';
import type { IntroPage } from '../../../levels/types';
import { pageInfo } from '../../dialogPages';
import { MandorPortrait } from '../MandorPortrait';

interface MandorDialogProps {
  pages: readonly IntroPage[];
  /** Judul pill di atas gelembung, mis. "Level 1-1: Bug Papan Stok". */
  title?: string;
  /** Dipanggil saat tombol "Mulai" (halaman terakhir) ditekan. */
  onFinish: () => void;
  /** Dipanggil saat "Lewati" ditekan atau Esc. */
  onSkip: () => void;
}

/*
 * Posisi dan ukuran dipusatkan di sini supaya mudah disetel setelah dilihat
 * di browser. Semuanya relatif terhadap area dialog, jadi ikut skala layar.
 *
 * - Potret: tinggi 92% area, digeser ke kiri dan ke bawah sehingga
 *   terpotong tepi layar seperti mockup.
 * - Bubble: di kanan, mulai sekitar sepertiga dari atas.
 */
const PORTRAIT_CLASS =
  'absolute bottom-0 left-30 z-0 h-[92%] w-auto max-w-none  translate-y-[2%]';
const BUBBLE_CLASS =
  'absolute right-[14%] top-[24%] z-10 w-[52%] max-w-xl';

/**
 * Dialog bergaya komik Pak Mandor (S4): potret besar menempel di kiri-bawah,
 * gelembung krem di kanan dengan ekor menunjuk ke karakter. Tombol
 * Lanjut/Mulai mendapat fokus awal; Esc sama dengan Lewati.
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
      className="relative h-full w-full overflow-hidden"
    >
      <MandorPortrait
        bare
        mood={page.mood ?? 'netral'}
        className={PORTRAIT_CLASS}
      />

      <div className={BUBBLE_CLASS}>
        <div className="relative rounded-4xl border-[3px] border-navy-900 bg-cream-50 p-6 text-navy-900 shadow-2xl">
          {/* Ekor bubble: kotak diputar 45 derajat, hanya dua sisinya berborder. */}
          <div
            aria-hidden="true"
            className="absolute -left-3 top-[28%] h-6 w-6 rotate-45 border-b-[3px] border-l-[3px] border-navy-900 bg-cream-50"
          />

          {title !== undefined && (
            <p className="mb-4 inline-block rounded-xl bg-navy-800 px-5 py-2 text-lg font-extrabold text-white">
              {title}
            </p>
          )}

          <p className="text-lg leading-relaxed">{page.text}</p>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-navy-500">
              {info.label}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="rounded px-2 py-1 text-sm font-semibold text-navy-500 underline-offset-2 hover:text-navy-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800"
              >
                Lewati
              </button>
              <button
                type="button"
                autoFocus
                onClick={() =>
                  info.isLast ? onFinish() : setIndex(info.index + 1)
                }
                className="flex items-center gap-2 rounded-full bg-navy-800 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800"
              >
                <span>{info.isLast ? 'Mulai' : 'Lanjut'}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}