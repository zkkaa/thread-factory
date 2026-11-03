import type { Instruction, ThreadDef, ThreadId } from './types';

export interface ToolSpan {
  thread: ThreadId;
  start: number;
  end: number;
}

export interface PlacedMutexTool {
  id: string;
  kind: 'mutex';
  mutex: string;
  spans: ToolSpan[];
}

export interface PlacedSemaphoreTool {
  id: string;
  kind: 'semaphore';
  sem: string;
  value: number; // 1 sampai 8
  spans: ToolSpan[];
}

export type PlacedTool = PlacedMutexTool | PlacedSemaphoreTool;

interface OrderedSpan {
  resource: string;
  kind: 'mutex' | 'semaphore';
  start: number;
  end: number;
  order: number;
}

/** Asal satu instruksi pada program efektif (ARCHITECTURE 4.6). */
export type InstructionOrigin =
  | { kind: 'original'; index: number }
  | {
      kind: 'inserted';
      op: 'LOCK' | 'UNLOCK' | 'SEM_WAIT' | 'SEM_SIGNAL';
      slot: number;
    };

const overlaps = (a: OrderedSpan, b: OrderedSpan): boolean =>
  a.start <= b.end && b.start <= a.end;

const contains = (outer: OrderedSpan, inner: OrderedSpan): boolean =>
  outer.start <= inner.start && inner.end <= outer.end;

function validateSpan(
  tool: PlacedTool,
  span: ToolSpan,
  thread: ThreadDef,
): void {
  const where = `Alat "${tool.id}" pada ${thread.label}`;
  if (!Number.isInteger(span.start) || !Number.isInteger(span.end)) {
    throw new Error(`${where}: start dan end harus bilangan bulat.`);
  }
  if (span.start > span.end) {
    throw new Error(
      `${where}: start (${span.start}) lebih besar dari end (${span.end}).`,
    );
  }
  if (span.start < 0 || span.end >= thread.program.length) {
    throw new Error(
      `${where}: rentang ${span.start}..${span.end} di luar program (panjang ${thread.program.length}).`,
    );
  }
}

function validatePairs(spans: OrderedSpan[], thread: ThreadDef): void {
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      const a = spans[i];
      const b = spans[j];
      if (!overlaps(a, b)) continue;
      if (a.resource === b.resource) {
        const jenis = a.kind === 'mutex' ? 'mutex' : 'semaphore';
        throw new Error(
          `${thread.label}: dua rentang untuk ${jenis} "${a.resource}" saling tumpang tindih.`,
        );
      }
      if (!contains(a, b) && !contains(b, a)) {
        throw new Error(
          `${thread.label}: rentang "${a.resource}" dan "${b.resource}" saling silang; harus bersarang.`,
        );
      }
    }
  }
}

function buildProgram(
  program: Instruction[],
  spans: OrderedSpan[],
): { program: Instruction[]; origins: InstructionOrigin[] } {
  const result: Instruction[] = [];
  const origins: InstructionOrigin[] = [];
  program.forEach((instruction, index) => {
    spans
      .filter((s) => s.start === index)
      .sort((a, b) => b.end - a.end || a.order - b.order)
      .forEach((s) => {
        if (s.kind === 'mutex') {
          result.push({ op: 'LOCK', mutex: s.resource });
          origins.push({ kind: 'inserted', op: 'LOCK', slot: s.start });
        } else {
          result.push({ op: 'SEM_WAIT', sem: s.resource });
          origins.push({ kind: 'inserted', op: 'SEM_WAIT', slot: s.start });
        }
      });

    result.push({ ...instruction });
    origins.push({ kind: 'original', index });

    spans
      .filter((s) => s.end === index)
      .sort((a, b) => b.start - a.start || b.order - a.order)
      .forEach((s) => {
        if (s.kind === 'mutex') {
          result.push({ op: 'UNLOCK', mutex: s.resource });
          origins.push({ kind: 'inserted', op: 'UNLOCK', slot: s.end + 1 });
        } else {
          result.push({ op: 'SEM_SIGNAL', sem: s.resource });
          origins.push({ kind: 'inserted', op: 'SEM_SIGNAL', slot: s.end + 1 });
        }
      });
  });
  return { program: result, origins };
}

export function applyToolsDetailed(
  threads: ThreadDef[],
  placed: PlacedTool[],
): {
  threads: ThreadDef[];
  origins: Record<ThreadId, InstructionOrigin[]>;
} {
  const byThread = new Map<ThreadId, OrderedSpan[]>();
  const seenIds = new Set<string>();

  placed.forEach((tool, order) => {
    if (seenIds.has(tool.id)) {
      throw new Error(`Id alat "${tool.id}" dipakai lebih dari sekali.`);
    }
    seenIds.add(tool.id);

    if (tool.kind === 'semaphore') {
      if (!Number.isInteger(tool.value) || tool.value < 1 || tool.value > 8) {
        throw new Error(
          'Nilai semaphore harus berupa bilangan bulat antara 1 dan 8.',
        );
      }
    }

    const resource = tool.kind === 'mutex' ? tool.mutex : tool.sem;

    for (const span of tool.spans) {
      const thread = threads.find((t) => t.id === span.thread);
      if (!thread) {
        throw new Error(
          `Alat "${tool.id}" menunjuk thread "${span.thread}" yang tidak ada.`,
        );
      }
      validateSpan(tool, span, thread);
      const list = byThread.get(span.thread) ?? [];
      list.push({
        resource,
        kind: tool.kind,
        start: span.start,
        end: span.end,
        order,
      });
      byThread.set(span.thread, list);
    }
  });

  const origins: Record<ThreadId, InstructionOrigin[]> = {};
  const result = threads.map((thread) => {
    const spans = byThread.get(thread.id) ?? [];
    validatePairs(spans, thread);
    const built = buildProgram(thread.program, spans);
    origins[thread.id] = built.origins;
    return { ...thread, program: built.program };
  });
  return { threads: result, origins };
}

/** Seperti applyToolsDetailed, tetapi hanya mengembalikan program efektif. */
export function applyTools(
  threads: ThreadDef[],
  placed: PlacedTool[],
): ThreadDef[] {
  return applyToolsDetailed(threads, placed).threads;
}
