/**
 * Nama dan muatan event seret-lepas alat antara React (toolbox) dan Phaser
 * (LevelScene), lewat EventBus. Satu tempat supaya nama event tidak diketik
 * ulang di dua sisi. Koordinat berupa koordinat halaman (clientX/clientY).
 */
export const TOOL_EVENTS = {
  dragStart: 'tool-drag-start',
  dragMove: 'tool-drag-move',
  drop: 'tool-drop',
  dragEnd: 'tool-drag-end',
  cancel: 'tool-cancel',
  /** Dari scene ke React: fase pemasangan berubah (untuk label toolbox). */
  phase: 'door-phase',
} as const;

export interface ToolDragStartPayload {
  kind: 'mutex';
}

export interface ToolPointerPayload {
  pageX: number;
  pageY: number;
}
