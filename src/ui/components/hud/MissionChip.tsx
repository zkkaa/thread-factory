import type { LevelDefinition } from '../../../levels/types';
import { deriveMission } from '../../missionSummary';

interface MissionChipProps {
  level: LevelDefinition;
}

/**
 * Chip Misi (PRD 17.2): target dan kriteria bintang level, dapat dilipat.
 * Memakai <details> bawaan HTML: tombol lipat/buka dapat dioperasikan dengan
 * keyboard dan tidak butuh state React. Awalnya terbuka supaya pemain baru
 * langsung melihat misinya.
 */
export function MissionChip({ level }: MissionChipProps) {
  const mission = deriveMission(level);

  return (
    <details
      open
      aria-label="Misi level"
      className="group rounded-xl border border-navy-500 bg-navy-900/90 p-3 shadow-lg"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
        <span>
          Misi: <span className="text-sun-400">{mission.targetText}</span>
        </span>
        <span className="text-xs font-normal text-ink-300 group-open:hidden">
          Buka
        </span>
        <span className="hidden text-xs font-normal text-ink-300 group-open:inline">
          Lipat
        </span>
      </summary>

      <ul className="mt-2 space-y-1.5 text-sm">
        {mission.stars.map((item) => (
          <li key={item.stars}>
            <strong className="text-sun-400">Bintang {item.stars}:</strong>{' '}
            {item.text}
          </li>
        ))}
      </ul>

      {mission.seedNote !== null && (
        <p className="mt-2 text-xs text-ink-300">{mission.seedNote}</p>
      )}
    </details>
  );
}
