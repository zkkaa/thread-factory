import type { RoadSegment } from '../levelMapPath';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../levelMapPath';

interface LevelRoadProps {
  segments: readonly RoadSegment[];
}

/**
 * Jalur antar level, digambar di atas jalan pada peta. Ruas yang sudah
 * selesai berupa garis kuning tebal; ruas lain garis putus-putus tipis,
 * jadi bedanya terbaca dari bentuk, bukan hanya warna. Dekoratif.
 */
export function LevelRoad({ segments }: LevelRoadProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-8 h-full w-full"
    >
      {segments.map((segment) =>
        segment.filled ? (
          <g key={`${segment.fromId}-${segment.toId}`}>
            <path
              d={segment.d}
              fill="none"
              strokeWidth={30}
              strokeLinecap="round"
              className="stroke-navy-900/80"
            />
            <path
              d={segment.d}
              fill="none"
              strokeWidth={18}
              strokeLinecap="round"
              className="stroke-sun-400"
            />
          </g>
        ) : (
          <path
            key={`${segment.fromId}-${segment.toId}`}
            d={segment.d}
            fill="none"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray="18 16"
            className="stroke-white/70"
          />
        ),
      )}
    </svg>
  );
}