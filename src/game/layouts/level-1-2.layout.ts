import { layout1_1 } from './level-1-1.layout';
import type { LoopLayout } from './types';

/**
 * Level 1-2 memakai ulang loop Level 1-1. Indikator Core 1 dan Core 2 serta
 * meter utilisasi ditambahkan di T-086 (bukan bagian dari layout ini).
 */
export const layout1_2: LoopLayout = { ...layout1_1, id: '1-2' };
