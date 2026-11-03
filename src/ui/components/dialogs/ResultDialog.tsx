import { useEffect, useState } from 'react';
import type { LevelResult } from '../../../controller/evaluateLevel';
import type {
  ControllerState,
  SimulationController,
} from '../../../controller/SimulationController';
import { deriveResultView, type ResultView } from '../../resultView';
import { confettiPieces, resultEffects } from '../../resultEffects';
import {
  RESULT_ASSETS,
  ribbonSrc,
  type ResultAssetSources,
} from '../../resultAssets';
import { MandorPortrait } from '../MandorPortrait';
import { starClass } from '../../motion';
import { useSound } from '../../audio/soundContext';

interface ResultDialogProps {
  controller: SimulationController;
  state: ControllerState;
  reduceMotion?: boolean;
  /** Tampilkan tombol Petunjuk (setelah 2 kegagalan). */
  offerHint?: boolean;
  onHint?: () => void;
  /** Pindah ke level berikutnya (atau Tamat Modul). */
  onNext?: () => void;
  /** Daftar gambar; bawaannya data aktual (diganti hanya oleh tes). */
  assets?: ResultAssetSources;
}

interface Action {
  label: string;
  icon?: string;
  onClick: () => void;
}

interface ResultCardProps {
  view: ResultView;
  reduceMotion: boolean;
  actions: Action[];
  assets: ResultAssetSources;
  onClose: () => void;
}

const CONFETTI = confettiPieces();

/* Bintang tengah lebih tinggi, bintang tepi miring: susunan melengkung. */
const STAR_ARC = [
  '-rotate-12 translate-y-2',
  '-translate-y-2 scale-110',
  'rotate-12 translate-y-2',
];

const SPARKLES = [
  { pos: '-left-6 top-0', delay: '0s' },
  { pos: 'left-1/2 -top-5', delay: '0.4s' },
  { pos: '-right-6 top-0', delay: '0.2s' },
  { pos: 'left-10 -bottom-3', delay: '0.6s' },
];

const STAR_POINTS =
  '12,1.5 15,8.6 22.5,9.2 16.8,14.1 18.6,21.5 12,17.6 5.4,21.5 7.2,14.1 1.5,9.2 9,8.6';

/*
 * Penyetelan teks melengkung di pita bergambar. Satuan: koordinat viewBox
 * 100 x 33,3 (pita 3:1). Bila posisi kurang pas, ubah angka di sini saja.
 *  - TEXT_X1/X2: ujung kiri dan kanan jalur teks.
 *  - TEXT_Y: garis dasar baris pertama di tengah pita.
 *  - LINE_GAP: jarak antar-baris.
 *  - SAG: seberapa turun ujung jalur dibanding tengahnya (lengkung pita).
 *  - CHAR_W: perkiraan lebar rata-rata huruf dibanding ukuran huruf.
 */
const TEXT_X1 = 18;
const TEXT_X2 = 82;
const TEXT_Y = 11;
const LINE_GAP = 5.4;
const SAG = 2;
const CHAR_W = 0.66;
const MAX_FONT = 5.2;

function Confetti() {
  return (
    <div
      aria-hidden="true"
      data-effect="confetti"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {CONFETTI.map((piece) => (
        <span
          key={piece.id}
          className="absolute -top-4 block rounded-[1px]"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 1.6,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s 1 both`,
          }}
        />
      ))}
    </div>
  );
}

/** Garis aksen kuning ala komik (hiasan). */
function Burst({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={`pointer-events-none absolute h-10 w-10 ${className}`}
      fill="none"
      stroke="#ffc93c"
      strokeWidth="4"
      strokeLinecap="round"
    >
      <path d="M4 20h10M8 6l9 8M8 34l9-8" />
    </svg>
  );
}

/** Ikon di pita judul; bentuknya (X atau centang), bukan hanya warna, yang membedakan. */
function RibbonIcon({
  ok,
  className = 'h-6 w-6',
}: {
  ok: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 text-white ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ok ? <path d="M5 12.5l4.5 4.5L19 7" /> : <path d="M6 6l12 12M18 6L6 18" />}
    </svg>
  );
}

/** Bintang timbul: gambar bila ada, bila tidak SVG (emas bila penuh, abu-abu bila kosong). */
function StarIcon({ filled, src }: { filled: boolean; src: string | null }) {
  if (src !== null) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-14 w-14 object-contain"
      />
    );
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-14 w-14"
      strokeLinejoin="round"
    >
      <polygon
        points={STAR_POINTS}
        fill={filled ? '#ffc93c' : '#8d9bb0'}
        stroke={filled ? '#b86a00' : '#4a5a73'}
        strokeWidth="1.6"
      />
      <polygon
        points={STAR_POINTS}
        fill={filled ? '#ffe27a' : '#b4c0d1'}
        transform="translate(12 12) scale(0.58) translate(-12 -12)"
      />
    </svg>
  );
}

/** Judul panjang dibagi dua baris di spasi terdekat dari tengah. */
function splitTitle(title: string): string[] {
  const text = title.toUpperCase();
  if (text.length <= 20) return [text];
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ' && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) {
      best = i;
    }
  }
  if (best === -1) return [text];
  return [text.slice(0, best), text.slice(best + 1)];
}

/** Jalur lengkung (busur) untuk baris ke-`line`; tengah lebih tinggi dari ujung. */
function curvePath(baseline: number): string {
  const mid = (TEXT_X1 + TEXT_X2) / 2;
  return `M ${TEXT_X1} ${baseline + SAG} Q ${mid} ${baseline - SAG} ${TEXT_X2} ${baseline + SAG}`;
}

interface CurvedTitleProps {
  ok: boolean;
  title: string;
}

/** Judul melengkung mengikuti pita bergambar (SVG textPath). */
function CurvedTitle({ ok, title }: CurvedTitleProps) {
  const lines = splitTitle(title);
  const longest = Math.max(...lines.map((line) => line.length));
  const width = TEXT_X2 - TEXT_X1;
  const fontSize = Math.min(MAX_FONT, width / (longest * CHAR_W));
  // Satu baris di tengah; dua baris diapit di sekitar tengah.
  const first = lines.length === 1 ? TEXT_Y + 2 : TEXT_Y;
  const outline = ok ? '#8a5a00' : '#5b0710';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 33.33"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        {lines.map((_, i) => (
          <path
            key={i}
            id={`ribbon-curve-${i}`}
            d={curvePath(first + i * LINE_GAP)}
          />
        ))}
      </defs>
      {lines.map((line, i) => (
        <text
          key={line}
          fontSize={fontSize}
          fontWeight={900}
          fontStyle="italic"
          fill="#ffffff"
          stroke={outline}
          strokeWidth={fontSize * 0.28}
          strokeLinejoin="round"
          paintOrder="stroke"
          textAnchor="middle"
        >
          <textPath href={`#ribbon-curve-${i}`} startOffset="50%">
            {line}
          </textPath>
        </text>
      ))}
    </svg>
  );
}

/** Ukuran huruf judul datar (pita SVG cadangan) menurut panjangnya. */
function titleSize(title: string): string {
  if (title.length <= 20) return 'text-lg';
  if (title.length <= 30) return 'text-base';
  return 'text-sm';
}

interface RibbonProps {
  ok: boolean;
  shake: boolean;
  title: string;
  /** Gambar pita; null = pita SVG bawaan. */
  src: string | null;
}

/** Pita judul bergaya komik. Bergambar: teks melengkung; cadangan: teks datar. */
function Ribbon({ ok, shake, title, src }: RibbonProps) {
  const band = ok ? '#ffc93c' : '#d4141f';
  const tail = ok ? '#c98400' : '#8e0b14';
  const stroke = ok
    ? '[-webkit-text-stroke:4px_#8a5a00]'
    : '[-webkit-text-stroke:4px_#5b0710]';
  const flatClass = `${titleSize(title)} text-center font-black italic uppercase leading-tight tracking-wide text-white [paint-order:stroke_fill] ${stroke}`;
  const motion = shake
    ? 'animate-[ribbon-shake_0.5s_ease-in-out_1] motion-reduce:animate-none'
    : '';

  if (src !== null) {
    return (
      <div
        data-effect={shake ? 'shake' : undefined}
        className={`relative z-10 ${motion}`}
      >
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="block h-auto w-full select-none"
        />
        <CurvedTitle ok={ok} title={title} />
        <h2 id="result-title" className="sr-only">
          {title}
        </h2>
        <span className="sr-only">{ok ? 'Hasil: BENAR' : 'Hasil: SALAH'}</span>
      </div>
    );
  }

  return (
    <div
      data-effect={shake ? 'shake' : undefined}
      className={`relative z-10 h-16 ${motion}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 400 70"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        <polygon
          points="0,14 60,14 60,68 0,68 20,41"
          fill={tail}
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          points="400,14 340,14 340,68 400,68 380,41"
          fill={tail}
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          points="22,2 378,2 378,58 22,58"
          fill={band}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-x-[8%] top-0 bottom-3 flex items-center justify-center gap-2">
        <RibbonIcon ok={ok} />
        <h2 id="result-title" className={flatClass}>
          {title}
        </h2>
        <span className="sr-only">{ok ? 'Hasil: BENAR' : 'Hasil: SALAH'}</span>
      </div>
    </div>
  );
}

function ResultCard({
  view,
  reduceMotion,
  actions,
  assets,
  onClose,
}: ResultCardProps) {
  const total = view.stars ?? 0;
  const [count, setCount] = useState(0);
  // Sesuai referensi: penjelasan tertutup di kalah maupun menang.
  const [explainOpen, setExplainOpen] = useState(false);
  const player = useSound();
  const fx = resultEffects(view.ok, reduceMotion);
  // Bintang muncul satu per satu; "kurangi animasi" langsung menampilkan semua.
  const shown = reduceMotion ? total : Math.min(count, total);
  const fig = view.keyFigure;

  useEffect(() => {
    if (reduceMotion || count >= total) return;
    const id = window.setTimeout(() => setCount((c) => c + 1), 450);
    return () => window.clearTimeout(id);
  }, [reduceMotion, count, total]);

  // Satu bunyi tiap bintang yang muncul (dengan "kurangi animasi" semuanya muncul sekaligus).
  useEffect(() => {
    if (shown > 0) player.playSfx('star');
  }, [shown, player]);

  // Esc menutup penjelasan lebih dulu, baru popup.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      if (explainOpen) setExplainOpen(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, explainOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {fx.vignette && (
        <div
          aria-hidden="true"
          data-effect="vignette"
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_160px_rgba(220,38,38,0.35)]"
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="relative z-10 w-full max-w-md p-2"
      >
        {/* Baris atas: Pak Mandor di kiri, gelembung krem berisi kalimat inti. */}
        <div className="relative flex items-end gap-1 px-1">
          <Burst className="left-0 top-4 -rotate-12" />
          <MandorPortrait
            bare
            mood={view.ok ? 'senang' : 'sedih'}
            className="relative h-40 min-w-28 shrink-0"
          />
          <div className="relative mb-9 flex-1 rounded-3xl border-[3px] border-navy-900 bg-cream-50 px-4 py-3 text-navy-900 shadow-2xl">
            <div
              aria-hidden="true"
              className="absolute -left-3 bottom-6 h-5 w-5 rotate-45 border-b-[3px] border-l-[3px] border-navy-900 bg-cream-50"
            />
            <p className="text-xl font-extrabold leading-snug">{view.quote}</p>
          </div>
        </div>

        {/* Pita menumpuk sedikit di bawah Pak Mandor. */}
        <div className="relative -mt-5">
          <Burst className="-right-2 -top-3 -scale-x-100 rotate-12" />
          <Ribbon
            ok={view.ok}
            shake={fx.shake}
            title={view.title}
            src={ribbonSrc(view.ok, assets)}
          />
        </div>

        <div className="relative -mt-4 mx-3 min-h-72 rounded-b-2xl border-2 border-navy-500 bg-navy-900 px-4 pb-4 pt-6 text-ink-100 shadow-xl">
          {/* Isi kartu; tidak bisa difokus saat penjelasan menutupinya. */}
          <div
            className="space-y-3"
            inert={explainOpen}
            aria-hidden={explainOpen}
          >
            {view.stars !== null ? (
              <div
                role="img"
                aria-label={`${total} dari 3 bintang`}
                className="relative flex items-center justify-center gap-2 py-1"
              >
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`inline-block ${STAR_ARC[index]}`}
                  >
                    <span
                      aria-hidden="true"
                      className={starClass(index, shown, reduceMotion)}
                    >
                      <StarIcon
                        filled={index < shown}
                        src={index < shown ? assets.starFull : assets.starEmpty}
                      />
                    </span>
                  </span>
                ))}
                {fx.sparkles &&
                  shown > 0 &&
                  SPARKLES.map((s) => (
                    <span
                      key={s.pos}
                      aria-hidden="true"
                      className={`pointer-events-none absolute text-xl text-sun-400 ${s.pos} animate-[sparkle_1.2s_ease-in-out_3] motion-reduce:animate-none`}
                      style={{ animationDelay: s.delay }}
                    >
                      ✦
                    </span>
                  ))}
              </div>
            ) : (
              view.seedNote !== null && (
                <p className="text-sm text-ink-300">{view.seedNote}</p>
              )
            )}

            {/* Angka kunci: simbol = atau ≠ dan teks, bukan hanya warna. */}
            <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-navy-500 bg-navy-800 px-4 py-2">
              <span className="text-lg font-semibold text-ink-300">
                {`${fig.label}:`}
              </span>
              <span
                className={`text-4xl font-extrabold ${
                  fig.match ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {`${fig.actual} ${fig.match ? '=' : '≠'} ${fig.target}`}
              </span>
              <span className="sr-only">
                {fig.match ? '(sesuai target)' : '(tidak sesuai target)'}
              </span>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                aria-expanded={explainOpen}
                aria-controls="result-explanation"
                onClick={() => setExplainOpen(true)}
                className="flex items-center gap-2 rounded-full bg-navy-500 px-4 py-1 text-sm font-semibold text-white hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400"
              >
                <span
                  aria-hidden="true"
                  className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-extrabold text-navy-800"
                >
                  ?
                </span>
                <span>Kenapa begini?</span>
                <span aria-hidden="true">▾</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {actions.map((action, i) => (
                <button
                  key={action.label}
                  type="button"
                  autoFocus={i === 0}
                  onClick={action.onClick}
                  className={
                    i === 0
                      ? 'flex items-center gap-1.5 rounded-xl border-b-4 border-sun-500 bg-sun-400 px-3 py-1.5 text-[13px] font-extrabold text-navy-900 hover:bg-sun-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
                      : 'flex items-center gap-1.5 rounded-xl border-2 border-navy-500 px-3 py-1.5 text-[13px] font-semibold hover:bg-navy-700'
                  }
                >
                  {action.icon !== undefined && (
                    <span aria-hidden="true">{action.icon}</span>
                  )}
                  <span>{action.label}</span>
                </button>
              ))}
              <button
                type="button"
                autoFocus={actions.length === 0}
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-xl border-2 border-navy-500 bg-navy-700 px-3 py-1.5 text-[13px] font-semibold hover:bg-navy-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400"
              >
                <span aria-hidden="true">✕</span>
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {/* Penjelasan menutupi isi kartu di tempat, sehingga tinggi popup tetap. */}
          {explainOpen && (
            <div
              id="result-explanation"
              className="absolute inset-0 z-10 flex flex-col gap-2 overflow-y-auto rounded-b-2xl bg-navy-900 p-4"
            >
              <p className="text-[13px] leading-snug text-ink-300">
                {view.message}
              </p>
              {view.stars !== null && (
                <ul className="space-y-0.5 text-xs">
                  {view.criteria.map((c) => (
                    <li
                      key={c.label}
                      className={c.met ? 'text-emerald-300' : 'text-ink-300'}
                    >
                      <span aria-hidden="true">{c.met ? '✓' : '✕'}</span>{' '}
                      {c.label}
                      <span className="sr-only">
                        {c.met ? ' (terpenuhi)' : ' (tidak terpenuhi)'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {view.coreUtilization !== null && (
                <div className="flex items-center justify-between rounded-lg bg-navy-800 px-3 py-1.5 text-xs">
                  <span className="text-ink-300">Utilisasi core:</span>
                  <span className="font-bold text-sun-400">
                    {view.coreUtilization}
                  </span>
                </div>
              )}
              {view.explanation !== null && (
                <p className="rounded-lg bg-navy-800 p-2.5 text-[13px] leading-snug">
                  {view.explanation}
                </p>
              )}
              <div className="mt-auto flex justify-center">
                <button
                  type="button"
                  autoFocus
                  aria-expanded={true}
                  aria-controls="result-explanation"
                  onClick={() => setExplainOpen(false)}
                  className="flex items-center gap-2 rounded-full bg-navy-500 px-4 py-1 text-sm font-semibold text-white hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-400"
                >
                  <span aria-hidden="true">◂</span>
                  <span>Kembali</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {fx.confetti && <Confetti />}
    </div>
  );
}

/**
 * Popup hasil (S6), gaya komik seperti MandorDialog. Semua angka dan
 * penilaian berasal dari state.result; komponen ini hanya menampilkan
 * (lihat resultView.ts, resultEffects.ts, dan resultAssets.ts).
 */
export function ResultDialog({
  controller,
  state,
  reduceMotion = false,
  offerHint = false,
  onHint,
  onNext,
  assets = RESULT_ASSETS,
}: ResultDialogProps) {
  const [dismissed, setDismissed] = useState<LevelResult | null>(null);
  const { level, snapshot, result } = state;
  if (
    result === null ||
    result === dismissed ||
    level === null ||
    snapshot === null
  ) {
    return null;
  }

  const view = deriveResultView(level, snapshot, result);
  const close = (): void => setDismissed(result);
  const resetAnd = (): void => {
    close();
    controller.reset();
  };

  const actions: Action[] = [];
  if (!view.ok) {
    actions.push({ label: 'Reset Simulasi', icon: '↻', onClick: resetAnd });
    if (offerHint && onHint !== undefined) {
      actions.push({ label: 'Petunjuk', icon: '?', onClick: onHint });
    }
  } else {
    if (onNext !== undefined) {
      actions.push({
        label: 'Lanjut ke Level Berikutnya',
        icon: '→',
        onClick: () => {
          close();
          onNext();
        },
      });
    }
    if (view.stars !== null && view.stars < 3) {
      actions.push({
        label: 'Ulangi untuk Bintang',
        icon: '↻',
        onClick: resetAnd,
      });
    }
  }

  return (
    <ResultCard
      view={view}
      reduceMotion={reduceMotion}
      actions={actions}
      assets={assets}
      onClose={close}
    />
  );
}