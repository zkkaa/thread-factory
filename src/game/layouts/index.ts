import { layout1_1 } from './level-1-1.layout';
import { layout1_2 } from './level-1-2.layout';
import { hall1_3 } from './level-1-3.hall.layout';
import { layout1_4 } from './level-1-4.layout';
import { layout1_5 } from './level-1-5.combined.layout';
import { layout2_1 } from './level-2-1.layout';
import { layout2_2 } from './level-2-2.layout';
import { layout2_3 } from './level-2-3.layout';
import { layout2_4 } from './level-2-4.layout';
import type { ArenaLayout } from './types';

const LAYOUTS: Readonly<Record<string, ArenaLayout>> = {
  [layout1_1.id]: layout1_1,
  [layout1_2.id]: layout1_2,
  [hall1_3.id]: hall1_3,
  [layout1_4.id]: layout1_4,
  [layout1_5.id]: layout1_5,
  [layout2_1.id]: layout2_1,
  [layout2_2.id]: layout2_2,
  [layout2_3.id]: layout2_3,
  [layout2_4.id]: layout2_4,
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
  TableLayout,
  BoardLayout,
  TripleLayout,
} from './types';
