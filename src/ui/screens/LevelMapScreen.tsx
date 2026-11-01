import { useState } from 'react';
import type { ModuleDefinition } from '../../levels/types';
import type { ProgressData } from '../../progress/progressStore';
import type { UnlockContext } from '../../progress/unlocks';
import { LevelPedestal } from '../components/LevelPedestal';
import { LevelRoad } from '../components/LevelRoad';
import { MapFog } from '../components/MapFog';
import {
  NONE_YET_MESSAGE,
  buildLevelMap,
  focusLevelId,
  selectionAction,
} from '../levelMap';
import { layoutFor } from '../levelMapLayout';
import { buildRoadSegments } from '../levelMapPath';
import { FOCUS } from '../modeTabsData';
import type { Navigation } from '../navigation';
import type { Screen } from '../screenState';
import { UI_ASSETS } from '../uiAssets';

interface LevelMapScreenProps {
  navigation: Navigation;
  moduleDef: ModuleDefinition;
  context: UnlockContext;
  progress: Readonly<ProgressData>;
  /** Judul level, atau undefined bila datanya belum dibuat. */
  getLevelTitle: (levelId: string) => string | undefined;
  /** Pengaturan "kurangi animasi": mematikan denyut sorotan level berikutnya. */
  reduceMotion?: boolean;
}

/*
 * Kotak peta berukuran "cover" seperti di ModuleMap: menutup seluruh layar
 * tetapi tetap 16:9, dipusatkan. Peta, jalur, titik level, dan robot berada
 * di kotak yang sama, jadi selalu menempel ke lahannya. Header dan panel
 * bawah berada di luar kotak. `containerType: size` membuat satuan cqw pada
 * anak-anaknya mengikuti ukuran kotak ini.
 */
const COVER_BOX = {
  width: 'max(100vw, calc(100vh * 16 / 9))',
  height: 'max(100vh, calc(100vw * 9 / 16))',
  containerType: 'size',
} as const;

function Stars({ count }: { count: number }) {
  return (
    <span aria-hidden="true" className="text-xl tracking-widest text-sun-400">
      {`${'★'.repeat(count)}${'☆'.repeat(3 - count)}`}
    </span>
  );
}

/**
 * Peta Level (S3b): peta pabrik layar penuh dengan jalur, penanda level
 * (pedestal), dan robot pemandu yang berdiri di posisi tetap. Klik penanda =
 * memilih level; panel bawah menampilkan rinciannya dan tombol
 * Mulai/Lanjut/Ulangi mengikuti pilihan. Hanya level terbuka atau selesai
 * yang bisa dibuka (navigation.canGo).
 */
export function LevelMapScreen({
  navigation,
  moduleDef,
  context,
  progress,
  getLevelTitle,
  reduceMotion = false,
}: LevelMapScreenProps) {
  const view = buildLevelMap(moduleDef, context, progress, getLevelTitle);
  const layout = layoutFor(moduleDef.id);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    focusLevelId(view),
  );

  if (layout === null) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4 bg-navy-900 text-ink-100">
        <p>Peta {moduleDef.title} belum tersedia.</p>
        <button
          type="button"
          onClick={navigation.back}
          className={`rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold hover:bg-navy-700 ${FOCUS}`}
        >
          Kembali
        </button>
      </main>
    );
  }

  const selected =
    view.nodes.find((node) => node.levelId === selectedId) ?? null;
  const action =
    selected === null ? null : selectionAction(view, selected.levelId);
  const target: Screen | null =
    action === null ? null : { id: 'levelIntro', levelId: action.levelId };
  const canStart = target !== null && navigation.canGo(target);
  const segments = buildRoadSegments(moduleDef.levelIds, layout, (levelId) =>
    view.nodes.some(
      (node) => node.levelId === levelId && node.status === 'cleared',
    ),
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-navy-900">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={COVER_BOX}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - box.left) / box.width) * 100;
          const y = ((event.clientY - box.top) / box.height) * 100;
          console.log(`{ x: ${x.toFixed(1)}, y: ${y.toFixed(1)} }`);
        }}
      >
        <img
          src={layout.mapImage}
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
        <LevelRoad segments={segments} />

        <section aria-label="Peta level" className="absolute inset-0">
          {view.nodes.map((node) => {
            const position = layout.pads[node.levelId];
            if (position === undefined) return null;
            return (
              <LevelPedestal
                key={node.levelId}
                node={node}
                position={position}
                width={layout.padWidth}
                selected={node.levelId === selectedId}
                reduceMotion={reduceMotion}
                onSelect={() => setSelectedId(node.levelId)}
              />
            );
          })}
        </section>

        <img
          src={UI_ASSETS.robotGuide}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute z-12 h-auto -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-lg"
          style={{
            left: `${layout.robot.x}%`,
            top: `${layout.robot.y}%`,
            width: `${layout.robot.width}%`,
          }}
        />

        <MapFog layer="front" />
      </div>

      <header className="absolute inset-x-[2.5%] top-[3.5%] z-30 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={navigation.back}
          className={`rounded-lg border border-navy-500 bg-navy-800 px-4 py-2 font-semibold text-ink-100 hover:bg-navy-700 ${FOCUS}`}
        >
          Kembali
        </button>
        <h1 className="rounded-xl border-2 border-navy-500 bg-navy-900/90 px-6 py-2 text-lg font-black text-ink-100 shadow-lg">
          <span className="text-ember-500 uppercase">{moduleDef.title}</span>
          <span aria-hidden="true"> · </span>
          <span className="text-sun-400">{moduleDef.subtitle}</span>
        </h1>
        <p className="rounded-xl border-2 border-navy-500 bg-navy-900/90 px-4 py-2 font-bold text-ink-100 shadow-lg">
          <span aria-hidden="true" className="text-sun-400">
            ★{' '}
          </span>
          {view.starsEarned} / {view.starsMax}
        </p>
      </header>

      <section
        aria-live="polite"
        className="absolute inset-x-[2.5%] bottom-[4%] z-30 flex items-center justify-between gap-6 rounded-2xl border-2 border-sun-400 bg-navy-900/90 p-4 text-ink-100 shadow-xl backdrop-blur-sm"
      >
        <div className="min-w-0 space-y-1">
          {selected === null ? (
            <p className="font-semibold">{NONE_YET_MESSAGE}</p>
          ) : (
            <>
              <p className="text-xs font-bold tracking-wide text-ember-500 uppercase">
                Level {selected.levelId}
              </p>
              <h2 className="text-xl font-black text-sun-400">
                {selected.title ?? 'Belum tersedia'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                {selected.status === 'cleared' && (
                  <>
                    <Stars count={selected.stars} />
                    <span>Selesai</span>
                  </>
                )}
                {selected.status === 'open' && <span>Belum selesai</span>}
                {selected.status === 'locked' && (
                  <span className="text-ember-500">
                    <span aria-hidden="true">🔒 </span>
                    Terkunci{selected.note !== null ? `: ${selected.note}` : ''}
                  </span>
                )}
                {selected.status === 'comingSoon' && <span>Segera hadir</span>}
                {selected.isNext && (
                  <span className="rounded bg-ember-500 px-2 py-0.5 text-xs font-bold text-navy-900">
                    Berikutnya
                  </span>
                )}
              </div>
            </>
          )}
          {view.message !== null && (
            <p className="text-sm text-ink-300">{view.message}</p>
          )}
          <p className="text-xs text-ink-300">
            Level yang sudah selesai bisa diulang untuk mengejar bintang.
          </p>
        </div>
        <button
          type="button"
          disabled={!canStart}
          onClick={() => {
            if (target !== null) navigation.go(target);
          }}
          className={`shrink-0 rounded-full border-b-4 px-8 py-3 text-lg font-extrabold whitespace-nowrap shadow-lg transition-colors ${FOCUS} ${
            canStart
              ? 'border-amber-600 bg-sun-400 text-navy-900 hover:bg-sun-500'
              : 'cursor-not-allowed border-navy-700 bg-navy-800 text-ink-300 opacity-70'
          }`}
        >
          {action === null
            ? 'Belum bisa dimainkan'
            : `${action.verb} Level ${action.levelId}`}
        </button>
      </section>
    </main>
  );
}
