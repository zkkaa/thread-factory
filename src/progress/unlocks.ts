import type { ModuleDefinition } from '../levels/types';

/**
 * Level yang harus selesai agar sebuah modul terbuka (PRD bagian 8).
 * Modul 1 tidak punya syarat. Level 1-5 tidak dibutuhkan untuk membuka Modul 2.
 */
export const MODULE_REQUIREMENTS: Readonly<Record<number, string>> = {
  2: '1-4',
};

/** Bahan yang dibutuhkan fungsi buka-kunci; disusun oleh pemanggil. */
export interface UnlockContext {
  modules: readonly ModuleDefinition[];
  isCleared: (levelId: string) => boolean;
  /** Mode demo membuka semuanya. */
  demoMode: boolean;
}

function locate(
  modules: readonly ModuleDefinition[],
  levelId: string,
): { moduleDef: ModuleDefinition; index: number } | null {
  for (const moduleDef of modules) {
    const index = moduleDef.levelIds.indexOf(levelId);
    if (index >= 0) return { moduleDef, index };
  }
  return null;
}

/** Level yang harus selesai sebelum modul terbuka, atau null bila tanpa syarat. */
export function getModulePrerequisite(moduleId: number): string | null {
  return MODULE_REQUIREMENTS[moduleId] ?? null;
}

/**
 * Level yang harus selesai sebelum level ini terbuka, atau null bila tanpa
 * syarat. Level pertama modul mengikuti syarat modulnya; level lain mengikuti
 * level sebelumnya di modul yang sama.
 */
export function getLevelPrerequisite(
  modules: readonly ModuleDefinition[],
  levelId: string,
): string | null {
  const found = locate(modules, levelId);
  if (found === null) return null;
  if (found.index > 0) return found.moduleDef.levelIds[found.index - 1];
  return getModulePrerequisite(found.moduleDef.id);
}

export function isModuleUnlocked(
  context: UnlockContext,
  moduleId: number,
): boolean {
  if (!context.modules.some((moduleDef) => moduleDef.id === moduleId)) {
    return false;
  }
  if (context.demoMode) return true;
  const prerequisite = getModulePrerequisite(moduleId);
  return prerequisite === null || context.isCleared(prerequisite);
}

export function isLevelUnlocked(
  context: UnlockContext,
  levelId: string,
): boolean {
  if (locate(context.modules, levelId) === null) return false;
  if (context.demoMode) return true;
  const prerequisite = getLevelPrerequisite(context.modules, levelId);
  return prerequisite === null || context.isCleared(prerequisite);
}

/** Dipakai untuk mode Sandbox dan Bandingkan: terbuka setelah levelnya selesai. */
export function isSandboxUnlocked(
  context: UnlockContext,
  levelId: string,
): boolean {
  if (locate(context.modules, levelId) === null) return false;
  return context.demoMode || context.isCleared(levelId);
}
