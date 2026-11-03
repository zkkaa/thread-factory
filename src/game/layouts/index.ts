import { layout1_1 } from './level-1-1.layout';
import { layout1_2 } from './level-1-2.layout';
import { layout1_3 } from './level-1-3.layout';
import type { ArenaLayout } from './types';

const LAYOUTS: Readonly<Record<string, ArenaLayout>> = {
  [layout1_1.id]: layout1_1,
  [layout1_2.id]: layout1_2,
  [layout1_3.id]: layout1_3,
};

export function getLayout(id: string): ArenaLayout | undefined {
  return LAYOUTS[id];
}

export type { ArenaLayout, HallLayout, LoopLayout, Point, Rect } from './types';
