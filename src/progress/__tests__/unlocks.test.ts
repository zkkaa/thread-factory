import { describe, expect, it } from 'vitest';
import type { ModuleDefinition } from '../../levels/types';
import { ProgressStore, isLevelCleared } from '../progressStore';
import { createMemoryStorage } from '../storage';
import {
  type UnlockContext,
  getLevelPrerequisite,
  getModulePrerequisite,
  isLevelUnlocked,
  isModuleUnlocked,
  isSandboxUnlocked,
} from '../unlocks';

// Data uji sendiri agar tes tidak ikut berubah saat isi modul sungguhan berubah.
const MODULES_UJI: ModuleDefinition[] = [
  {
    id: 1,
    title: 'Modul 1',
    subtitle: '',
    description: '',
    concepts: [],
    levelIds: ['1-1', '1-2', '1-3', '1-4', '1-5'],
  },
  {
    id: 2,
    title: 'Modul 2',
    subtitle: '',
    description: '',
    concepts: [],
    levelIds: ['2-1', '2-2'],
  },
];

function konteks(selesai: string[] = [], demoMode = false): UnlockContext {
  const set = new Set(selesai);
  return {
    modules: MODULES_UJI,
    isCleared: (id) => set.has(id),
    demoMode,
  };
}

describe('Syarat buka-kunci', () => {
  it('syarat level dan modul', () => {
    expect(getLevelPrerequisite(MODULES_UJI, '1-1')).toBeNull();
    expect(getLevelPrerequisite(MODULES_UJI, '1-3')).toBe('1-2');
    expect(getLevelPrerequisite(MODULES_UJI, '2-1')).toBe('1-4');
    expect(getLevelPrerequisite(MODULES_UJI, '2-2')).toBe('2-1');
    expect(getLevelPrerequisite(MODULES_UJI, '9-9')).toBeNull();
    expect(getModulePrerequisite(1)).toBeNull();
    expect(getModulePrerequisite(2)).toBe('1-4');
  });
});

describe('isLevelUnlocked', () => {
  it('awalnya hanya level pertama yang terbuka', () => {
    const c = konteks();
    expect(isLevelUnlocked(c, '1-1')).toBe(true);
    expect(isLevelUnlocked(c, '1-2')).toBe(false);
    expect(isLevelUnlocked(c, '2-1')).toBe(false);
  });

  it('level terbuka setelah level sebelumnya selesai', () => {
    const c = konteks(['1-1']);
    expect(isLevelUnlocked(c, '1-2')).toBe(true);
    expect(isLevelUnlocked(c, '1-3')).toBe(false);
  });

  it('level 2-1 terbuka setelah 1-4 selesai, tanpa menunggu 1-5', () => {
    const c = konteks(['1-1', '1-2', '1-3', '1-4']);
    expect(isLevelUnlocked(c, '2-1')).toBe(true);
    expect(isLevelUnlocked(c, '2-2')).toBe(false);
  });

  it('level 2-1 masih terkunci bila 1-4 belum selesai', () => {
    expect(isLevelUnlocked(konteks(['1-1', '1-2', '1-3']), '2-1')).toBe(false);
  });

  it('id yang tidak dikenal selalu terkunci, bahkan di mode demo', () => {
    expect(isLevelUnlocked(konteks([], true), '9-9')).toBe(false);
  });

  it('mode demo membuka semua level', () => {
    const c = konteks([], true);
    expect(isLevelUnlocked(c, '1-5')).toBe(true);
    expect(isLevelUnlocked(c, '2-2')).toBe(true);
  });
});

describe('isModuleUnlocked', () => {
  it('Modul 1 selalu terbuka; Modul 2 menunggu Level 1-4', () => {
    expect(isModuleUnlocked(konteks(), 1)).toBe(true);
    expect(isModuleUnlocked(konteks(), 2)).toBe(false);
    expect(isModuleUnlocked(konteks(['1-1', '1-2', '1-3']), 2)).toBe(false);
    expect(isModuleUnlocked(konteks(['1-4']), 2)).toBe(true);
  });

  it('mode demo membuka modul; modul tak dikenal tetap terkunci', () => {
    expect(isModuleUnlocked(konteks([], true), 2)).toBe(true);
    expect(isModuleUnlocked(konteks([], true), 3)).toBe(false);
  });
});

describe('isSandboxUnlocked', () => {
  it('terbuka hanya setelah level kampanyenya selesai', () => {
    expect(isSandboxUnlocked(konteks(), '1-1')).toBe(false);
    expect(isSandboxUnlocked(konteks(['1-1']), '1-1')).toBe(true);
    expect(isSandboxUnlocked(konteks(['1-1']), '1-2')).toBe(false);
  });

  it('mode demo membuka semua; id tak dikenal tetap terkunci', () => {
    expect(isSandboxUnlocked(konteks([], true), '2-2')).toBe(true);
    expect(isSandboxUnlocked(konteks([], true), '9-9')).toBe(false);
  });
});

describe('Terhubung dengan ProgressStore', () => {
  it('level terbuka setelah progres dicatat', () => {
    const store = new ProgressStore(createMemoryStorage());
    const c: UnlockContext = {
      modules: MODULES_UJI,
      isCleared: (id) => isLevelCleared(store.getState(), id),
      demoMode: false,
    };
    expect(isLevelUnlocked(c, '1-2')).toBe(false);
    store.record('1-1', 1);
    expect(isLevelUnlocked(c, '1-2')).toBe(true);
  });
});
