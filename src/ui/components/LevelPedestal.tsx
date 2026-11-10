import type { LevelNode } from '../levelMap';
import { describeNode } from '../levelMap';
import { FOCUS } from '../modeTabsData';
import type { MapPoint } from '../levelMapLayout';
import { UI_ASSETS } from '../uiAssets';
import { MapPin } from './MapPin';

interface LevelPedestalProps {
  node: LevelNode;
  position: MapPoint;
  /** Lebar pedestal, persen lebar kotak peta. */
  width: number;
  selected: boolean;
  reduceMotion: boolean;
  onSelect: () => void;
}

/**
 * Penanda satu level di peta. Gambar pedestal adalah PNG; nomor dan bintang
 * adalah teks, jadi status terbaca juga lewat bentuk (gembok, bintang, pin),
 * tidak hanya warna. Level berikutnya ditandai pedestalnya yang berdenyut
 * (gambar dan nomor), bukan cincin tambahan. Ukuran teks memakai satuan cqw
 * (induknya container query) supaya ikut skala kotak peta.
 */
export function LevelPedestal({
  node,
  position,
  width,
  selected,
  reduceMotion,
  onSelect,
}: LevelPedestalProps) {
  const locked = node.status === 'locked' || node.status === 'comingSoon';
  const cleared = node.status === 'cleared';
  const imageTone = [
    locked ? 'grayscale brightness-50' : '',
    selected ? 'scale-110' : '',
    !locked && (selected || cleared)
      ? 'drop-shadow-[0_0_14px_rgba(255,201,60,0.9)]'
      : 'drop-shadow-lg',
  ].join(' ');

  // Denyut hanya untuk level berikutnya, dan mati bila "kurangi animasi" aktif.
  const pulsing = node.isNext && !reduceMotion;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={describeNode(node)}
      onClick={onSelect}
      className={`group absolute -translate-x-1/2 translate-y-[-72%] rounded-full ${FOCUS} ${
        node.isNext || selected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${width}%`,
      }}
    >
      {/* Gambar dan nomor berdenyut bersama; pin dan bintang tetap diam. */}
      <span
        className={`relative block ${
          pulsing ? 'animate-pedestal-pulse motion-reduce:animate-none' : ''
        }`}
      >
        <img
          src={UI_ASSETS.pedestal}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`h-auto w-full select-none transition-all motion-reduce:transition-none ${imageTone}`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-black ${
            locked ? 'text-ink-300' : cleared ? 'text-sun-400' : 'text-white'
          }`}
          style={{ top: '38%', fontSize: '1.9cqw' }}
        >
          {node.levelId}
        </span>
      </span>
      {selected && (
        <MapPin className="absolute top-[-28%] left-1/2 z-10 h-[3cqw] w-[2.4cqw] -translate-x-1/2" />
      )}
      {(cleared || locked) && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 tracking-wider whitespace-nowrap text-sun-400"
          style={{ top: '72%', fontSize: '1.5cqw' }}
        >
          {cleared
            ? `${'★'.repeat(node.stars)}${'☆'.repeat(3 - node.stars)}`
            : '🔒'}
        </span>
      )}
    </button>
  );
}
