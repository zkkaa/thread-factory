import {
  COMIC_EFFECTS,
  COMIC_SHADOW,
  levelThumbUrl,
  panelTilt,
} from '../../comicAssets';
import { FOCUS } from '../../modeTabsData';
import { ComicImage } from './ComicImage';

interface ComicPanelProps {
  levelId: string;
  title: string | null;
  note: string | null;
  locked: boolean;
  accent: string;
  index: number;
  reduceMotion: boolean;
  onOpen: () => void;
}

export function ComicPanel({
  levelId,
  title,
  note,
  locked,
  accent,
  index,
  reduceMotion,
  onOpen,
}: ComicPanelProps) {
  const name = title ?? `Level ${levelId}`;
  const heading =
    title !== null ? `Level ${levelId}: ${title}` : `Level ${levelId}`;
  const label = locked ? `${heading}, terkunci` : `${heading}, buka`;
  const status = locked ? (note ?? 'Belum tersedia') : 'Buka';
  // Syarat pembukaan dibaca lewat aria-describedby, bukan disalin ke aria-label.
  const statusId = `comic-status-${levelId}`;
  const motion = reduceMotion
    ? ''
    : 'transition-transform motion-safe:enabled:hover:-translate-y-1.5';
  const cursor = locked ? 'cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onOpen}
      aria-label={label}
      aria-describedby={statusId}
      className={`relative block w-full text-left ${panelTilt(index)} ${motion} ${cursor} ${FOCUS}`}
    >
      <span
        aria-hidden="true"
        className={`absolute -left-3 -top-3 z-20 grid h-12 w-12 place-items-center ${locked ? 'grayscale' : ''}`}
      >
        <span className="absolute inset-1 rounded-full bg-sun-400" />
        <ComicImage
          src={COMIC_EFFECTS.badge}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <span className="relative text-[13px] font-black text-navy-900">
          {levelId}
        </span>
      </span>

      <span
        className={`block rounded-md border-[3px] border-navy-900 bg-cream-50 p-1.5 ${COMIC_SHADOW.lg}`}
      >
        <span className="relative block aspect-[4/3] overflow-hidden rounded border-2 border-navy-900 bg-linear-to-br from-navy-500 to-navy-800">
          <ComicImage
            src={levelThumbUrl(levelId)}
            className={`h-full w-full object-cover ${locked ? 'brightness-50 grayscale' : ''}`}
          />
          {locked && (
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-10 flex h-9 w-[135%] -translate-x-1/2 -translate-y-1/2 -rotate-12 items-center justify-center border-y-[3px] border-navy-900 bg-ink-300"
            >
              <ComicImage
                src={COMIC_EFFECTS.tape}
                className="absolute inset-0 h-full w-full object-fill"
              />
              <span className="relative text-sm font-black tracking-[0.2em] text-navy-900">
                TERKUNCI
              </span>
            </span>
          )}
        </span>

        <span className="mt-1.5 flex flex-col gap-1">
          <span className="line-clamp-2 min-h-8 text-[13px] font-extrabold leading-tight text-navy-900">
            {name}
          </span>
          <span
            id={statusId}
            className={`self-start rounded-lg border-2 border-navy-900 px-2 py-0.5 text-[11px] font-extrabold leading-tight text-navy-900 ${locked ? 'bg-ink-300' : accent}`}
          >
            {locked && <span aria-hidden="true">🔒 </span>}
            {status}
          </span>
        </span>
      </span>
    </button>
  );
}