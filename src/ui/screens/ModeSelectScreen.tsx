import type { UnlockContext } from '../../progress/unlocks';
import { COMPARE_THEME, SANDBOX_THEME } from '../comicAssets';
import { ComicLevelBoard } from '../components/comic/ComicLevelBoard';
import { ModeTabs } from '../components/ModeTabs';
import { ModuleMap } from '../components/ModuleMap';
import { buildLevelGroups, buildModuleCards } from '../modeSelect';
import { FOCUS, MODE_TABS } from '../modeTabsData';
import type { Navigation } from '../navigation';
import type { ModeTab, Screen } from '../screenState';

interface ModeSelectScreenProps {
  navigation: Navigation;
  context: UnlockContext;
  getLevelTitle: (levelId: string) => string | undefined;
  reduceMotion?: boolean;
}

export function ModeSelectScreen({
  navigation,
  context,
  getLevelTitle,
  reduceMotion = false,
}: ModeSelectScreenProps) {
  const { screen } = navigation;
  const activeTab: ModeTab = screen.id === 'mode' ? screen.tab : 'campaign';

  if (activeTab === 'campaign') {
    return (
      <ModuleMap
        navigation={navigation}
        cards={buildModuleCards(context)}
        activeTab={activeTab}
      />
    );
  }

  const theme = activeTab === 'sandbox' ? SANDBOX_THEME : COMPARE_THEME;
  const hint = MODE_TABS.find((tab) => tab.id === activeTab)?.hint ?? '';

  const groups = buildLevelGroups(context, getLevelTitle).map((group) => ({
    key: String(group.moduleId),
    heading: group.heading,
    items: group.rows.map((row) => {
      const target: Screen = { id: activeTab, levelId: row.levelId };
      return {
        levelId: row.levelId,
        title: row.title,
        note: row.note,
        locked: !row.unlocked || !navigation.canGo(target),
      };
    }),
  }));

  const open = (levelId: string) => {
    const target: Screen = { id: activeTab, levelId };
    navigation.go(target);
  };

  return (
    <main className="relative isolate flex h-screen flex-col gap-5 overflow-y-auto bg-navy-900 px-8 py-6 text-ink-100">
      <header className="relative z-10 flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={navigation.back}
          className={`rounded-lg border-[3px] border-navy-900 bg-cream-50 px-4 py-2 font-extrabold text-navy-900 shadow-[3px_3px_0_#0b1f3a] hover:bg-sun-400 ${FOCUS}`}
        >
          Kembali
        </button>
        <ModeTabs activeTab={activeTab} onSelect={navigation.selectModeTab} />
        <span aria-hidden="true" className="w-24" />
      </header>
      <ComicLevelBoard
        theme={theme}
        hint={hint}
        groups={groups}
        reduceMotion={reduceMotion}
        onOpen={open}
      />
    </main>
  );
}