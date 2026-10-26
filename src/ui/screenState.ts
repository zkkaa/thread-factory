import {
  type UnlockContext,
  isLevelUnlocked,
  isModuleUnlocked,
  isSandboxUnlocked,
} from '../progress/unlocks';

export type ModeTab = 'campaign' | 'sandbox' | 'compare';

/** Satu layar beserta parameternya. Kode S1..S13 ada di PRD bagian 16. */
export type Screen =
  | { id: 'home' }
  | { id: 'mode'; tab: ModeTab }
  | { id: 'moduleIntro'; moduleId: number }
  | { id: 'levelMap'; moduleId: number }
  | { id: 'levelIntro'; levelId: string }
  | { id: 'play'; levelId: string }
  | { id: 'moduleComplete'; moduleId: number }
  | { id: 'gameComplete' }
  | { id: 'guide' }
  | { id: 'settings' }
  | { id: 'sandbox'; levelId: string }
  | { id: 'compare'; levelId: string };

export type ScreenId = Screen['id'];

export interface ScreenState {
  current: Screen;
  /** Layar sebelumnya, yang paling akhir di ujung. Dipakai tombol kembali. */
  history: readonly Screen[];
}

/**
 * Transisi yang sah menurut alur layar PRD bagian 16. Tombol kembali selalu
 * boleh dan tidak perlu didaftar di sini.
 */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<ScreenId, readonly ScreenId[]>
> = {
  home: ['mode', 'guide', 'settings'],
  mode: ['home', 'moduleIntro', 'sandbox', 'compare'],
  moduleIntro: ['levelMap', 'mode'],
  levelMap: ['levelIntro', 'mode'],
  levelIntro: ['play', 'levelMap'],
  play: [
    'levelMap',
    'levelIntro',
    'moduleComplete',
    'gameComplete',
    'settings',
  ],
  moduleComplete: ['levelMap', 'moduleIntro', 'mode', 'gameComplete'],
  gameComplete: ['mode', 'home', 'settings', 'levelMap'],
  guide: [],
  settings: [],
  sandbox: ['mode', 'settings'],
  compare: ['mode', 'settings'],
};

const HOME: Screen = { id: 'home' };

export function createScreenState(): ScreenState {
  return { current: HOME, history: [] };
}

/** Dua layar dianggap sama bila id dan parameter utamanya sama (tab diabaikan). */
function sameTarget(a: Screen, b: Screen): boolean {
  if (a.id !== b.id) return false;
  if ('moduleId' in a && 'moduleId' in b) return a.moduleId === b.moduleId;
  if ('levelId' in a && 'levelId' in b) return a.levelId === b.levelId;
  return true;
}

function isModuleCleared(context: UnlockContext, moduleId: number): boolean {
  const moduleDef = context.modules.find((item) => item.id === moduleId);
  if (moduleDef === undefined || moduleDef.levelIds.length === 0) return false;
  return moduleDef.levelIds.every((levelId) => context.isCleared(levelId));
}

function isGameCleared(context: UnlockContext): boolean {
  return (
    context.modules.length > 0 &&
    context.modules.every((moduleDef) => isModuleCleared(context, moduleDef.id))
  );
}

/** Apakah layar ini boleh dimasuki (modul, level, atau mode yang terbuka)? */
export function canEnter(target: Screen, context: UnlockContext): boolean {
  switch (target.id) {
    case 'moduleIntro':
    case 'levelMap':
      return isModuleUnlocked(context, target.moduleId);
    case 'moduleComplete':
      return (
        isModuleUnlocked(context, target.moduleId) &&
        (context.demoMode || isModuleCleared(context, target.moduleId))
      );
    case 'levelIntro':
    case 'play':
      return isLevelUnlocked(context, target.levelId);
    case 'sandbox':
    case 'compare':
      return isSandboxUnlocked(context, target.levelId);
    case 'gameComplete':
      return context.demoMode || isGameCleared(context);
    default:
      return true;
  }
}

/** Apakah transisi dari layar saat ini ke target sah dan targetnya terbuka? */
export function canNavigate(
  state: ScreenState,
  target: Screen,
  context: UnlockContext,
): boolean {
  return (
    ALLOWED_TRANSITIONS[state.current.id].includes(target.id) &&
    canEnter(target, context)
  );
}

/**
 * Pindah ke layar lain dan menumpuk layar sekarang ke riwayat. Bila target
 * sudah ada di riwayat (mis. kembali ke Peta Level dari Arena), riwayat
 * dipotong sampai di situ supaya tidak menumpuk tanpa batas. Transisi yang
 * ditolak mengembalikan objek state yang sama.
 */
export function navigate(
  state: ScreenState,
  target: Screen,
  context: UnlockContext,
): ScreenState {
  if (!canNavigate(state, target, context)) return state;
  const index = state.history.findIndex((screen) => sameTarget(screen, target));
  if (index >= 0) {
    return { current: target, history: state.history.slice(0, index) };
  }
  return { current: target, history: [...state.history, state.current] };
}

/**
 * Mengganti layar sekarang tanpa menambah riwayat. Dipakai untuk layar
 * perantara yang tidak perlu dikunjungi lagi lewat tombol kembali (mis. Intro
 * Level yang langsung menjadi Arena).
 */
export function replace(
  state: ScreenState,
  target: Screen,
  context: UnlockContext,
): ScreenState {
  if (!canNavigate(state, target, context)) return state;
  return { current: target, history: state.history };
}

/**
 * Kembali ke layar sebelumnya. Layar yang kini terkunci dilewati. Bila riwayat
 * habis, kembali ke Beranda (dan tetap di Beranda bila sudah di sana).
 */
export function back(state: ScreenState, context: UnlockContext): ScreenState {
  for (let index = state.history.length - 1; index >= 0; index -= 1) {
    const candidate = state.history[index];
    if (canEnter(candidate, context)) {
      return { current: candidate, history: state.history.slice(0, index) };
    }
  }
  if (state.current.id === 'home' && state.history.length === 0) return state;
  return createScreenState();
}

/** Mengganti tab Kampanye/Sandbox/Bandingkan pada layar Pilih Mode. */
export function selectModeTab(state: ScreenState, tab: ModeTab): ScreenState {
  if (state.current.id !== 'mode' || state.current.tab === tab) return state;
  return { current: { id: 'mode', tab }, history: state.history };
}
