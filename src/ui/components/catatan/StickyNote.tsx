import { useState } from 'react';
import type { ReactNode } from 'react';
import { UI_ASSETS } from '../../uiAssets';

interface StickyNoteProps {
  /** Nama bagian untuk pembaca layar. */
  label: string;
  children: ReactNode;
}

/** Kertas kuning sobek (catatan-kuning.png); isinya ditumpuk di atas gambar. */
export function StickyNote({ label, children }: StickyNoteProps) {
  // Bila gambar gagal dimuat, kertas digambar dengan CSS (placeholder).
  const [failed, setFailed] = useState(false);

  return (
    <section
      aria-label={label}
      className="relative aspect-square w-72 shrink-0 self-start"
    >
      {failed ? (
        <div
          aria-hidden="true"
          className="absolute inset-3 rotate-2 rounded-md border-[3px] border-navy-900 bg-[#f7d65a] shadow-[4px_4px_0_#0b1f3a]"
        />
      ) : (
        <img
          src={UI_ASSETS.catatanKuning}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full select-none object-contain"
        />
      )}
      <div className="relative flex h-full flex-col items-center justify-center gap-2 px-[15%] py-[13%] text-center text-navy-900">
        {children}
      </div>
    </section>
  );
}
