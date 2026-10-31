import { FOCUS, MODE_TABS } from '../modeTabsData';
import type { ModeTab } from '../screenState';

interface ModeTabsProps {
  activeTab: ModeTab;
  onSelect: (tab: ModeTab) => void;
}

/** Tab Kampanye / Sandbox / Bandingkan, dipakai di peta dan di daftar level. */
export function ModeTabs({ activeTab, onSelect }: ModeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Pilih mode permainan"
      className="flex gap-2"
    >
      {MODE_TABS.map((tab) => {
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
            onClick={() => onSelect(tab.id)}
            className={`rounded-lg px-5 py-2 font-bold ${FOCUS} ${tone}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
