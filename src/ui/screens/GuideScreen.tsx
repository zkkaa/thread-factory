import type { ReactNode } from 'react';
import {
  GLOSSARY,
  GUIDE_STEPS,
  GUIDE_TIPS,
  HUD_CONTROLS,
  ROBOT_STATES,
  type RobotStateInfo,
  SCHEDULER_NOTE,
} from '../guideContent';
import type { Navigation } from '../navigation';

interface GuideScreenProps {
  navigation: Navigation;
}

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400';

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

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-black text-sun-400">{title}</h2>
      {children}
    </section>
  );
}

/** Layar Panduan (S9). Isinya dari ui/guideContent.ts. */
export function GuideScreen({ navigation }: GuideScreenProps) {
  return (
    <main className="h-screen overflow-y-auto bg-linear-to-br from-navy-900 to-navy-700 px-12 py-8 text-ink-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={navigation.back}
            className={`rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold hover:bg-navy-700 ${FOCUS}`}
          >
            Kembali
          </button>
          <h1 className="text-4xl font-black text-sun-400">Panduan</h1>
          <span aria-hidden="true" className="w-24" />
        </header>

        <Section title="Cara bermain">
          <ol className="grid gap-3 md:grid-cols-3">
            {GUIDE_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-navy-500 bg-navy-800 p-4"
              >
                <p className="text-sm font-bold text-ember-500">
                  Langkah {index + 1}
                </p>
                <h3 className="text-xl font-black uppercase">{step.title}</h3>
                <p className="mt-1">{step.text}</p>
              </li>
            ))}
          </ol>
          <ul className="list-disc pl-6 text-sm text-ink-300">
            {GUIDE_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </Section>

        <Section title="Arti status robot">
          <p className="text-ink-300">{SCHEDULER_NOTE}</p>
          <ul className="flex flex-col gap-2">
            {ROBOT_STATES.map((info) => (
              <li key={info.state} className="flex items-center gap-4">
                <span
                  className={`w-32 shrink-0 rounded-lg px-3 py-1 text-center text-sm font-black ${STATE_TONE[info.state]}`}
                >
                  {info.state}
                </span>
                <span>{info.meaning}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Kontrol dan HUD">
          <dl className="grid gap-2">
            {HUD_CONTROLS.map((control) => (
              <div
                key={control.label}
                className="rounded-xl border border-navy-500 bg-navy-800 px-4 py-3"
              >
                <dt className="font-bold text-sun-400">{control.label}</dt>
                <dd className="text-sm">{control.text}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Glosarium">
          <dl className="grid gap-3">
            {GLOSSARY.map((entry) => (
              <div
                key={entry.term}
                className="rounded-xl border border-navy-500 bg-navy-800 p-4"
              >
                <dt className="text-lg font-bold text-sun-400">{entry.term}</dt>
                <dd className="mt-1">{entry.definition}</dd>
                <dd className="mt-1 text-sm text-ink-300">
                  <span className="font-semibold text-ember-500">
                    Di game:{' '}
                  </span>
                  {entry.inGame}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </main>
  );
}
