// Memuat gambar lebih awal supaya perpindahan layar tidak menunggu jaringan.
// Hasil unduhan disimpan di cache HTTP browser (aturan cache: vercel.json),
// sehingga saat <img> dibuat nanti gambarnya sudah ada.

export interface PreloadProgress {
  done: number;
  total: number;
}

export type ImagePriority = 'high' | 'low';

export type ImageLoader = (
  url: string,
  priority: ImagePriority,
) => Promise<void>;

export interface PreloadOptions {
  /** Jumlah unduhan bersamaan. */
  concurrency?: number;
  priority?: ImagePriority;
  /** Bisa diganti pada tes. */
  loader?: ImageLoader;
  onProgress?: (progress: PreloadProgress) => void;
}

// Selalu selesai (tidak pernah menolak): gambar yang gagal dimuat cukup
// dilewati, karena komponen punya fallback sendiri (lihat ComicImage).
export const browserImageLoader: ImageLoader = (url, priority) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.setAttribute('fetchpriority', priority);
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });

export async function preloadImages(
  urls: readonly string[],
  options: PreloadOptions = {},
): Promise<void> {
  const {
    concurrency = 4,
    priority = 'low',
    loader = browserImageLoader,
    onProgress,
  } = options;

  const queue = Array.from(new Set(urls));
  const total = queue.length;
  let cursor = 0;
  let done = 0;
  onProgress?.({ done, total });

  const worker = async (): Promise<void> => {
    while (cursor < total) {
      const url = queue[cursor];
      cursor += 1;
      if (url === undefined) continue;
      try {
        await loader(url, priority);
      } catch {
        // Satu gambar gagal tidak boleh menghentikan yang lain.
      }
      done += 1;
      onProgress?.({ done, total });
    }
  };

  const workers = Math.max(1, Math.min(concurrency, total));
  await Promise.all(Array.from({ length: workers }, () => worker()));
}

// Menjalankan tugas saat browser menganggur; mengembalikan fungsi pembatal.
export function scheduleIdle(task: () => void, timeoutMs = 1500): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 300);
  return () => window.clearTimeout(id);
}
