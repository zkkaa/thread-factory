import { layout1_1 } from './level-1-1.layout';
import type { LoopLayout } from './types';

/**
 * Layout sementara Level 1-3 sebelum layout khusus HallLayout diimplementasikan di T-089.
 * Menggunakan jalan loop dengan 8 lane offsets untuk 8 robot.
 */
export const layout1_3: LoopLayout = {
  ...layout1_1,
  id: '1-3',
  laneOffsets: [-28, -20, -12, -4, 4, 12, 20, 28],
};
