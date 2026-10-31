import { useState } from 'react';
import { FOCUS } from '../modeTabsData';
import type { ModuleCard } from '../modeSelect';
import { defaultModuleId, spotFor } from '../moduleMap';
import type { Navigation } from '../navigation';
import type { ModeTab, Screen } from '../screenState';
import { UI_ASSETS } from '../uiAssets';
import { MapFog } from './MapFog';
import { MapPin } from './MapPin';
import { ModeTabs } from './ModeTabs';

interface ModuleMapProps {
  navigation: Navigation;
  cards: readonly ModuleCard[];
  activeTab: ModeTab;
}

/*
 * Kotak peta berukuran "cover": menutup seluruh layar tetapi tetap 16:9,
 * dipusatkan, sisa yang melebihi layar terpotong. Peta dan bangunan berada di
 * kotak yang sama, jadi bangunan selalu menempel ke lahannya. Panel, tombol,
 * dan tab berada di luar kotak ini, menempel ke tepi layar.
 */
const COVER_BOX = {
  width: 'max(100vw, calc(100vh * 16 / 9))',
  height: 'max(100vh, calc(100vw * 9 / 16))',
} as const;

/**
 * Denah pabrik untuk tab Kampanye (S2). Peta adalah gambar; bangunan adalah
 * tombol HTML di atasnya, jadi teks, status kunci, dan progres tetap berasal
 * dari data.
 */
export function ModuleMap({ navigation, cards, activeTab }: ModuleMapProps) {
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    defaultModuleId(cards),
  );
  const selected = cards.find((card) => card.id === selectedId) ?? null;
  const target: Screen | null =
    selected === null ? null : { id: 'moduleIntro', moduleId: selected.id };
  const canContinue =
    selected !== null &&
    target !== null &&
    selected.unlocked &&
    navigation.canGo(target);
  const percent =
    selected === null || selected.totalCount === 0
      ? 0
      : Math.round((selected.clearedCount / selected.totalCount) * 100);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-navy-900">
      <div
        role="tabpanel"
        aria-label={`Mode ${activeTab}`}
        className="absolute inset-0"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={COVER_BOX}
        >
          <img
            src={UI_ASSETS.mapModules}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover saturate-90"
          />
          {/* Tint navy tipis supaya peta tidak terlalu terang. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-navy-800/25"
          />
          <MapFog layer="back" />

          {cards.map((card) => {
            const spot = spotFor(card.id);
            if (spot === null) return null;
            const isSelected = card.id === selectedId;
            const locked = !card.unlocked;
            const imageTone = [
              locked ? 'grayscale brightness-75' : 'group-hover:brightness-110',
              isSelected
                ? 'scale-105 drop-shadow-[0_0_14px_rgba(255,201,60,0.95)]'
                : 'drop-shadow-lg',
            ].join(' ');
            const status = locked
              ? `terkunci, ${card.lockedReason ?? ''}`
              : 'terbuka';
            return (
              <button
                key={card.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${card.title}: ${card.subtitle}, ${status}`}
                onClick={() => setSelectedId(card.id)}
                className={`group absolute z-10 flex flex-col items-center gap-1 rounded-2xl ${FOCUS}`}
                style={{
                  left: `${spot.left}%`,
                  top: `${spot.top}%`,
                  width: `${spot.width}%`,
                }}
              >
                {isSelected && (
                  <MapPin className="absolute -top-12 left-1/2 z-10 h-11 w-9 -translate-x-1/2" />
                )}
                {locked && (
                  <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-navy-900/90 px-3 py-0.5 text-xs font-extrabold whitespace-nowrap text-ember-500">
                    <span aria-hidden="true">🔒 </span>Terkunci
                  </span>
                )}
                <img
                  src={spot.image}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className={`h-auto w-full select-none transition-all motion-reduce:transition-none ${imageTone}`}
                />
                <span
                  className={`rounded-lg px-3 py-1 text-sm font-bold ${
                    isSelected
                      ? 'bg-sun-400 text-navy-900'
                      : 'bg-navy-900/85 text-white'
                  }`}
                >
                  {card.title}
                </span>
              </button>
            );
          })}

          <MapFog layer="front" />
        </div>

        {selected !== null && (
          <section
            aria-live="polite"
            className="absolute bottom-[4%] left-[2.5%] z-20 w-[38%] max-w-xl space-y-1.5 rounded-2xl border-2 border-sun-400 bg-navy-900/90 p-4 text-ink-100 shadow-xl backdrop-blur-sm"
          >
            <p className="text-xs font-bold tracking-wide text-ember-500 uppercase">
              {selected.title}
            </p>
            <h2 className="text-xl font-black text-sun-400">
              {selected.subtitle}
            </h2>
            <p className="text-sm text-ink-300">{selected.description}</p>
            <p className="text-sm font-semibold">
              {selected.clearedCount} / {selected.totalCount} level
            </p>
            <span
              role="progressbar"
              aria-label="Progres level"
              aria-valuemin={0}
              aria-valuemax={selected.totalCount}
              aria-valuenow={selected.clearedCount}
              className="block h-2 w-full overflow-hidden rounded-full bg-navy-700"
            >
              <span
                className="block h-full rounded-full bg-sun-400"
                style={{ width: `${percent}%` }}
              />
            </span>
            {selected.lockedReason !== null && (
              <p className="rounded-lg bg-navy-700 px-3 py-1 text-sm font-semibold text-ember-500">
                <span aria-hidden="true">🔒 </span>
                Terkunci: {selected.lockedReason}
              </p>
            )}
          </section>
        )}

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            if (target !== null) navigation.go(target);
          }}
          className={`absolute right-[2.5%] bottom-[4%] z-20 flex items-center gap-2 rounded-full border-b-4 px-8 py-3 text-base font-extrabold shadow-lg transition-colors ${FOCUS} ${
            canContinue
              ? 'border-amber-600 bg-sun-400 text-navy-900 hover:bg-sun-500'
              : 'cursor-not-allowed border-navy-700 bg-navy-800 text-ink-300 opacity-70'
          }`}
        >
          <span>Selanjutnya</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <header className="absolute inset-x-[2.5%] top-[3.5%] z-30 flex items-center justify-between">
        <button
          type="button"
          onClick={navigation.back}
          className={`rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold text-ink-100 hover:bg-navy-700 ${FOCUS}`}
        >
          Kembali
        </button>
        <ModeTabs activeTab={activeTab} onSelect={navigation.selectModeTab} />
        <span aria-hidden="true" className="w-24" />
      </header>
    </main>
  );
}
