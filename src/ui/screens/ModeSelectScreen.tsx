import type { UnlockContext } from '../../progress/unlocks';
import { ModeTabs } from '../components/ModeTabs';
import { FOCUS, MODE_TABS } from '../modeTabsData';
import { ModuleMap } from '../components/ModuleMap';
import {
  type LevelRow,
  buildLevelGroups,
  buildModuleCards,
} from '../modeSelect';
import type { Navigation } from '../navigation';
import type { ModeTab, Screen } from '../screenState';

interface ModeSelectScreenProps {
  navigation: Navigation;
  context: UnlockContext;
  /** Judul level, atau undefined bila datanya belum dibuat. */
  getLevelTitle: (levelId: string) => string | undefined;
}

interface LevelRowButtonProps {
  row: LevelRow;
  disabled: boolean;
  onOpen: () => void;
}

function LevelRowButton({ row, disabled, onOpen }: LevelRowButtonProps) {
  const tone = disabled
    ? 'cursor-not-allowed border-navy-700 bg-navy-900 opacity-70'
    : 'border-navy-500 bg-navy-800 hover:bg-navy-700';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${FOCUS} ${tone}`}
    >
      <span className="font-bold text-ink-100">
        Level {row.levelId}
        {row.title !== null && `: ${row.title}`}
      </span>
      {row.note !== null ? (
        <span className="text-sm text-ember-500">
          <span aria-hidden="true">🔒 </span>
          {row.note}
        </span>
      ) : (
        <span className="text-sm font-bold text-sun-400">Buka</span>
      )}
    </button>
  );
}

/**
 * Layar Pilih Mode (S2). Tab Kampanye menampilkan denah pabrik (ModuleMap);
 * Sandbox dan Bandingkan masih berupa daftar level. Ikon kunci sementara
 * berupa emoji; diganti ikon SVG buatan sendiri di U-023.
 */
export function ModeSelectScreen({
  navigation,
  context,
  getLevelTitle,
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

  const activeHint = MODE_TABS.find((tab) => tab.id === activeTab)?.hint ?? '';

  return (
    <main className="flex h-screen flex-col gap-6 overflow-y-auto bg-linear-to-br from-navy-900 to-navy-700 px-12 py-8 text-ink-100">
      <header className="flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={navigation.back}
          className={`rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold hover:bg-navy-700 ${FOCUS}`}
        >
          Kembali
        </button>
        <ModeTabs activeTab={activeTab} onSelect={navigation.selectModeTab} />
        <span aria-hidden="true" className="w-24" />
      </header>

      <p className="text-ink-300">{activeHint}</p>

      <section role="tabpanel" aria-label={`Mode ${activeTab}`}>
        <div className="flex flex-col gap-6">
          {buildLevelGroups(context, getLevelTitle).map((group) => (
            <section key={group.moduleId} className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-sun-400">
                {group.heading}
              </h2>
              {group.rows.map((row) => {
                const target: Screen = {
                  id: activeTab,
                  levelId: row.levelId,
                };
                return (
                  <LevelRowButton
                    key={row.levelId}
                    row={row}
                    disabled={!row.unlocked || !navigation.canGo(target)}
                    onOpen={() => navigation.go(target)}
                  />
                );
              })}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
