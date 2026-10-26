import { describe, expect, it } from 'vitest';
import type { ModuleDefinition } from '../../levels/types';
import type { UnlockContext } from '../../progress/unlocks';
import {
  ALLOWED_TRANSITIONS,
  type Screen,
  type ScreenState,
  back,
  canEnter,
  createScreenState,
  navigate,
  replace,
  selectModeTab,
} from '../screenState';

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
  return { modules: MODULES_UJI, isCleared: (id) => set.has(id), demoMode };
}

const SEMUA_LEVEL = ['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2'];

const HOME: Screen = { id: 'home' };
const MODE: Screen = { id: 'mode', tab: 'campaign' };
const PETA_1: Screen = { id: 'levelMap', moduleId: 1 };
const MAIN_1_5: Screen = { id: 'play', levelId: '1-5' };

/** Keadaan di tengah permainan Level 1-5 (riwayat: Beranda, Mode, Peta Level). */
const SEDANG_MAIN: ScreenState = {
  current: MAIN_1_5,
  history: [HOME, MODE, PETA_1],
};

describe('Alur utama (PRD bagian 16)', () => {
  it('mulai dari Beranda dengan riwayat kosong', () => {
    const awal = createScreenState();
    expect(awal.current).toEqual(HOME);
    expect(awal.history).toEqual([]);
  });

  it('Beranda sampai Arena lalu kembali satu per satu', () => {
    const c = konteks();
    let s = createScreenState();
    s = navigate(s, MODE, c);
    s = navigate(s, { id: 'moduleIntro', moduleId: 1 }, c);
    s = replace(s, PETA_1, c);
    s = navigate(s, { id: 'levelIntro', levelId: '1-1' }, c);
    s = replace(s, { id: 'play', levelId: '1-1' }, c);
    expect(s.current).toEqual({ id: 'play', levelId: '1-1' });
    expect(s.history.map((screen) => screen.id)).toEqual([
      'home',
      'mode',
      'levelMap',
    ]);

    s = back(s, c);
    expect(s.current).toEqual(PETA_1);
    s = back(s, c);
    expect(s.current).toEqual(MODE);
    s = back(s, c);
    expect(s.current).toEqual(HOME);
    expect(s.history).toEqual([]);
  });

  it('Beranda ke Panduan dan Pengaturan, lalu kembali', () => {
    const c = konteks();
    for (const id of ['guide', 'settings'] as const) {
      const s = navigate(createScreenState(), { id }, c);
      expect(s.current.id).toBe(id);
      expect(back(s, c).current).toEqual(HOME);
    }
  });

  it('dari Arena ke Pengaturan lalu kembali ke Arena yang sama', () => {
    const c = konteks(['1-1', '1-2', '1-3', '1-4']);
    const s = navigate(SEDANG_MAIN, { id: 'settings' }, c);
    expect(s.current.id).toBe('settings');
    expect(s.history).toHaveLength(4);
    expect(back(s, c).current).toEqual(MAIN_1_5);
  });

  it('kembali ke Peta Level dari Arena memotong riwayat', () => {
    const c = konteks(['1-1', '1-2', '1-3', '1-4']);
    const s = navigate(SEDANG_MAIN, PETA_1, c);
    expect(s.current).toEqual(PETA_1);
    expect(s.history).toEqual([HOME, MODE]);
  });

  it('level berikutnya: Arena ke Intro Level mengganti layar', () => {
    const c = konteks(['1-1']);
    const dariPlay: ScreenState = {
      current: { id: 'play', levelId: '1-1' },
      history: [HOME, MODE, PETA_1],
    };
    const s = replace(dariPlay, { id: 'levelIntro', levelId: '1-2' }, c);
    expect(s.current).toEqual({ id: 'levelIntro', levelId: '1-2' });
    expect(s.history).toEqual(dariPlay.history);
  });

  it('Tamat Modul hanya setelah semua level modul selesai', () => {
    const targetS7: Screen = { id: 'moduleComplete', moduleId: 1 };
    const belum = konteks(['1-1', '1-2', '1-3', '1-4']);
    expect(replace(SEDANG_MAIN, targetS7, belum)).toBe(SEDANG_MAIN);

    const semua = konteks(['1-1', '1-2', '1-3', '1-4', '1-5']);
    expect(replace(SEDANG_MAIN, targetS7, semua).current).toEqual(targetS7);
  });

  it('Tamat Game hanya setelah seluruh level selesai', () => {
    const belum = konteks(['1-1', '1-2', '1-3', '1-4', '1-5']);
    expect(replace(SEDANG_MAIN, { id: 'gameComplete' }, belum)).toBe(
      SEDANG_MAIN,
    );
    const semua = konteks(SEMUA_LEVEL);
    expect(replace(SEDANG_MAIN, { id: 'gameComplete' }, semua).current.id).toBe(
      'gameComplete',
    );
  });

  it('dari Tamat Game bisa ke Mode, Beranda, Pengaturan, dan Peta Level', () => {
    const c = konteks(SEMUA_LEVEL);
    const s: ScreenState = {
      current: { id: 'gameComplete' },
      history: [HOME],
    };
    for (const target of [MODE, HOME, { id: 'settings' }, PETA_1] as Screen[]) {
      expect(navigate(s, target, c).current.id).toBe(target.id);
    }
  });
});

describe('Transisi yang ditolak mengembalikan state yang sama', () => {
  it('lompatan yang tidak ada di alur', () => {
    const c = konteks(SEMUA_LEVEL);
    const awal = createScreenState();
    expect(navigate(awal, { id: 'play', levelId: '1-1' }, c)).toBe(awal);
    expect(navigate(awal, PETA_1, c)).toBe(awal);
    expect(navigate(awal, { id: 'gameComplete' }, c)).toBe(awal);
  });

  it('modul terkunci', () => {
    const c = konteks(['1-1', '1-2', '1-3']);
    const dariMode: ScreenState = { current: MODE, history: [HOME] };
    expect(navigate(dariMode, { id: 'moduleIntro', moduleId: 2 }, c)).toBe(
      dariMode,
    );
    const terbuka = konteks(['1-4']);
    expect(
      navigate(dariMode, { id: 'moduleIntro', moduleId: 2 }, terbuka).current,
    ).toEqual({ id: 'moduleIntro', moduleId: 2 });
  });

  it('level terkunci', () => {
    const c = konteks();
    const dariPeta: ScreenState = {
      current: PETA_1,
      history: [HOME, MODE],
    };
    expect(navigate(dariPeta, { id: 'levelIntro', levelId: '1-2' }, c)).toBe(
      dariPeta,
    );
    expect(
      navigate(dariPeta, { id: 'levelIntro', levelId: '1-1' }, c).current.id,
    ).toBe('levelIntro');
  });

  it('Sandbox dan Bandingkan menunggu level kampanyenya selesai', () => {
    const dariMode: ScreenState = { current: MODE, history: [HOME] };
    for (const id of ['sandbox', 'compare'] as const) {
      const target: Screen = { id, levelId: '1-1' };
      expect(navigate(dariMode, target, konteks())).toBe(dariMode);
      expect(navigate(dariMode, target, konteks(['1-1'])).current).toEqual(
        target,
      );
      expect(navigate(dariMode, target, konteks([], true)).current).toEqual(
        target,
      );
    }
  });

  it('id yang tidak dikenal, bahkan di mode demo', () => {
    const c = konteks([], true);
    const dariMode: ScreenState = { current: MODE, history: [HOME] };
    expect(navigate(dariMode, { id: 'moduleIntro', moduleId: 9 }, c)).toBe(
      dariMode,
    );
    const dariPeta: ScreenState = { current: PETA_1, history: [HOME, MODE] };
    expect(navigate(dariPeta, { id: 'levelIntro', levelId: '9-9' }, c)).toBe(
      dariPeta,
    );
  });

  it('mode demo membuka semua layar yang terkunci', () => {
    const c = konteks([], true);
    expect(canEnter({ id: 'gameComplete' }, c)).toBe(true);
    expect(canEnter({ id: 'moduleComplete', moduleId: 2 }, c)).toBe(true);
    expect(canEnter({ id: 'play', levelId: '2-2' }, c)).toBe(true);
  });
});

describe('back', () => {
  it('tetap di Beranda bila sudah di Beranda', () => {
    const awal = createScreenState();
    expect(back(awal, konteks())).toBe(awal);
  });

  it('riwayat kosong di layar lain kembali ke Beranda', () => {
    const s: ScreenState = { current: { id: 'guide' }, history: [] };
    expect(back(s, konteks()).current).toEqual(HOME);
  });

  it('melewati layar yang kini terkunci', () => {
    // Pemain memasuki Level 1-5 lewat mode demo, lalu demo dimatikan.
    const s: ScreenState = {
      current: { id: 'settings' },
      history: [HOME, MODE, PETA_1, MAIN_1_5],
    };
    const hasil = back(s, konteks());
    expect(hasil.current).toEqual(PETA_1);
    expect(hasil.history).toEqual([HOME, MODE]);
  });
});

describe('selectModeTab', () => {
  it('mengganti tab tanpa mengubah riwayat', () => {
    const s: ScreenState = { current: MODE, history: [HOME] };
    const hasil = selectModeTab(s, 'sandbox');
    expect(hasil.current).toEqual({ id: 'mode', tab: 'sandbox' });
    expect(hasil.history).toEqual([HOME]);
  });

  it('abaikan bila tab sama atau bukan di layar Pilih Mode', () => {
    const s: ScreenState = { current: MODE, history: [HOME] };
    expect(selectModeTab(s, 'campaign')).toBe(s);
    const awal = createScreenState();
    expect(selectModeTab(awal, 'sandbox')).toBe(awal);
  });
});

describe('Tabel transisi', () => {
  it('hanya merujuk id layar yang terdaftar', () => {
    const semuaId = Object.keys(ALLOWED_TRANSITIONS);
    for (const tujuan of Object.values(ALLOWED_TRANSITIONS).flat()) {
      expect(semuaId).toContain(tujuan);
    }
  });
});
