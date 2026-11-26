import { COMIC_SHADOW } from '../comicAssets';
import type { PreloadProgress } from '../preloadAssets';

interface BootScreenProps {
  progress: PreloadProgress;
}

// Layar muat awal. Sengaja hanya memakai CSS (tanpa gambar) karena gambar
// belum tersedia saat layar ini tampil.
export function BootScreen({ progress }: BootScreenProps) {
  const percent =
    progress.total === 0
      ? 100
      : Math.round((progress.done / progress.total) * 100);

  return (
    <main className="relative isolate grid h-screen place-items-center overflow-hidden bg-navy-900 text-navy-900">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30 [background-image:radial-gradient(#2b5a9a_1.5px,transparent_1.5px)] [background-size:10px_10px]"
      />
      <div
        role="status"
        className={`relative flex w-[min(28rem,86vw)] flex-col gap-4 rounded-2xl border-[3px] border-navy-900 bg-cream-50 px-6 py-6 ${COMIC_SHADOW.lg}`}
      >
        <h1
          className={`self-start -skew-x-6 border-[3px] border-navy-900 bg-sun-400 px-4 py-1 ${COMIC_SHADOW.md}`}
        >
          <span className="block skew-x-6 text-xl font-black italic">
            THREAD FACTORY
          </span>
        </h1>
        <p className="text-sm font-bold">Memuat aset pabrik...</p>
        <div
          role="progressbar"
          aria-label="Memuat aset permainan"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-5 overflow-hidden rounded-full border-[3px] border-navy-900 bg-ink-300"
        >
          <div className="h-full bg-sun-400" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs font-semibold">{percent}%</p>
      </div>
    </main>
  );
}
