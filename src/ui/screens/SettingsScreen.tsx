import { useState } from 'react';
import type { SettingsData, SettingsPatch } from '../../progress/settingsStore';
import { APP_VERSION } from '../../version';
import {
  ASSET_CREDITS,
  GENERATOR_NOTE,
  ICON_NOTE,
  TEAM_MEMBERS,
} from '../credits';
import type { Navigation } from '../navigation';

interface SettingsScreenProps {
  navigation: Navigation;
  settings: Readonly<SettingsData>;
  onChange: (patch: SettingsPatch) => void;
  onResetProgress: () => void;
}

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400';

interface ToggleRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}

/** Sakelar berlabel; status tertulis ("Aktif"/"Mati"), bukan hanya warna. */
function ToggleRow({ label, hint, checked, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-navy-500 bg-navy-800 px-4 py-3">
      <div>
        <p className="font-bold">{label}</p>
        <p className="text-sm text-ink-300">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`w-24 shrink-0 rounded-lg px-4 py-2 font-bold ${FOCUS} ${
          checked
            ? 'bg-sun-400 text-navy-900'
            : 'border border-navy-500 bg-navy-900 text-ink-100'
        }`}
      >
        {checked ? 'Aktif' : 'Mati'}
      </button>
    </div>
  );
}

/** Layar Pengaturan dan Kredit (S10). */
export function SettingsScreen({
  navigation,
  settings,
  onChange,
  onResetProgress,
}: SettingsScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const volumePercent = Math.round(settings.volume * 100);

  return (
    <main className="h-screen overflow-y-auto bg-linear-to-br from-navy-900 to-navy-700 px-12 py-8 text-ink-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={navigation.back}
            className={`rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold hover:bg-navy-700 ${FOCUS}`}
          >
            Kembali
          </button>
          <h1 className="text-4xl font-black text-sun-400">Pengaturan</h1>
          <span aria-hidden="true" className="w-24" />
        </header>

        <section className="flex flex-col gap-3" aria-label="Pengaturan umum">
          <div className="rounded-xl border border-navy-500 bg-navy-800 px-4 py-3">
            <label htmlFor="settings-volume" className="font-bold">
              Volume suara
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                id="settings-volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={volumePercent}
                onChange={(event) =>
                  onChange({ volume: Number(event.target.value) / 100 })
                }
                className={`flex-1 accent-sun-400 ${FOCUS}`}
              />
              <span className="w-12 text-right font-bold">
                {volumePercent}%
              </span>
            </div>
          </div>

          <ToggleRow
            label="Kurangi animasi"
            hint="Mematikan efek berlebihan; tidak mengubah hasil simulasi."
            checked={settings.reduceMotion}
            onToggle={() => onChange({ reduceMotion: !settings.reduceMotion })}
          />
          <ToggleRow
            label="Buka semua level (mode demo)"
            hint="Untuk dosen dan penguji agar bisa melihat seluruh isi game."
            checked={settings.demoMode}
            onToggle={() => onChange({ demoMode: !settings.demoMode })}
          />
        </section>

        <section
          className="flex flex-col gap-3 rounded-xl border border-navy-500 bg-navy-800 px-4 py-3"
          aria-label="Reset progres"
        >
          <h2 className="font-bold">Reset progres</h2>
          <p className="text-sm text-ink-300">
            Menghapus semua bintang dan level yang sudah selesai. Tidak bisa
            dibatalkan.
          </p>
          {confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-semibold text-ember-500">
                Yakin hapus semua progres?
              </p>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirming(false);
                  setResetDone(true);
                }}
                className={`rounded-lg bg-ember-500 px-4 py-2 font-bold text-navy-900 ${FOCUS}`}
              >
                Ya, hapus
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className={`rounded-lg border border-navy-500 bg-navy-900 px-4 py-2 font-bold ${FOCUS}`}
              >
                Batal
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setResetDone(false);
                  setConfirming(true);
                }}
                className={`rounded-lg border border-ember-500 bg-navy-900 px-4 py-2 font-bold text-ember-500 ${FOCUS}`}
              >
                Hapus Progres
              </button>
              {resetDone && (
                <p role="status" className="text-sm font-semibold text-sun-400">
                  Progres dihapus.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3" aria-label="Kredit">
          <h2 className="text-2xl font-black text-sun-400">Kredit</h2>
          <ul className="flex flex-col gap-2">
            {ASSET_CREDITS.map((credit) => (
              <li
                key={credit.name}
                className="rounded-xl border border-navy-500 bg-navy-800 px-4 py-2 text-sm"
              >
                <span className="font-bold">{credit.name}</span>
                <span className="text-ink-300">
                  {' '}
                  · {credit.source} · {credit.license}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm">{ICON_NOTE}</p>
          <p className="text-sm">{GENERATOR_NOTE}</p>
          <div>
            <h3 className="font-bold">Tim</h3>
            <ul className="mt-1 list-disc pl-6 text-sm">
              {TEAM_MEMBERS.map((member) => (
                <li key={member}>{member}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-ink-300">
            Thread Factory: Pabrik Rebutan v{APP_VERSION}
          </p>
        </section>
      </div>
    </main>
  );
}
