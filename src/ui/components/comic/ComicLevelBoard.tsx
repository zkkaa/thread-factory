import {
  COMIC_EFFECTS,
  COMIC_SHADOW,
  TEXT_OUTLINE,
  type ComicTheme,
} from '../../comicAssets';
import { ComicImage } from './ComicImage';
import { ComicPanel } from './ComicPanel';

export interface ComicLevelItem {
  levelId: string;
  title: string | null;
  note: string | null;
  locked: boolean;
}

export interface ComicLevelGroup {
  key: string;
  heading: string;
  items: ComicLevelItem[];
}

interface ComicLevelBoardProps {
  theme: ComicTheme;
  hint: string;
  groups: ComicLevelGroup[];
  reduceMotion: boolean;
  onOpen: (levelId: string) => void;
}

// Latar tetap (tidak ikut scroll): gambar, peredup, garis kecepatan, halftone.
function ComicBackdrop({ background }: { background: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <ComicImage src={background} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-navy-900/45" />
      <ComicImage
        src={COMIC_EFFECTS.speedLines}
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#0b1f3a_1.5px,transparent_1.5px)] [background-size:10px_10px]" />
    </div>
  );
}

function VsBurst() {
  return (
    <span
      aria-hidden="true"
      className="relative grid h-20 w-20 -rotate-6 place-items-center"
    >
      <ComicImage
        src={COMIC_EFFECTS.burstVs}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <span
        className={`relative text-2xl font-black italic text-white ${TEXT_OUTLINE}`}
      >
        VS
      </span>
    </span>
  );
}

export function ComicLevelBoard({
  theme,
  hint,
  groups,
  reduceMotion,
  onOpen,
}: ComicLevelBoardProps) {
  return (
    <>
      <ComicBackdrop background={theme.background} />
      <div className="relative z-10 flex flex-1 gap-6">
        <aside className="flex w-56 shrink-0 flex-col justify-end gap-3 self-stretch">
          <p
            className={`relative rounded-3xl border-[3px] border-navy-900 bg-cream-50 px-4 py-3 text-sm font-bold leading-snug text-navy-900 ${COMIC_SHADOW.md}`}
          >
            {theme.bubble}
            <span
              aria-hidden="true"
              className="absolute -bottom-2.5 left-10 h-4 w-4 rotate-45 border-b-[3px] border-r-[3px] border-navy-900 bg-cream-50"
            />
          </p>
          <ComicImage
            src={theme.mandor}
            alt="Pak Mandor"
            className="-mb-6 max-h-[46vh] w-full object-contain object-bottom"
          />
        </aside>

        <div className="flex flex-1 flex-col gap-5">
          <div className="flex items-center gap-4">
            <h1
              className={`-skew-x-6 border-[3px] border-navy-900 px-6 py-1.5 ${theme.accent} ${COMIC_SHADOW.lg}`}
            >
              <span className="block skew-x-6 text-2xl font-black italic tracking-wide text-navy-900">
                {theme.title}
              </span>
            </h1>
            {theme.showVs && <VsBurst />}
          </div>

          <p
            className={`self-start rounded-lg border-2 border-navy-900 bg-cream-50 px-3 py-1.5 text-sm font-semibold text-navy-900 ${COMIC_SHADOW.sm}`}
          >
            {hint}
          </p>

          <section
            role="tabpanel"
            aria-label={`Mode ${theme.title}`}
            className="flex flex-col gap-6"
          >
            {groups.map((group) => (
              <section
                key={group.key}
                aria-label={group.heading}
                className="flex flex-col gap-4"
              >
                <h2
                  className={`self-start -skew-x-6 border-[3px] border-navy-900 bg-cream-50 px-4 py-0.5 ${COMIC_SHADOW.md}`}
                >
                  <span className="block skew-x-6 text-base font-black text-navy-900">
                    {group.heading}
                  </span>
                </h2>
                <div className="grid grid-cols-5 gap-5">
                  {group.items.map((item, index) => (
                    <ComicPanel
                      key={item.levelId}
                      levelId={item.levelId}
                      title={item.title}
                      note={item.note}
                      locked={item.locked}
                      accent={theme.accent}
                      index={index}
                      reduceMotion={reduceMotion}
                      onOpen={() => onOpen(item.levelId)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}