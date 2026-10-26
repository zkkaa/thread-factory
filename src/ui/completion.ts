import type { ModuleDefinition } from '../levels/types';
import {
  type ProgressData,
  isLevelCleared,
  totalStars,
} from '../progress/progressStore';

/** Mengembalikan konsep sebuah level, atau undefined bila datanya belum ada. */
export type LevelConceptsLookup = (
  levelId: string,
) => readonly string[] | undefined;

/** Ringkasan untuk Layar Tamat Modul (S7) dan Tamat Game (S8). */
export interface CompletionSummary {
  starsEarned: number;
  starsMax: number;
  concepts: string[];
}

/**
 * Konsep unik dari level modul yang sudah selesai, urut menurut level. Bila
 * belum ada yang terkumpul (mis. mode demo tanpa progres), memakai daftar
 * konsep modul supaya layar tidak kosong.
 */
export function collectConcepts(
  moduleDef: ModuleDefinition,
  progress: Readonly<ProgressData>,
  getLevelConcepts: LevelConceptsLookup,
): string[] {
  const seen = new Set<string>();
  for (const levelId of moduleDef.levelIds) {
    if (!isLevelCleared(progress, levelId)) continue;
    for (const concept of getLevelConcepts(levelId) ?? []) seen.add(concept);
  }
  return seen.size > 0 ? [...seen] : [...moduleDef.concepts];
}

export function buildModuleSummary(
  moduleDef: ModuleDefinition,
  progress: Readonly<ProgressData>,
  getLevelConcepts: LevelConceptsLookup,
): CompletionSummary {
  return {
    starsEarned: totalStars(progress, moduleDef.levelIds),
    starsMax: moduleDef.levelIds.length * 3,
    concepts: collectConcepts(moduleDef, progress, getLevelConcepts),
  };
}

/** Gabungan seluruh modul: total bintang dan konsep unik. */
export function buildGameSummary(
  modules: readonly ModuleDefinition[],
  progress: Readonly<ProgressData>,
  getLevelConcepts: LevelConceptsLookup,
): CompletionSummary {
  const concepts = new Set<string>();
  let starsEarned = 0;
  let starsMax = 0;
  for (const moduleDef of modules) {
    const summary = buildModuleSummary(moduleDef, progress, getLevelConcepts);
    starsEarned += summary.starsEarned;
    starsMax += summary.starsMax;
    for (const concept of summary.concepts) concepts.add(concept);
  }
  return { starsEarned, starsMax, concepts: [...concepts] };
}

/** Modul sesudah modul ini, atau undefined bila ini modul terakhir. */
export function findNextModule(
  modules: readonly ModuleDefinition[],
  moduleId: number,
): ModuleDefinition | undefined {
  const index = modules.findIndex((moduleDef) => moduleDef.id === moduleId);
  return index >= 0 ? modules[index + 1] : undefined;
}
