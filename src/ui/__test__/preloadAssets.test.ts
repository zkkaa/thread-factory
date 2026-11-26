import { describe, expect, it } from 'vitest';
import {
  preloadImages,
  type ImageLoader,
  type PreloadProgress,
} from '../preloadAssets';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('preloadImages', () => {
  it('memuat tiap URL unik tepat satu kali', async () => {
    const seen: string[] = [];
    const loader: ImageLoader = (url) => {
      seen.push(url);
      return Promise.resolve();
    };
    await preloadImages(['a', 'b', 'a', 'c', 'b'], { loader });
    expect([...seen].sort()).toEqual(['a', 'b', 'c']);
  });

  it('tidak melebihi batas unduhan bersamaan', async () => {
    let inFlight = 0;
    let peak = 0;
    const loader: ImageLoader = async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await tick();
      inFlight -= 1;
    };
    const urls = Array.from({ length: 12 }, (_, i) => `u${i}`);
    await preloadImages(urls, { loader, concurrency: 3 });
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it('gambar yang gagal tidak menghentikan yang lain', async () => {
    const seen: string[] = [];
    const loader: ImageLoader = (url) => {
      if (url === 'b') return Promise.reject(new Error('gagal'));
      seen.push(url);
      return Promise.resolve();
    };
    await expect(
      preloadImages(['a', 'b', 'c'], { loader, concurrency: 1 }),
    ).resolves.toBeUndefined();
    expect(seen).toEqual(['a', 'c']);
  });

  it('melaporkan kemajuan dari 0 sampai total', async () => {
    const reports: PreloadProgress[] = [];
    await preloadImages(['a', 'b', 'c'], {
      loader: () => Promise.resolve(),
      onProgress: (p) => reports.push(p),
    });
    expect(reports[0]).toEqual({ done: 0, total: 3 });
    expect(reports[reports.length - 1]).toEqual({ done: 3, total: 3 });
    const dones = reports.map((r) => r.done);
    expect(dones).toEqual([...dones].sort((x, y) => x - y));
  });

  it('daftar kosong langsung selesai', async () => {
    const reports: PreloadProgress[] = [];
    await preloadImages([], { onProgress: (p) => reports.push(p) });
    expect(reports).toEqual([{ done: 0, total: 0 }]);
  });
});
