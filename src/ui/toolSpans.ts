import type { PlacedTool, ToolSpan } from '../engine/tools';

/**
 * Fungsi bantu Toolbox yang murni (tanpa React) supaya bisa dites di Vitest.
 *
 * Aturan tampilan: Toolbox menggambar program ASLI robot (sebelum LOCK/UNLOCK
 * disisipkan), jadi indeks ubin yang diklik pemain sama persis dengan indeks
 * `start`/`end` yang dipakai applyTools. Tidak perlu pemetaan indeks.
 *
 * Desain: satu alat per mutex, dengan id tetap `mutex:<id mutex>`; tiap robot
 * punya paling banyak satu rentang pada alat itu.
 */

export function mutexToolId(mutexId: string): string {
  return `mutex:${mutexId}`;
}

export function findSpan(
  tool: PlacedTool | null | undefined,
  threadId: string,
): ToolSpan | undefined {
  return tool?.spans.find((span) => span.thread === threadId);
}

export function isCovered(span: ToolSpan | undefined, index: number): boolean {
  return span !== undefined && index >= span.start && index <= span.end;
}

/**
 * Membangun alat mutex baru dari alat sebelumnya setelah rentang satu robot
 * diganti (`span`) atau dilepas (`span` = null). Mengembalikan null bila tidak
 * ada rentang tersisa (alat harus dilepas). Tidak mengubah masukan.
 */
export function buildMutexTool(
  previous: PlacedTool | null,
  mutexId: string,
  threadId: string,
  span: ToolSpan | null,
): PlacedTool | null {
  const others = (previous?.spans ?? [])
    .filter((s) => s.thread !== threadId)
    .map((s) => ({ ...s }));
  const spans = span === null ? others : [...others, { ...span }];
  if (spans.length === 0) return null;
  return { id: mutexToolId(mutexId), kind: 'mutex', mutex: mutexId, spans };
}

/** Bagian SimulationController yang dibutuhkan untuk mengganti alat. */
export interface ToolEditor {
  getState(): { readonly tools: readonly PlacedTool[] };
  placeTool(tool: PlacedTool): void;
  removeTool(id: string): void;
}

/**
 * Mengganti alat berid `id` dengan `next` (null = hanya melepas).
 * Bila gagal (mis. rentang tumpang tindih atau alat terkunci), alat lama
 * dipasang kembali supaya pemain tidak kehilangan pekerjaannya.
 * @returns pesan error untuk ditampilkan, atau null bila berhasil.
 */
export function replaceTool(
  editor: ToolEditor,
  id: string,
  next: PlacedTool | null,
): string | null {
  const previous = editor.getState().tools.find((tool) => tool.id === id) ?? null;
  try {
    if (previous !== null) editor.removeTool(id);
    if (next !== null) editor.placeTool(next);
    return null;
  } catch (e) {
    try {
      const stillThere = editor.getState().tools.some((tool) => tool.id === id);
      if (previous !== null && !stillThere) editor.placeTool(previous);
    } catch {
      // Pemulihan gagal (mis. alat terkunci): state controller tetap konsisten.
    }
    return e instanceof Error ? e.message : String(e);
  }
}
