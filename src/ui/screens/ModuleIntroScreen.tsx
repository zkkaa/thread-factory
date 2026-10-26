import { useEffect, useRef } from 'react';
import type { ModuleDefinition } from '../../levels/types';
import { type AutoAdvance, createAutoAdvance } from '../autoAdvance';
import type { Navigation } from '../navigation';

/** Lama kartu judul tampil sebelum otomatis lanjut (PRD bagian 16, S3). */
export const MODULE_INTRO_MS = 3000;

interface ModuleIntroScreenProps {
  navigation: Navigation;
  moduleDef: ModuleDefinition;
}

/**
 * Kartu judul modul (S3 bagian A). Lanjut otomatis ke Peta Level, atau lebih
 * cepat lewat ketukan di mana saja atau tombol Lewati.
 */
export function ModuleIntroScreen({
  navigation,
  moduleDef,
}: ModuleIntroScreenProps) {
  // Navigation dibuat ulang tiap render AppShell; ref menjaga timer tetap
  // memakai versi terbaru tanpa menjadwalkan ulang.
  const navigationRef = useRef(navigation);
  const advanceRef = useRef<AutoAdvance | null>(null);
  const moduleId = moduleDef.id;

  useEffect(() => {
    navigationRef.current = navigation;
  });

  useEffect(() => {
    const advance = createAutoAdvance(
      () => navigationRef.current.replace({ id: 'levelMap', moduleId }),
      MODULE_INTRO_MS,
    );
    advanceRef.current = advance;
    return () => {
      advance.cancel();
      advanceRef.current = null;
    };
  }, [moduleId]);

  const skip = () => advanceRef.current?.skip();

  return (
    <main
      onClick={skip}
      className="flex h-screen flex-col items-center justify-center gap-8 bg-linear-to-br from-navy-900 to-navy-700 px-12 text-center text-ink-100"
    >
      <header className="max-w-3xl space-y-3">
        <p className="text-xl font-bold tracking-widest text-ember-500 uppercase">
          {moduleDef.title}
        </p>
        <h1 className="text-6xl leading-tight font-black text-sun-400">
          {moduleDef.subtitle}
        </h1>
        <p className="pt-2 text-lg text-ink-300">{moduleDef.description}</p>
      </header>

      <section aria-label="Konsep yang akan dipelajari" className="max-w-3xl">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-300 uppercase">
          Yang akan kamu pelajari
        </h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {moduleDef.concepts.map((concept) => (
            <li
              key={concept}
              className="rounded-full border border-navy-500 bg-navy-800 px-4 py-1 text-sm font-semibold"
            >
              {concept}
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={skip}
          className="rounded-xl bg-sun-400 px-8 py-3 text-lg font-bold text-navy-900 shadow-md hover:bg-sun-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400"
        >
          Lewati
        </button>
        <p className="text-sm text-ink-300">
          {moduleDef.levelIds.length} level · lanjut otomatis sebentar lagi,
          atau ketuk di mana saja
        </p>
      </footer>
    </main>
  );
}
