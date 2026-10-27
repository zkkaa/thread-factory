import {
  ArrowIcon,
  BackIcon,
  GearIcon,
  HelpIcon,
  LockIcon,
  MenuIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon,
  StarIcon,
  StepIcon,
  TrashIcon,
} from './glyphs';

/** Seluruh ikon berdasarkan nama; dipakai tes dan, bila perlu, pemanggil dinamis. */
export const ICONS = {
  play: PlayIcon,
  pause: PauseIcon,
  step: StepIcon,
  reset: ResetIcon,
  gear: GearIcon,
  lock: LockIcon,
  trash: TrashIcon,
  help: HelpIcon,
  menu: MenuIcon,
  back: BackIcon,
  star: StarIcon,
  arrow: ArrowIcon,
} as const;

export type IconName = keyof typeof ICONS;
