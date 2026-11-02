import { useEffect, useRef, useState } from 'react';
import type { ModuleDefinition } from '../../levels/types';
import { MapFog } from '../components/MapFog';
import { type AutoAdvance, createAutoAdvance } from '../autoAdvance';
import { moduleBuildingImage, moduleMapBackground } from '../moduleArt';
import type { Navigation } from '../navigation';

/** Lama bar terisi sebelum tombol Lanjut muncul (PRD bagian 16, S3). */
export const MODULE_INTRO_MS = 3000;

interface ModuleIntroScreenProps {
  navigation: Navigation;
  moduleDef: ModuleDefinition;
  /** Pengaturan "kurangi animasi": tanpa bar, tombol Lanjut langsung tampil. */
  reduceMotion?: boolean;
}

/*
 * Warna lencana konsep bergantian. Kelas ditulis utuh supaya terdeteksi
 * Tailwind; `hole` = warna lubang roda gigi, sama dengan warna lencananya.
 */
const TONES = [
  { badge: 'bg-sun-400', hole: 'fill-sun-400' },
  { badge: 'bg-ember-500', hole: 'fill-ember-500' },
  { badge: 'bg-sky-400', hole: 'fill-sky-400' },
  { badge: 'bg-emerald-400', hole: 'fill-emerald-400' },
] as const;

const HEXAGON =
  '[clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]';

function ConceptBadge({ index }: { index: number }) {
  const tone = TONES[index % TONES.length];
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center ${HEXAGON} ${tone.badge}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-navy-900">
        {[0, 45, 90, 135].map((degree) => (
          <rect
            key={degree}
            x="10.5"
            y="1.5"
            width="3"
            height="21"
            rx="1"
            transform={`rotate(${degree} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2.4" className={tone.hole} />
      </svg>
    </span>
  );
}

/**
 * Kartu judul modul (S3 bagian A): bangunan modul besar di kiri, judul dan
 * konsep di kanan, di atas peta Peta Level yang diburamkan. Bar terisi dulu;
 * setelah penuh baru tombol Lanjut muncul dan pemain sendiri yang melanjutkan
 * ke Peta Level. Ketuk di mana saja sebelum penuh mempercepat bar.
 */
export function ModuleIntroScreen({
  navigation,
  moduleDef,
  reduceMotion = false,
}: ModuleIntroScreenProps) {
  // Navigation dibuat ulang tiap render AppShell; ref menjaga tombol tetap
  // memakai versi terbaru.
  const navigationRef = useRef(navigation);
  const barRef = useRef<AutoAdvance | null>(null);
  const moduleId = moduleDef.id;
  const [barFull, setBarFull] = useState(false);
  // Tanpa animasi tidak ada bar yang perlu ditunggu.
  const ready = barFull || reduceMotion;

  useEffect(() => {
    navigationRef.current = navigation;
  });

  useEffect(() => {
    // Dipakai sebagai penunggu, bukan pemindah layar: saat habis, bar penuh
    // dan tombol Lanjut muncul.
    const bar = createAutoAdvance(() => setBarFull(true), MODULE_INTRO_MS);
    barRef.current = bar;
    return () => {
      bar.cancel();
      barRef.current = null;
    };
  }, [moduleId]);

  const revealButton = () => barRef.current?.skip();
  const proceed = () =>
    navigationRef.current.replace({ id: 'levelMap', moduleId });

  const background = moduleMapBackground(moduleId);
  const building = moduleBuildingImage(moduleId);

  return (
    <main
      onClick={ready ? undefined : revealButton}
      className="relative h-screen overflow-hidden bg-navy-900 text-ink-100"
    >
      {/* Latar: peta diburamkan, tint navy, dan kabut. isolate menjaga z-index kabut. */}
      <div aria-hidden="true" className="absolute inset-0 isolate">
        {background !== null && (
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center blur-md"
            style={{ backgroundImage: `url(${background})` }}
          />
        )}
        <div className="absolute inset-0 bg-navy-900/55" />
        <MapFog layer="back" />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center gap-10 px-[6%]">
        {building !== null && (
          <div className="relative w-[34%] max-w-md shrink-0">
            <div
              aria-hidden="true"
              className="absolute inset-x-[-10%] bottom-[-4%] h-1/3 rounded-full bg-sun-400/30 blur-2xl"
            />
            <img
              src={building}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="relative h-auto w-full select-none drop-shadow-[0_0_28px_rgba(255,201,60,0.75)]"
            />
          </div>
        )}

        <div className="flex w-full max-w-2xl flex-col items-start gap-5">
          <h1 className="flex flex-col items-start gap-3">
            <span className="text-7xl leading-none font-black tracking-wide text-sun-400 [paint-order:stroke_fill] [-webkit-text-stroke:6px_#0b1f3a]">
              {moduleDef.title}
            </span>
            <span className="rounded-xl border-[3px] border-navy-900 bg-cream-50 px-6 py-2 text-3xl font-black text-navy-900 shadow-lg">
              {moduleDef.subtitle}
            </span>
          </h1>

          <p className="rounded-2xl bg-navy-900/70 px-5 py-3 text-lg leading-relaxed backdrop-blur-sm">
            {moduleDef.description}
          </p>

          <section aria-label="Konsep yang akan dipelajari">
            <h2 className="mb-2 text-sm font-extrabold tracking-wide uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
              Yang akan kamu pelajari
            </h2>
            <ul className="flex flex-wrap gap-2">
              {moduleDef.concepts.map((concept, index) => (
                <li
                  key={concept}
                  className="flex items-center gap-2 rounded-full border-2 border-navy-900 bg-cream-50 py-1 pr-4 pl-1.5 text-sm font-bold text-navy-900 shadow-md"
                >
                  <ConceptBadge index={index} />
                  {concept}
                </li>
              ))}
            </ul>
          </section>

          <footer className="flex flex-col items-start gap-3">
            {/* Tinggi dicadangkan supaya tata letak tidak melompat saat tombol muncul. */}
            <div className="flex min-h-14 items-center">
              {ready ? (
                <button
                  type="button"
                  autoFocus
                  onClick={proceed}
                  className={`flex items-center gap-2 rounded-full border-b-4 border-amber-600 bg-sun-400 px-10 py-3 text-lg font-extrabold text-navy-900 shadow-lg hover:bg-sun-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    reduceMotion ? '' : 'animate-star-pop'
                  }`}
                >
                  <span>Lanjut</span>
                  <span aria-hidden="true">→</span>
                </button>
              ) : (
                <p className="text-base font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                  Menyiapkan modul...
                </p>
              )}
            </div>
            {!reduceMotion && (
              <div
                aria-hidden="true"
                className="h-3 w-64 overflow-hidden rounded-full border-2 border-navy-900 bg-navy-800/80"
              >
                <div
                  className="h-full origin-left rounded-full bg-sun-400"
                  style={
                    ready
                      ? { transform: 'scaleX(1)' }
                      : {
                          animationName: 'intro-bar-fill',
                          animationDuration: `${MODULE_INTRO_MS}ms`,
                          animationTimingFunction: 'linear',
                          animationFillMode: 'forwards',
                        }
                  }
                />
              </div>
            )}
            <p className="text-sm [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
              {moduleDef.levelIds.length} level ·{' '}
              {ready
                ? 'tekan Lanjut untuk membuka peta level'
                : 'ketuk di mana saja untuk langsung lanjut'}
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
