import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../../../public/assets/', import.meta.url);
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function listFiles(): { path: string; size: number }[] {
  const files: { path: string; size: number }[] = [];
  for (const entry of readdirSync(ROOT, { recursive: true })) {
    const path = String(entry);
    const stat = statSync(new URL(path, ROOT));
    if (stat.isFile()) files.push({ path, size: stat.size });
  }
  return files;
}

describe('anggaran ukuran aset (ARCHITECTURE bagian 15)', () => {
  const files = listFiles();

  it('total semua aset di bawah 15 MB', () => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    expect(total).toBeLessThan(MAX_TOTAL_BYTES);
  });

  it('tidak ada satu berkas pun di atas 2 MB', () => {
    const oversized = files.filter((file) => file.size > MAX_FILE_BYTES);
    expect(oversized.map((file) => file.path)).toEqual([]);
  });
});
