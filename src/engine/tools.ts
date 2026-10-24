import type { Instruction, ThreadDef, ThreadId } from './types';

export interface ToolSpan {
  thread: ThreadId;
  start: number;
  end: number;
}

export interface PlacedTool {
  id: string;
  kind: 'mutex';
  mutex: string;
  spans: ToolSpan[];
}

interface OrderedSpan {
  mutex: string;
  start: number;
  end: number;
  order: number;
}

const overlaps = (a: OrderedSpan, b: OrderedSpan): boolean =>
  a.start <= b.end && b.start <= a.end;

const contains = (outer: OrderedSpan, inner: OrderedSpan): boolean =>
  outer.start <= inner.start && inner.end <= outer.end;

function validateSpan(tool: PlacedTool, span: ToolSpan, thread: ThreadDef): void {
  const where = `Alat "${tool.id}" pada ${thread.label}`;
  if (!Number.isInteger(span.start) || !Number.isInteger(span.end)) {
    throw new Error(`${where}: start dan end harus bilangan bulat.`);
  }
  if (span.start > span.end) {
    throw new Error(`${where}: start (${span.start}) lebih besar dari end (${span.end}).`);
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
      if (a.mutex === b.mutex) {
        throw new Error(
          `${thread.label}: dua rentang untuk mutex "${a.mutex}" saling tumpang tindih.`,
        );
      }
      if (!contains(a, b) && !contains(b, a)) {
        throw new Error(
          `${thread.label}: rentang mutex "${a.mutex}" dan "${b.mutex}" saling silang; harus bersarang.`,
        );
      }
    }
  }
}

function buildProgram(program: Instruction[], spans: OrderedSpan[]): Instruction[] {
  const result: Instruction[] = [];
  program.forEach((instruction, index) => {
    spans
      .filter((s) => s.start === index)
      .sort((a, b) => b.end - a.end || a.order - b.order)
      .forEach((s) => result.push({ op: 'LOCK', mutex: s.mutex }));

    result.push({ ...instruction });

    spans
      .filter((s) => s.end === index)
      .sort((a, b) => b.start - a.start || b.order - a.order)
      .forEach((s) => result.push({ op: 'UNLOCK', mutex: s.mutex }));
  });
  return result;
}

export function applyTools(threads: ThreadDef[], placed: PlacedTool[]): ThreadDef[] {
  const byThread = new Map<ThreadId, OrderedSpan[]>();
  const seenIds = new Set<string>();

  placed.forEach((tool, order) => {
    if (seenIds.has(tool.id)) {
      throw new Error(`Id alat "${tool.id}" dipakai lebih dari sekali.`);
    }
    seenIds.add(tool.id);

    for (const span of tool.spans) {
      const thread = threads.find((t) => t.id === span.thread);
      if (!thread) {
        throw new Error(`Alat "${tool.id}" menunjuk thread "${span.thread}" yang tidak ada.`);
      }
      validateSpan(tool, span, thread);
      const list = byThread.get(span.thread) ?? [];
      list.push({ mutex: tool.mutex, start: span.start, end: span.end, order });
      byThread.set(span.thread, list);
    }
  });

  return threads.map((thread) => {
    const spans = byThread.get(thread.id) ?? [];
    validatePairs(spans, thread);
    return { ...thread, program: buildProgram(thread.program, spans) };
  });
}
