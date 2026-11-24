import { useState } from 'react';
import type { ReactNode } from 'react';
import { CatatanBoard, CatatanPanel } from '../components/catatan/CatatanBoard';
import {
  GLOSSARY,
  GUIDE_STEPS,
  GUIDE_TIPS,
  HUD_CONTROLS,
  ROBOT_STATES,
  type RobotStateInfo,
  SCHEDULER_NOTE,
} from '../guideContent';
import { DEFAULT_GUIDE_TAB, GUIDE_TABS, guideMandorSays } from '../guideTabs';
import type { GuideTabId } from '../guideTabs';
import type { Navigation } from '../navigation';
import { UI_ASSETS } from '../uiAssets';

interface GuideScreenProps {
  navigation: Navigation;
}

const ID = 'guide';

/** Latar dengan lapisan gelap agar papan lebih menonjol (sama dengan Pengaturan). */
const BACKGROUND = `linear-gradient(rgba(5, 15, 32, 0.45), rgba(5, 15, 32, 0.45)), url(${UI_ASSETS.catatanBackground})`;

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900';

const CARD =
  'rounded-xl border-[3px] border-navy-900 bg-white/60 shadow-[3px_3px_0_#0b1f3a]';

/**
 * Warna lencana status. Selalu dipasangkan dengan teks label (CLAUDE.md
 * aturan 8). Disamakan dengan game/theme.ts saat U-053.
 */
const STATE_TONE: Record<RobotStateInfo['state'], string> = {
  READY: 'bg-sky-400 text-navy-900',
  RUNNING: 'bg-emerald-400 text-navy-900',
  WAITING: 'bg-ember-500 text-navy-900',
  TERMINATED: 'bg-ink-300 text-navy-900',
};

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 inline-block -rotate-1 border-[3px] border-navy-900 bg-sun-400 px-4 py-0.5 text-xl font-black shadow-[3px_3px_0_#0b1f3a]">
      {children}
    </h2>
  );
}

/** Layar Panduan (S9), bergaya buku catatan Pak Mandor. Isinya dari ui/guideContent.ts. */
export function GuideScreen({ navigation }: GuideScreenProps) {
  const [tab, setTab] = useState<GuideTabId>(DEFAULT_GUIDE_TAB);

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
        Panduan
      </h1>

      <CatatanBoard
        idPrefix={ID}
        tabs={GUIDE_TABS}
        active={tab}
        onSelect={setTab}
        tabsLabel="Bagian panduan"
        bubble={guideMandorSays(tab)}
      >
        <CatatanPanel idPrefix={ID} tabId="cara" active={tab === 'cara'}>
          <section className="pb-3" aria-label="Cara bermain">
            <PanelTitle>Cara bermain</PanelTitle>
            <ol className="grid gap-4 md:grid-cols-3">
              {GUIDE_STEPS.map((step, index) => (
                <li key={step.title} className={`${CARD} relative p-4 pt-6`}>
                  <span className="absolute -top-3 left-3 -rotate-3 rounded-md border-[3px] border-navy-900 bg-ember-500 px-2 py-0.5 text-sm font-black">
                    Langkah {index + 1}
                  </span>
                  <h3 className="text-lg font-black uppercase">{step.title}</h3>
                  <p className="mt-1 text-sm">{step.text}</p>
                </li>
              ))}
            </ol>
            <ul className="mt-5 flex list-disc flex-col gap-1.5 rounded-xl border-2 border-dashed border-navy-900/50 bg-[#f7d65a]/50 p-3 pl-8 text-sm">
              {GUIDE_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </CatatanPanel>

        <CatatanPanel idPrefix={ID} tabId="status" active={tab === 'status'}>
          <section className="pb-3" aria-label="Arti status robot">
            <PanelTitle>Arti status robot</PanelTitle>
            <p className={`${CARD} mb-3 px-3 py-2 text-sm`}>{SCHEDULER_NOTE}</p>
            <ul className="flex flex-col">
              {ROBOT_STATES.map((info) => (
                <li
                  key={info.state}
                  className="flex items-center gap-4 border-b-2 border-navy-900/20 py-2.5"
                >
                  <span
                    className={`w-32 shrink-0 rounded-lg border-[3px] border-navy-900 px-3 py-1 text-center text-sm font-black shadow-[2px_2px_0_#0b1f3a] ${STATE_TONE[info.state]}`}
                  >
                    {info.state}
                  </span>
                  <span className="text-sm font-semibold">{info.meaning}</span>
                </li>
              ))}
            </ul>
          </section>
        </CatatanPanel>

        <CatatanPanel idPrefix={ID} tabId="kontrol" active={tab === 'kontrol'}>
          <section className="pb-3" aria-label="Kontrol dan HUD">
            <PanelTitle>Kontrol dan HUD</PanelTitle>
            <dl className="flex flex-col">
              {HUD_CONTROLS.map((control) => (
                <div
                  key={control.label}
                  className="flex items-start gap-3 border-b-2 border-navy-900/20 py-2.5"
                >
                  <dt className="w-40 shrink-0 rounded-md border-[3px] border-navy-900 bg-sun-400 px-2 py-1 text-center text-sm font-black">
                    {control.label}
                  </dt>
                  <dd className="text-sm font-semibold">{control.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </CatatanPanel>

        <CatatanPanel
          idPrefix={ID}
          tabId="glosarium"
          active={tab === 'glosarium'}
        >
          <section className="pb-3" aria-label="Glosarium">
            <PanelTitle>Glosarium</PanelTitle>
            <dl className="flex flex-col gap-3">
              {GLOSSARY.map((entry) => (
                <div key={entry.term} className={`${CARD} p-3`}>
                  <dt className="inline-block rounded-md border-[3px] border-navy-900 bg-[#b99be8] px-2 py-0.5 text-lg font-black">
                    {entry.term}
                  </dt>
                  <dd className="mt-1.5 text-sm">{entry.definition}</dd>
                  <dd className="mt-1 text-sm">
                    <span className="font-black text-[#b45309]">Di game: </span>
                    {entry.inGame}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </CatatanPanel>
      </CatatanBoard>
    </main>
  );
}
