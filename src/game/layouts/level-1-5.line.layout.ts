import type { LineLayout } from './types';

/**
 * Lini lurus Level 1-5 (kanvas 1280x720), di dalam area aman dan di atas
 * DOCK_ZONE (y < 418). Tiga lajur (y 145, 225, 305) berbagi x: slot k di
 * 400 + 82k, checkpoint k tepat 41 px sesudahnya. Seluruh isi membentang
 * x 280..1090 (pusat sekitar 685), lebih dekat ke tengah kanvas.
 */
export const layout1_5Line: LineLayout = {
  kind: 'line',
  id: '1-5',
  tools: { mutexId: 'meja', semaphoreId: 'kartu', conditionId: 'lampu' },
  lanes: [
    { threadId: 'A', y: 145, label: { x: 280, y: 121, width: 90, height: 48 } },
    { threadId: 'W', y: 225, label: { x: 280, y: 201, width: 90, height: 48 } },
    { threadId: 'P', y: 305, label: { x: 280, y: 281, width: 90, height: 48 } },
  ],
  checkpointX: [441, 523, 605, 687, 769, 851, 933],
  slotX: [400, 482, 564, 646, 728, 810, 892, 974],
  hall: {
    id: 'aula',
    zone: { x: 720, y: 105, width: 270, height: 242 },
    gate: { start: 4, end: 6 },
  },
  board: { x: 530, y: 355, width: 240, height: 62 },
  boardLinks: [
    { checkpoint: 1, direction: 'read' },
    { checkpoint: 3, direction: 'write' },
  ],
  storage: { x: 1010, y: 105, width: 80, height: 242 },
  packer: {
    threadId: 'P',
    card: { x: 280, y: 355, width: 240, height: 62 },
    lamp: { x: 307, y: 386 },
    battery: { x: 410, y: 402 },
  },
  mutexPanel: { x: 780, y: 355, width: 140, height: 62 },
  areaPanel: { x: 930, y: 355, width: 160, height: 62 },
};
