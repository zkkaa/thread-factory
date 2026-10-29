import { useMemo, useRef, useState } from 'react';
import type { SimulationController } from '../controller/SimulationController';
import {
  MODULES,
  findLevelById,
  findModuleById,
  findModuleOfLevel,
} from '../levels';
import type { ProgressStore } from '../progress/progressStore';
import { isLevelCleared } from '../progress/progressStore';
import type { SettingsStore } from '../progress/settingsStore';
import type { UnlockContext } from '../progress/unlocks';
import { useProgress } from './hooks/useProgress';
import { useProgressRecorder } from './hooks/useProgressRecorder';
import { useSettings } from './hooks/useSettings';
import type { Navigation } from './navigation';
import { GuideScreen } from './screens/GuideScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LevelMapScreen } from './screens/LevelMapScreen';
import { ModeSelectScreen } from './screens/ModeSelectScreen';
import { ModuleCompleteScreen } from './screens/ModuleCompleteScreen';
import { ModuleIntroScreen } from './screens/ModuleIntroScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { PlayScreen } from './screens/PlayScreen';
import { LevelIntroScreen } from './screens/LevelIntroScreen';
import { useSound } from './audio/soundContext';
import { useAppAudio, useSoundEffects } from './hooks/useAppAudio';
import {
  type ScreenState,
  back,
  canNavigate,
  createScreenState,
  navigate,
  replace,
  selectModeTab,
} from './screenState';
import { SettingsScreen } from './screens/SettingsScreen';
import { GameCompleteScreen } from './screens/GameCompleteScreen';

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
  const audio = useSound();
  useSoundEffects(controller, audio);
  useAppAudio(audio, settings.volume);

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

  if (screen.id === 'home') {
    return (
      <HomeScreen
        navigation={navigation}
        hasProgress={Object.keys(progress.levels).length > 0}
      />
    );
  }

  if (screen.id === 'mode') {
    return (
      <ModeSelectScreen
        navigation={navigation}
        context={unlockContext}
        getLevelTitle={(levelId) => findLevelById(levelId)?.title}
      />
    );
  }

  if (screen.id === 'moduleIntro') {
    const moduleDef = findModuleById(screen.moduleId);
    if (moduleDef !== undefined) {
      return (
        <ModuleIntroScreen navigation={navigation} moduleDef={moduleDef} />
      );
    }
  }

  if (screen.id === 'levelMap') {
    const moduleDef = findModuleById(screen.moduleId);
    if (moduleDef !== undefined) {
      return (
        <LevelMapScreen
          navigation={navigation}
          moduleDef={moduleDef}
          context={unlockContext}
          progress={progress}
          reduceMotion={settings.reduceMotion}
          getLevelTitle={(levelId) => findLevelById(levelId)?.title}
        />
      );
    }
  }

  if (screen.id === 'moduleComplete') {
    const moduleDef = findModuleById(screen.moduleId);
    if (moduleDef !== undefined) {
      return (
        <ModuleCompleteScreen
          navigation={navigation}
          moduleDef={moduleDef}
          context={unlockContext}
          progress={progress}
          getLevelConcepts={(levelId) => findLevelById(levelId)?.concepts}
        />
      );
    }
  }

  if (screen.id === 'gameComplete') {
    return (
      <GameCompleteScreen
        navigation={navigation}
        modules={MODULES}
        progress={progress}
        getLevelConcepts={(levelId) => findLevelById(levelId)?.concepts}
      />
    );
  }

  if (screen.id === 'guide') {
    return <GuideScreen navigation={navigation} />;
  }

  if (screen.id === 'settings') {
    return (
      <SettingsScreen
        navigation={navigation}
        settings={settings}
        onChange={(patch) => settingsStore.update(patch)}
        onResetProgress={() => progressStore.reset()}
      />
    );
  }
  if (screen.id === 'levelIntro') {
    const introLevel = findLevelById(screen.levelId);
    if (introLevel !== undefined) {
      return <LevelIntroScreen navigation={navigation} level={introLevel} />;
    }
  }
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
    const moduleDef = findModuleOfLevel(screen.levelId);
    const moduleId = moduleDef?.id;
    const levelId = screen.levelId;
    // Level berikutnya: intro level itu; modul habis -> Tamat Modul;
    // level belum dibuat -> Peta Level.
    const goNext = (): void => {
      if (moduleDef === undefined) return navigation.back();
      const nextId =
        moduleDef.levelIds[moduleDef.levelIds.indexOf(levelId) + 1];
      if (nextId === undefined) {
        navigation.go({ id: 'moduleComplete', moduleId: moduleDef.id });
      } else if (findLevelById(nextId) === undefined) {
        navigation.go({ id: 'levelMap', moduleId: moduleDef.id });
      } else {
        navigation.go({ id: 'levelIntro', levelId: nextId });
      }
    };
    return (
      <PlayScreen
        controller={controller}
        onExit={() =>
          moduleId === undefined
            ? navigation.back()
            : navigation.go({ id: 'levelMap', moduleId })
        }
        onSettings={() => navigation.go({ id: 'settings' })}
        onNext={goNext}
        reduceMotion={settings.reduceMotion}
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
