import { useEffect, useState } from 'react';
import { TIER_BACKGROUND, TIER_BOOT } from '../assetTiers';
import { assetUrl } from '../comicAssets';
import {
  preloadImages,
  scheduleIdle,
  type PreloadProgress,
} from '../preloadAssets';

// Bila jaringan sangat lambat, Beranda tetap ditampilkan setelah batas ini.
export const BOOT_TIMEOUT_MS = 6000;

const BOOT_URLS = TIER_BOOT.map(assetUrl);
const BACKGROUND_URLS = TIER_BACKGROUND.map(assetUrl);

interface BootState {
  ready: boolean;
  progress: PreloadProgress;
}

export function useBootPreload(): BootState {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<PreloadProgress>({
    done: 0,
    total: BOOT_URLS.length,
  });

  // Tahap 1: tunggu gambar Beranda (atau batas waktu).
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const timer = window.setTimeout(finish, BOOT_TIMEOUT_MS);
    void preloadImages(BOOT_URLS, {
      concurrency: 6,
      priority: 'high',
      onProgress: (p) => {
        if (!cancelled) setProgress(p);
      },
    }).then(finish);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // Tahap 2: setelah Beranda tampil, unduh sisanya saat browser menganggur.
  useEffect(() => {
    if (!ready) return undefined;
    return scheduleIdle(() => {
      void preloadImages(BACKGROUND_URLS, { concurrency: 3, priority: 'low' });
    });
  }, [ready]);

  return { ready, progress };
}
