import { useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import {
  BOARD_ASPECT,
  MANDOR_OVERLAP_RATIO,
  MANDOR_WIDTH_RATIO,
  PAPER_INSET,
  boardWidthCss,
  moveTab,
} from '../../catatan';
import type { TabDef, TabGlyphName } from '../../catatan';
import { UI_ASSETS } from '../../uiAssets';

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900';

const GLYPH_PATHS: Record<TabGlyphName, string> = {
  play: 'M7 4l13 8-13 8V4z',
  robot:
    'M12 3v3M6 8h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2zM9 13h.01M15 13h.01M9 17h6',
  gear: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  book: 'M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14',
  speaker: 'M4 9v6h4l5 4V5L8 9H4zM16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12',
  bars: 'M5 20v-8h3v8zM10.5 20V6h3v14zM16 20v-9h3v9z',
  trophy:
    'M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 20h8',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1-6.1L3.2 9.5l6.1-.9z',
};

function TabGlyph({ name }: { name: TabGlyphName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={GLYPH_PATHS[name]} />
    </svg>
  );
}

interface CatatanBoardProps<Id extends string> {
  /** Awalan id agar tab dan panel saling terhubung (aria-controls). */
  idPrefix: string;
  tabs: readonly TabDef<Id>[];
  active: Id;
  onSelect: (id: Id) => void;
  tabsLabel: string;
  /** Ucapan Pak Mandor di gelembung. */
  bubble: string;
  /** Isi: satu CatatanPanel per tab. */
  children: ReactNode;
}

/** Papan klip bertab dengan Pak Mandor di sisi kanan; dipakai Pengaturan dan Panduan. */
export function CatatanBoard<Id extends string>({
  idPrefix,
  tabs,
  active,
  onSelect,
  tabsLabel,
  bubble,
  children,
}: CatatanBoardProps<Id>) {
  // Bila gambar papan gagal dimuat, papan digambar dengan CSS (placeholder).
  const [boardFailed, setBoardFailed] = useState(false);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = moveTab(tabs, active, event.key);
    if (next === null) return;
    event.preventDefault();
    onSelect(next);
    document.getElementById(`${idPrefix}-tab-${next}`)?.focus();
  }

  return (
    <div
      className="relative flex items-center"
      style={{ '--board-w': boardWidthCss() } as CSSProperties}
    >
      <div
        className="relative shrink-0"
        style={{
          width: 'var(--board-w)',
          aspectRatio: String(BOARD_ASPECT),
        }}
      >
        {boardFailed ? (
          <div className="absolute inset-0 rounded-3xl border-4 border-navy-900 bg-[#a9743c]" />
        ) : (
          <img
            src={UI_ASSETS.catatanBoard}
            alt=""
            aria-hidden="true"
            draggable={false}
            onError={() => setBoardFailed(true)}
            className="absolute inset-0 h-full w-full select-none"
          />
        )}

        <div
          className={`absolute flex flex-col ${
            boardFailed ? 'rounded-2xl bg-cream-50' : ''
          }`}
          style={{
            top: `${PAPER_INSET.top}%`,
            right: `${PAPER_INSET.right}%`,
            bottom: `${PAPER_INSET.bottom}%`,
            left: `${PAPER_INSET.left}%`,
          }}
        >
          <div
            role="tablist"
            aria-label={tabsLabel}
            onKeyDown={handleKeyDown}
            className="flex shrink-0 gap-2 px-2"
          >
            {tabs.map((tab) => {
              const selected = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${idPrefix}-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${idPrefix}-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onSelect(tab.id)}
                  className={`flex items-center gap-2 rounded-t-xl border-[3px] border-b-0 border-navy-900 px-5 py-2.5 text-base font-extrabold text-navy-900 ${FOCUS} ${tab.color} ${
                    selected
                      ? 'underline decoration-[3px] underline-offset-4 shadow-[0_-3px_0_rgba(0,0,0,0.15)]'
                      : 'translate-y-1 brightness-90 hover:brightness-100'
                  }`}
                >
                  <TabGlyph name={tab.glyph} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto border-t-[3px] border-navy-900 pt-2 text-navy-900">
            <div className="px-3">{children}</div>
          </div>
        </div>
      </div>

      <div
        className="relative shrink-0 translate-y-[8%]"
        style={{
          width: `calc(var(--board-w) * ${MANDOR_WIDTH_RATIO})`,
          marginLeft: `calc(var(--board-w) * -${MANDOR_OVERLAP_RATIO})`,
        }}
      >
        <div className="absolute bottom-full left-[12%] mb-1 w-[92%] rounded-3xl border-[3px] border-navy-900 bg-cream-50 px-3 py-2 text-sm font-bold text-navy-900 shadow-xl">
          {bubble}
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 h-4 w-4 rotate-45 border-b-[3px] border-r-[3px] border-navy-900 bg-cream-50"
          />
        </div>
        <img
          src={UI_ASSETS.mandorIntip}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none block w-full select-none"
        />
      </div>
    </div>
  );
}

interface CatatanPanelProps {
  idPrefix: string;
  tabId: string;
  active: boolean;
  children: ReactNode;
}

/** Satu halaman tab; yang tidak aktif disembunyikan (tetap ada di DOM). */
export function CatatanPanel({
  idPrefix,
  tabId,
  active,
  children,
}: CatatanPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${tabId}`}
      aria-labelledby={`${idPrefix}-tab-${tabId}`}
      hidden={!active}
    >
      {children}
    </div>
  );
}
