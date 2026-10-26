import type { ModuleDefinition } from '../levels/types';
import {
  type ProgressData,
  type Stars,
  getBestStars,
  isLevelCleared,
  totalStars,
} from '../progress/progressStore';
import {
  type UnlockContext,
  getLevelPrerequisite,
  isLevelUnlocked,
} from '../progress/unlocks';
import { COMING_SOON, describeRequirement } from './modeSelect';

export type NodeStatus = 'comingSoon' | 'locked' | 'open' | 'cleared';

/** Satu titik level di Peta Level. */
export interface LevelNode {
  levelId: string;
  /** Null bila data levelnya belum dibuat. */
  title: string | null;
  status: NodeStatus;
  /** Bintang terbaik (0 bila belum selesai). */
  stars: Stars;
  /** Level yang disorot sebagai langkah berikutnya. */
  isNext: boolean;
  /** "Segera hadir" atau syarat pembukaan; null bila tidak ada catatan. */
  note: string | null;
}

/** Aksi utama di bawah peta (Mulai atau Lanjut Level X). */
export interface MapAction {
  verb: 'Mulai' | 'Lanjut';
  levelId: string;
}

export interface LevelMapView {
  nodes: LevelNode[];
  action: MapAction | null;
  /** Penjelasan bila tidak ada aksi (semua selesai atau belum ada level). */
  message: string | null;
  starsEarned: number;
  starsMax: number;
}

export const ALL_DONE_MESSAGE =
  'Semua level yang tersedia sudah selesai. Level lainnya segera hadir.';
export const NONE_YET_MESSAGE = 'Level modul ini segera hadir.';

/**
 * Menyusun tampilan Peta Level satu modul. `getLevelTitle` mengembalikan
 * undefined untuk level yang datanya belum dibuat.
 */
export function buildLevelMap(
  moduleDef: ModuleDefinition,
  context: UnlockContext,
  progress: Readonly<ProgressData>,
  getLevelTitle: (levelId: string) => string | undefined,
): LevelMapView {
  const nodes: LevelNode[] = moduleDef.levelIds.map((levelId): LevelNode => {
    const title = getLevelTitle(levelId) ?? null;
    const stars = getBestStars(progress, levelId);
    if (title === null) {
      return {
        levelId,
        title,
        status: 'comingSoon',
        stars,
        isNext: false,
        note: COMING_SOON,
      };
    }
    if (!isLevelUnlocked(context, levelId)) {
      const prerequisite = getLevelPrerequisite(context.modules, levelId);
      return {
        levelId,
        title,
        status: 'locked',
        stars,
        isNext: false,
        note:
          prerequisite === null
            ? 'Terkunci'
            : describeRequirement(prerequisite),
      };
    }
    const status: NodeStatus = isLevelCleared(progress, levelId)
      ? 'cleared'
      : 'open';
    return { levelId, title, status, stars, isNext: false, note: null };
  });

  // Langkah berikutnya: level terbuka pertama yang belum selesai.
  const nextIndex = nodes.findIndex((node) => node.status === 'open');
  if (nextIndex >= 0) nodes[nextIndex] = { ...nodes[nextIndex], isNext: true };

  const hasProgress = nodes.some((node) => node.status === 'cleared');
  const anyPlayable = nodes.some(
    (node) => node.status === 'open' || node.status === 'cleared',
  );
  const action: MapAction | null =
    nextIndex >= 0
      ? {
          verb: hasProgress ? 'Lanjut' : 'Mulai',
          levelId: nodes[nextIndex].levelId,
        }
      : null;

  return {
    nodes,
    action,
    message:
      action !== null
        ? null
        : anyPlayable
          ? ALL_DONE_MESSAGE
          : NONE_YET_MESSAGE,
    starsEarned: totalStars(progress, moduleDef.levelIds),
    starsMax: moduleDef.levelIds.length * 3,
  };
}
