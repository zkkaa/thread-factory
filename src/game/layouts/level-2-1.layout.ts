import type { BeltLayout } from './types';

/**
 * Arena Level 2-1. Semua di dalam HUD_SAFE (x 350..1260, y 80..580):
 * zona perakit di kiri, ban di tengah (3 slot), zona pengepak di kanan.
 */
export const layout2_1: BeltLayout = {
  kind: 'belt',
  id: '2-1',
  bufferId: 'ban',
  belt: { x: 560, y: 270, width: 480, height: 140 },
  producerZone: { x: 360, y: 120, width: 180, height: 420 },
  consumerZone: { x: 1060, y: 120, width: 190, height: 420 },
  producerIds: ['P1', 'P2'],
  producerSpots: [
    { x: 450, y: 230 },
    { x: 450, y: 400 },
  ],
  consumerIds: ['C1', 'C2'],
  consumerSpots: [
    { x: 1155, y: 230 },
    { x: 1155, y: 400 },
  ],
};
