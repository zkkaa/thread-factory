import { APP_VERSION } from '../../../version';
import {
  ASSET_CREDITS,
  GENERATOR_NOTE,
  ICON_NOTE,
  TEAM_MEMBERS,
} from '../../credits';

/** Warna pastel kartu kredit; dipakai bergilir menurut urutan. */
const CARD_TINTS = ['bg-[#fff1b8]', 'bg-[#e3d6f5]', 'bg-[#d3e6b0]'] as const;

/** Isi tab Kredit: kartu aset, catatan, dan label nama tim. */
export function CreditsPanel() {
  return (
    <section className="flex flex-col gap-4 pt-1" aria-label="Kredit">
      <h2 className="text-2xl font-black">Kredit</h2>

      <ul className="grid grid-cols-2 gap-3">
        {ASSET_CREDITS.map((credit, index) => (
          <li
            key={credit.name}
            className={`flex flex-col gap-1 rounded-lg border-[3px] border-navy-900 px-3 py-2 shadow-[3px_3px_0_#0b1f3a] ${
              CARD_TINTS[index % CARD_TINTS.length]
            }`}
          >
            <span className="text-sm font-black leading-tight">
              {credit.name}
            </span>
            <span className="text-xs leading-tight text-navy-700">
              {credit.source}
            </span>
            <span className="mt-auto self-start rounded-full border-2 border-navy-900 bg-sun-400 px-2 text-xs font-black">
              {credit.license}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 rounded-lg border-[3px] border-dashed border-navy-900/60 bg-[#fff6d6] px-3 py-2 text-sm">
        <p>{ICON_NOTE}</p>
        <p>{GENERATOR_NOTE}</p>
      </div>

      <div>
        <h3 className="text-lg font-black">Tim</h3>
        <ul className="mt-1 flex flex-wrap gap-2">
          {TEAM_MEMBERS.map((member) => (
            <li
              key={member}
              className="rounded-md border-[3px] border-navy-900 bg-[#d3e6b0] px-3 py-0.5 text-sm font-black shadow-[2px_2px_0_#0b1f3a]"
            >
              {member}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-navy-700">
        Thread Factory: Pabrik Rebutan v{APP_VERSION}
      </p>
    </section>
  );
}
