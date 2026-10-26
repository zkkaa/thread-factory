import {
  type UnlockContext,
  getModulePrerequisite,
  isModuleUnlocked,
  isSandboxUnlocked,
} from '../progress/unlocks';

/** Data satu kartu modul di tab Kampanye. */
export interface ModuleCard {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  clearedCount: number;
  totalCount: number;
  unlocked: boolean;
  /** Alasan terkunci untuk ditampilkan ke pemain; null bila terbuka. */
  lockedReason: string | null;
}

/** Data satu baris level di tab Sandbox atau Bandingkan. */
export interface LevelRow {
  levelId: string;
  /** Null bila data levelnya belum dibuat. */
  title: string | null;
  unlocked: boolean;
  /** "Segera hadir" atau syarat pembukaan; null bila level siap dimainkan. */
  note: string | null;
}

export interface LevelGroup {
  moduleId: number;
  heading: string;
  rows: LevelRow[];
}

export const COMING_SOON = 'Segera hadir';

export function describeRequirement(levelId: string): string {
  return `Selesaikan Level ${levelId} dahulu`;
}

export function buildModuleCards(context: UnlockContext): ModuleCard[] {
  return context.modules.map((moduleDef) => {
    const unlocked = isModuleUnlocked(context, moduleDef.id);
    const prerequisite = getModulePrerequisite(moduleDef.id);
    return {
      id: moduleDef.id,
      title: moduleDef.title,
      subtitle: moduleDef.subtitle,
      description: moduleDef.description,
      clearedCount: moduleDef.levelIds.filter((levelId) =>
        context.isCleared(levelId),
      ).length,
      totalCount: moduleDef.levelIds.length,
      unlocked,
      lockedReason:
        unlocked || prerequisite === null
          ? null
          : describeRequirement(prerequisite),
    };
  });
}

/**
 * Daftar level untuk Sandbox dan Bandingkan, dikelompokkan per modul.
 * `getLevelTitle` mengembalikan undefined untuk level yang datanya belum ada.
 */
export function buildLevelGroups(
  context: UnlockContext,
  getLevelTitle: (levelId: string) => string | undefined,
): LevelGroup[] {
  return context.modules.map((moduleDef) => ({
    moduleId: moduleDef.id,
    heading: `${moduleDef.title}: ${moduleDef.subtitle}`,
    rows: moduleDef.levelIds.map((levelId): LevelRow => {
      const title = getLevelTitle(levelId) ?? null;
      if (title === null) {
        return { levelId, title, unlocked: false, note: COMING_SOON };
      }
      const unlocked = isSandboxUnlocked(context, levelId);
      return {
        levelId,
        title,
        unlocked,
        note: unlocked ? null : describeRequirement(levelId),
      };
    }),
  }));
}
