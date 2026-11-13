import { describe, expect, it } from 'vitest';
import { buildEngineConfig } from '../../../controller/buildEngineConfig';
import { level2_4, LEVEL_2_4_TOOL_BUDGET } from '../level-2-4';

describe('Level 2-4: Lini Produksi Penuh (T-104)', () => {
  it('data dasar: layout, anggaran, pemulihan manual', () => {
    expect(level2_4.layoutId).toBe('2-4');
    expect(level2_4.toolBudget).toBe(LEVEL_2_4_TOOL_BUDGET);
    expect(level2_4.recovery).toBe('manual');
    expect(level2_4.tutorialSeed).toBeDefined();
  });

  it('id thread dan id resource unik', () => {
    const threadIds = level2_4.threads.map((t) => t.id);
    expect(new Set(threadIds).size).toBe(threadIds.length);
    const resourceIds = level2_4.resources.map((r) => r.id);
    expect(new Set(resourceIds).size).toBe(resourceIds.length);
  });

  it('memuat thread dan resource dari ketiga komponen', () => {
    const kinds = new Set(level2_4.resources.map((r) => r.kind));
    expect(kinds.has('board')).toBe(true);
    expect(kinds.has('rwlock')).toBe(true);
    expect(kinds.has('semaphore')).toBe(true);
    expect(level2_4.availableTools).toContain('rwlock');
  });

  it('bisa diubah menjadi konfigurasi engine tanpa error', () => {
    const config = buildEngineConfig(level2_4, []);
    expect(config.threads.length).toBe(level2_4.threads.length);
    expect(config.scheduler.cores).toBe(level2_4.scheduler.cores);
  });
});
