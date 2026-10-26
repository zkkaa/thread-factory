import { useMemo, useRef, useState } from 'react';
import type { SimulationController } from '../controller/SimulationController';
import { MODULES, findLevelById, findModuleOfLevel } from '../levels';
import type { ProgressStore } from '../progress/progressStore';
import { isLevelCleared } from '../progress/progressStore';
import type { SettingsStore } from '../progress/settingsStore';
import type { UnlockContext } from '../progress/unlocks';
import { useProgress } from './hooks/useProgress';
import { useProgressRecorder } from './hooks/useProgressRecorder';
import { useSettings } from './hooks/useSettings';
import type { Navigation } from './navigation';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { PlayScreen } from './screens/PlayScreen';
import {
  type ScreenState,
  back,
  canNavigate,
  createScreenState,
  navigate,
  replace,
  selectModeTab,
} from './screenState';

interface AppShellProps {
  controller: SimulationController;
  progressStore: ProgressStore;
  settingsStore: SettingsStore;
}

/**
 * Router layar. Menyimpan ScreenState, menyusun konteks buka-kunci dari
 * progres dan pengaturan, memuat level ke controller saat masuk Arena, dan
 * memasang pencatat bintang (aktif di semua layar).
 */
export function AppShell({
  controller,
  progressStore,
  settingsStore,
}: AppShellProps) {
  const progress = useProgress(progressStore);
  const settings = useSettings(settingsStore);
  useProgressRecorder(controller, progressStore);

  const [screenState, setScreenState] =
    useState<ScreenState>(createScreenState);
  // Level yang terakhir dimuat ke controller; mencegah muat ulang saat kembali
  // dari Pengaturan ke Arena yang sama.
  const loadedLevelId = useRef<string | null>(null);

  const unlockContext = useMemo<UnlockContext>(
    () => ({
      modules: MODULES,
      isCleared: (levelId) => isLevelCleared(progress, levelId),
      demoMode: settings.demoMode,
    }),
    [progress, settings.demoMode],
  );

  const enterPlay = (levelId: string, force: boolean) => {
    const level = findLevelById(levelId);
    if (level === undefined) {
      loadedLevelId.current = null;
      return;
    }
    if (force || loadedLevelId.current !== levelId) {
      controller.loadLevel(level);
      loadedLevelId.current = levelId;
    }
  };

  const apply = (next: ScreenState, forceLoad: boolean) => {
    if (next === screenState) return;
    if (next.current.id === 'play') enterPlay(next.current.levelId, forceLoad);
    setScreenState(next);
  };

  const navigation: Navigation = {
    screen: screenState.current,
    canGo: (target) => canNavigate(screenState, target, unlockContext),
    go: (target) => apply(navigate(screenState, target, unlockContext), true),
    replace: (target) =>
      apply(replace(screenState, target, unlockContext), true),
    back: () => apply(back(screenState, unlockContext), false),
    selectModeTab: (tab) => apply(selectModeTab(screenState, tab), false),
  };

  const screen = screenState.current;

  if (screen.id === 'play') {
    if (findLevelById(screen.levelId) === undefined) {
      return (
        <main className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-900 text-gray-100">
          <p>Level {screen.levelId} belum tersedia.</p>
          <button
            type="button"
            onClick={navigation.back}
            className="rounded bg-yellow-500 px-4 py-2 font-semibold text-gray-900"
          >
            Kembali
          </button>
        </main>
      );
    }
    const moduleId = findModuleOfLevel(screen.levelId)?.id;
    return (
      <PlayScreen
        controller={controller}
        onExit={() =>
          moduleId === undefined
            ? navigation.back()
            : navigation.go({ id: 'levelMap', moduleId })
        }
      />
    );
  }

  return (
    <PlaceholderScreen
      navigation={navigation}
      modules={MODULES}
      settings={settings}
      onToggleDemo={() =>
        settingsStore.update({ demoMode: !settings.demoMode })
      }
      onResetProgress={() => progressStore.reset()}
    />
  );
}
