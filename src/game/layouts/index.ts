import { layout1_1 } from './level-1-1.layout';
import type { ArenaLayout } from './types';

const LAYOUTS: Readonly<Record<string, ArenaLayout>> = {
  [layout1_1.id]: layout1_1,
};

export function getLayout(id: string): ArenaLayout | undefined {
  return LAYOUTS[id];
}

export type { ArenaLayout, LoopLayout, Point } from './types';
