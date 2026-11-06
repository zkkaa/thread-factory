import { layout1_1 } from './level-1-1.layout';
import { layout1_2 } from './level-1-2.layout';
import { hall1_3 } from './level-1-3.hall.layout';
import { layout1_4 } from './level-1-4.layout';
import { layout1_5 } from './level-1-5.combined.layout';
import type { ArenaLayout } from './types';

const LAYOUTS: Readonly<Record<string, ArenaLayout>> = {
  [layout1_1.id]: layout1_1,
  [layout1_2.id]: layout1_2,
  [hall1_3.id]: hall1_3,
  [layout1_4.id]: layout1_4,
  [layout1_5.id]: layout1_5,
};

export function getLayout(id: string): ArenaLayout | undefined {
  return LAYOUTS[id];
}

export type {
  ArenaLayout,
  CombinedLayout,
  HallLayout,
  LoopLayout,
  Point,
  Rect,
  DeskLayout,
  TrackLayout,
} from './types';
