import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { ScoreboardData } from '../../progress/scoreboardStore';
import type { SettingsData, SettingsPatch } from '../../progress/settingsStore';
import { CatatanBoard, CatatanPanel } from '../components/catatan/CatatanBoard';
import { ComicRow, ComicToggle } from '../components/catatan/ComicToggle';
import { CreditsPanel } from '../components/catatan/CreditsPanel';
import { StickyNote } from '../components/catatan/StickyNote';
import { ScoreboardPanel } from '../components/ScoreboardPanel';
import type { Navigation } from '../navigation';
import {
  DEFAULT_SETTINGS_TAB,
  SETTINGS_TABS,
  mandorSays,
} from '../settingsTabs';
import type { SettingsTabId } from '../settingsTabs';
import { UI_ASSETS } from '../uiAssets';

interface SettingsScreenProps {
  navigation: Navigation;
  settings: Readonly<SettingsData>;
  onChange: (patch: SettingsPatch) => void;
  onResetProgress: () => void;
  /** Papan skor lokal; isi tab Papan Skor hanya tampil bila diberikan. */
  scoreboard?: Readonly<ScoreboardData>;
  scoreboardLevels?: readonly { id: string; title: string }[];
}

const ID = 'settings';

/** Latar dengan lapisan gelap agar papan lebih menonjol. */
const BACKGROUND = `linear-gradient(rgba(5, 15, 32, 0.45), rgba(5, 15, 32, 0.45)), url(${UI_ASSETS.catatanBackground})`;

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900';

const NOTE_BUTTON = `rounded-lg border-[3px] border-navy-900 px-3 py-1.5 text-sm font-black shadow-[3px_3px_0_#0b1f3a] ${FOCUS}`;

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8">
      <path
        d="M12 3 2 21h20L12 3z"
        fill="#e53935"
        stroke="#0b1f3a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v5M12 17.6v.4"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Layar Pengaturan dan Kredit (S10), bergaya buku catatan Pak Mandor. */
export function SettingsScreen({
  navigation,
  settings,
  onChange,
  onResetProgress,
  scoreboard,
  scoreboardLevels = [],
}: SettingsScreenProps) {
  const [tab, setTab] = useState<SettingsTabId>(DEFAULT_SETTINGS_TAB);
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const volumePercent = Math.round(settings.volume * 100);

  return (
    <main
      className="relative flex h-screen flex-col items-center gap-3 overflow-hidden bg-navy-900 bg-cover bg-center px-4 py-4 text-navy-900"
      style={{ backgroundImage: BACKGROUND }}
    >
      <button
        type="button"
        onClick={navigation.back}
        className={`absolute left-3 top-3 z-10 rounded-lg border-[3px] border-navy-900 bg-navy-800 px-4 py-2 font-semibold text-ink-100 hover:bg-navy-700 ${FOCUS}`}
      >
        Kembali
      </button>
      <h1 className="-rotate-1 border-[3px] border-navy-900 bg-sun-400 px-8 py-1 text-3xl font-black shadow-[4px_4px_0_#0b1f3a]">
        Pengaturan
      </h1>

      <CatatanBoard
        idPrefix={ID}
        tabs={SETTINGS_TABS}
        active={tab}
        onSelect={setTab}
        tabsLabel="Bagian pengaturan"
        bubble={mandorSays(tab, volumePercent)}
      >
        <CatatanPanel idPrefix={ID} tabId="umum" active={tab === 'umum'}>
          <div className="flex gap-6 pt-1">
            <section
              className="flex min-w-0 flex-1 flex-col"
              aria-label="Pengaturan umum"
            >
              <ComicRow icon="speaker" label="Volume" htmlFor="settings-volume">
                <input
                  id="settings-volume"
                  aria-label="Volume suara"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={volumePercent}
                  onChange={(event) =>
                    onChange({ volume: Number(event.target.value) / 100 })
                  }
                  className="comic-range min-w-0 flex-1"
                  style={{ '--fill': `${volumePercent}%` } as CSSProperties}
                />
                <span className="w-14 text-right text-lg font-black">
                  {volumePercent}%
                </span>
              </ComicRow>
              <ComicRow
                icon="gamepad"
                label="Mode demo"
                hint="Buka semua level untuk dosen dan penguji."
              >
                <ComicToggle
                  label="Buka semua level (mode demo)"
                  checked={settings.demoMode}
                  onToggle={() => onChange({ demoMode: !settings.demoMode })}
                  reduceMotion={settings.reduceMotion}
                />
              </ComicRow>
            </section>

            <StickyNote label="Reset progres">
              <WarningIcon />
              <h2 className="border-b-2 border-navy-900 px-2 text-xl font-black uppercase leading-tight">
                Hapus Progres
              </h2>
              {confirming ? (
                <>
                  <p className="text-sm font-black">
                    Yakin hapus semua progres?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetProgress();
                        setConfirming(false);
                        setResetDone(true);
                      }}
                      className={`${NOTE_BUTTON} bg-[#d0312d] text-white`}
                    >
                      Ya, hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className={`${NOTE_BUTTON} bg-white`}
                    >
                      Batal
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold leading-snug">
                    Semua progres akan dihapus! Tidak bisa dibatalkan.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setResetDone(false);
                      setConfirming(true);
                    }}
                    className={`${NOTE_BUTTON} bg-[#d0312d] text-white`}
                  >
                    Hapus Sekarang
                  </button>
                </>
              )}
              {resetDone && (
                <p role="status" className="text-sm font-black">
                  Progres dihapus.
                </p>
              )}
            </StickyNote>
          </div>
        </CatatanPanel>

        <CatatanPanel idPrefix={ID} tabId="skor" active={tab === 'skor'}>
          {scoreboard !== undefined ? (
            <ScoreboardPanel data={scoreboard} levels={scoreboardLevels} />
          ) : (
            <p className="pt-2 font-semibold">Papan skor belum tersedia.</p>
          )}
        </CatatanPanel>

        <CatatanPanel idPrefix={ID} tabId="kredit" active={tab === 'kredit'}>
          <CreditsPanel />
        </CatatanPanel>
      </CatatanBoard>
    </main>
  );
}