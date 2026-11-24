import { useState, type ReactNode } from 'react';
import { resolveActiveTab } from '../../toolboxTabs';

export interface DockTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface ToolboxDockProps {
  tabs: readonly DockTab[];
  /** Chip anggaran alat (Level 2-4); tampil di atas tab. */
  header?: ReactNode;
}

/**
 * Pembungkus toolbox bawah. Hanya satu toolbox terlihat sekaligus (tab), dan
 * tingginya dibatasi agar tidak menutupi arena atau keluar layar. Toolbox yang
 * tidak aktif hanya disembunyikan (bukan di-unmount) supaya state lokal dan
 * pendengar seret-lepasnya tetap hidup.
 */
export function ToolboxDock({ tabs, header }: ToolboxDockProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = resolveActiveTab(tabs, selected);

  return (
    <div className="max-h-[42vh] space-y-2 overflow-y-auto">
      {header}
      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Pilih alat"
          className="flex flex-wrap gap-1"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelected(tab.id)}
                className={`rounded border px-3 py-1 text-xs font-bold ${
                  isActive
                    ? 'border-sun-400 bg-sun-500 text-navy-900'
                    : 'border-navy-500 bg-navy-800/90 text-ink-100 hover:bg-navy-500'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={tab.id !== active}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
