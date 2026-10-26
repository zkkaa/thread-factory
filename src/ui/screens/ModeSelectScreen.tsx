import type { UnlockContext } from '../../progress/unlocks';
import {
  type LevelRow,
  type ModuleCard,
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

const TABS: readonly { id: ModeTab; label: string; hint: string }[] = [
  {
    id: 'campaign',
    label: 'Kampanye',
    hint: 'Pilih modul dan selesaikan level demi level.',
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    hint: 'Ubah parameter bebas di level yang sudah selesai (tanpa bintang).',
  },
  {
    id: 'compare',
    label: 'Bandingkan',
    hint: 'Jalankan dua konfigurasi berdampingan dengan seed yang sama.',
  },
];

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400';

interface ModuleCardButtonProps {
  card: ModuleCard;
  disabled: boolean;
  onOpen: () => void;
}

function ModuleCardButton({ card, disabled, onOpen }: ModuleCardButtonProps) {
  const tone = disabled
    ? 'cursor-not-allowed border-navy-700 bg-navy-900 opacity-70'
    : 'border-sun-400 bg-navy-800 hover:bg-navy-700';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className={`flex flex-col gap-2 rounded-2xl border-2 p-5 text-left transition-colors ${FOCUS} ${tone}`}
    >
      <span className="block text-sm font-bold tracking-wide text-ember-500 uppercase">
        {card.title}
      </span>
      <span className="block text-2xl font-black text-sun-400">
        {card.subtitle}
      </span>
      <span className="block text-sm text-ink-300">{card.description}</span>
      <span className="mt-2 block text-sm font-semibold text-ink-100">
        {card.clearedCount} / {card.totalCount} level
      </span>
      {card.lockedReason !== null && (
        <span className="block rounded-lg bg-navy-700 px-3 py-1 text-sm font-semibold text-ember-500">
          <span aria-hidden="true">🔒 </span>
          Terkunci: {card.lockedReason}
        </span>
      )}
    </button>
  );
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
      {row.note !== null && (
        <span className="text-sm text-ember-500">
          <span aria-hidden="true">🔒 </span>
          {row.note}
        </span>
      )}
    </button>
  );
}

/**
 * Layar Pilih Mode (S2): tab Kampanye, Sandbox, dan Bandingkan. Ikon kunci
 * sementara berupa emoji; diganti ikon SVG buatan sendiri di U-023.
 */
export function ModeSelectScreen({
  navigation,
  context,
  getLevelTitle,
}: ModeSelectScreenProps) {
  const { screen } = navigation;
  const activeTab: ModeTab = screen.id === 'mode' ? screen.tab : 'campaign';
  const activeHint = TABS.find((tab) => tab.id === activeTab)?.hint ?? '';

  const renderCampaign = () => (
    <div className="grid gap-6 md:grid-cols-2">
      {buildModuleCards(context).map((card) => {
        const target: Screen = { id: 'moduleIntro', moduleId: card.id };
        return (
          <ModuleCardButton
            key={card.id}
            card={card}
            disabled={!card.unlocked || !navigation.canGo(target)}
            onOpen={() => navigation.go(target)}
          />
        );
      })}
    </div>
  );

  const renderLevels = (tab: 'sandbox' | 'compare') => (
    <div className="flex flex-col gap-6">
      {buildLevelGroups(context, getLevelTitle).map((group) => (
        <section key={group.moduleId} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-sun-400">{group.heading}</h2>
          {group.rows.map((row) => {
            const target: Screen = { id: tab, levelId: row.levelId };
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
  );

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
        <div
          role="tablist"
          aria-label="Pilih mode permainan"
          className="flex gap-2"
        >
          {TABS.map((tab) => {
            const selected = tab.id === activeTab;
            const tone = selected
              ? 'bg-sun-400 text-navy-900'
              : 'bg-navy-800 text-ink-100 hover:bg-navy-700';
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => navigation.selectModeTab(tab.id)}
                className={`rounded-lg px-5 py-2 font-bold ${FOCUS} ${tone}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <span aria-hidden="true" className="w-24" />
      </header>

      <p className="text-ink-300">{activeHint}</p>

      <section role="tabpanel" aria-label={`Mode ${activeTab}`}>
        {activeTab === 'campaign' ? renderCampaign() : renderLevels(activeTab)}
      </section>
    </main>
  );
}
