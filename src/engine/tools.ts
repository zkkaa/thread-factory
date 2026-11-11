import type { Instruction, ThreadDef, ThreadId } from './types.ts';

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

/**
 * Pasangan semaphore (Producer-Consumer): `SEM_WAIT waitSem` disisipkan
 * sebelum instruksi pertama rentang, `SEM_SIGNAL signalSem` sesudah yang
 * terakhir. Nilai awal kedua semaphore dari resources level, bukan dari alat.
 */
export interface PlacedSemaphorePairTool {
  id: string;
  kind: 'semaphorePair';
  waitSem: string;
  signalSem: string;
  spans: ToolSpan[];
}

/**
 * Lampu Sinyal (condition variable), satu alat berpasangan:
 * - `waiter`: instruksi SPIN_UNTIL (indeks ASLI) milik thread penunggu yang
 *   DIGANTI menjadi LOCK, COND_WAIT, UNLOCK (tidur, bukan busy waiting);
 * - `signaler`: slot di thread pemberi sinyal tempat LOCK, COND_SIGNAL, UNLOCK
 *   DISISIPKAN (slot k = sebelum instruksi asli k; slot n = sesudah yang terakhir).
 * `spans` selalu kosong; ada supaya kode generik yang membaca `tool.spans`
 * (mis. salinan alat di controller) tetap aman.
 */
export interface PlacedConditionTool {
  id: string;
  kind: 'condition';
  cond: string;
  mutex: string;
  waiter: { thread: ThreadId; index: number };
  signaler: { thread: ThreadId; slot: number };
  spans: ToolSpan[];
}

/**
 * Pengaman papan pengumuman (Readers-Writers, Level 2-2). Satu alat untuk
 * seluruh robot:
 * - `readers`: rentang (indeks ASLI) milik pembaca; dibungkus
 *   `RW_ACQUIRE_READ` sebelum dan `RW_RELEASE_READ` sesudahnya;
 * - `writers`: rentang milik penulis; dibungkus `RW_ACQUIRE_WRITE` dan
 *   `RW_RELEASE_WRITE`.
 * Kebijakan (reader, writer, fair) BUKAN bagian alat ini: ia berasal dari
 * resource `rwlock` di level atau dari opsi `rwPolicy` buildEngineConfig.
 * `spans` selalu kosong; ada supaya kode generik yang membaca `tool.spans`
 * (mis. salinan alat di controller) tetap aman.
 */
export interface PlacedRwLockTool {
  id: string;
  kind: 'rwlock';
  lock: string;
  readers: ToolSpan[];
  writers: ToolSpan[];
  spans: ToolSpan[];
}

export type PlacedTool =
  | PlacedMutexTool
  | PlacedSemaphoreTool
  | PlacedSemaphorePairTool
  | PlacedConditionTool
  | PlacedRwLockTool;

interface OrderedSpan {
  resource: string;
  signalResource?: string | undefined;
  kind: 'mutex' | 'semaphore' | 'rwRead' | 'rwWrite';
  start: number;
  end: number;
  order: number;
}

/** Asal satu instruksi pada program efektif (ARCHITECTURE 4.6). */
export type InstructionOrigin =
  | { kind: 'original'; index: number }
  | {
      kind: 'inserted';
      op:
        | 'LOCK'
        | 'UNLOCK'
        | 'SEM_WAIT'
        | 'SEM_SIGNAL'
        | 'COND_SIGNAL'
        | 'RW_ACQUIRE_READ'
        | 'RW_RELEASE_READ'
        | 'RW_ACQUIRE_WRITE'
        | 'RW_RELEASE_WRITE';
      slot: number;
    }
  | {
      // Menggantikan instruksi asli ke-`index` (alat Lampu Sinyal).
      kind: 'replaced';
      op: 'LOCK' | 'COND_WAIT' | 'UNLOCK';
      index: number;
    };

/** Satu instruksi hasil alat condition beserta asalnya. */
interface PlannedStep {
  instruction: Instruction;
  origin: InstructionOrigin;
}

/** thread -> (indeks atau slot -> langkah yang direncanakan). */
type StepMap = Map<ThreadId, Map<number, PlannedStep[]>>;

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
        const jenis =
          a.kind === 'mutex'
            ? 'mutex'
            : a.kind === 'semaphore'
              ? 'semaphore'
              : 'kunci baca-tulis';
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

function addSteps(
  map: StepMap,
  thread: ThreadId,
  key: number,
  steps: PlannedStep[],
): void {
  const perThread = map.get(thread) ?? new Map<number, PlannedStep[]>();
  perThread.set(key, [...(perThread.get(key) ?? []), ...steps]);
  map.set(thread, perThread);
}

/** LOCK, COND_WAIT, UNLOCK: pengganti SPIN_UNTIL pada indeks asli `index`. */
function waitSteps(tool: PlacedConditionTool, index: number): PlannedStep[] {
  const { cond, mutex } = tool;
  return [
    {
      instruction: { op: 'LOCK', mutex },
      origin: { kind: 'replaced', op: 'LOCK', index },
    },
    {
      instruction: { op: 'COND_WAIT', cond, mutex },
      origin: { kind: 'replaced', op: 'COND_WAIT', index },
    },
    {
      instruction: { op: 'UNLOCK', mutex },
      origin: { kind: 'replaced', op: 'UNLOCK', index },
    },
  ];
}

/** LOCK, COND_SIGNAL, UNLOCK: disisipkan pada slot pemberi sinyal. */
function signalSteps(tool: PlacedConditionTool, slot: number): PlannedStep[] {
  const { cond, mutex } = tool;
  return [
    {
      instruction: { op: 'LOCK', mutex },
      origin: { kind: 'inserted', op: 'LOCK', slot },
    },
    {
      instruction: { op: 'COND_SIGNAL', cond },
      origin: { kind: 'inserted', op: 'COND_SIGNAL', slot },
    },
    {
      instruction: { op: 'UNLOCK', mutex },
      origin: { kind: 'inserted', op: 'UNLOCK', slot },
    },
  ];
}

/** Memeriksa alat condition lalu mencatat rencananya ke `replaced` dan `inserted`. */
function planCondition(
  tool: PlacedConditionTool,
  threads: ThreadDef[],
  replaced: StepMap,
  inserted: StepMap,
): void {
  const where = `Alat "${tool.id}"`;
  const find = (id: ThreadId): ThreadDef => {
    const thread = threads.find((t) => t.id === id);
    if (!thread) {
      throw new Error(`${where} menunjuk thread "${id}" yang tidak ada.`);
    }
    return thread;
  };
  const waiter = find(tool.waiter.thread);
  const signaler = find(tool.signaler.thread);

  if (waiter.id === signaler.id) {
    throw new Error(
      `${where}: penunggu dan pemberi sinyal tidak boleh thread yang sama.`,
    );
  }

  const { index } = tool.waiter;
  if (!Number.isInteger(index) || index < 0 || index >= waiter.program.length) {
    throw new Error(
      `${where}: indeks penunggu ${index} di luar program ${waiter.label} (panjang ${waiter.program.length}).`,
    );
  }
  if (waiter.program[index]?.op !== 'SPIN_UNTIL') {
    throw new Error(
      `${where}: instruksi yang diganti harus SPIN_UNTIL (busy waiting).`,
    );
  }
  if (replaced.get(waiter.id)?.has(index)) {
    throw new Error(
      `${where}: instruksi ${index} pada ${waiter.label} sudah digantikan alat lain.`,
    );
  }

  const { slot } = tool.signaler;
  if (!Number.isInteger(slot) || slot < 0 || slot > signaler.program.length) {
    throw new Error(
      `${where}: slot pemberi sinyal ${slot} di luar program ${signaler.label} (0..${signaler.program.length}).`,
    );
  }

  addSteps(replaced, waiter.id, index, waitSteps(tool, index));
  addSteps(inserted, signaler.id, slot, signalSteps(tool, slot));
}

/** Instruksi pembuka rentang (LOCK, SEM_WAIT, atau RW_ACQUIRE_*) beserta asalnya. */
function openStep(span: OrderedSpan): PlannedStep {
  const slot = span.start;
  switch (span.kind) {
    case 'mutex':
      return {
        instruction: { op: 'LOCK', mutex: span.resource },
        origin: { kind: 'inserted', op: 'LOCK', slot },
      };
    case 'semaphore':
      return {
        instruction: { op: 'SEM_WAIT', sem: span.resource },
        origin: { kind: 'inserted', op: 'SEM_WAIT', slot },
      };
    case 'rwRead':
      return {
        instruction: { op: 'RW_ACQUIRE_READ', lock: span.resource },
        origin: { kind: 'inserted', op: 'RW_ACQUIRE_READ', slot },
      };
    case 'rwWrite':
      return {
        instruction: { op: 'RW_ACQUIRE_WRITE', lock: span.resource },
        origin: { kind: 'inserted', op: 'RW_ACQUIRE_WRITE', slot },
      };
  }
}

/** Instruksi penutup rentang (UNLOCK, SEM_SIGNAL, atau RW_RELEASE_*) beserta asalnya. */
function closeStep(span: OrderedSpan): PlannedStep {
  const slot = span.end + 1;
  switch (span.kind) {
    case 'mutex':
      return {
        instruction: { op: 'UNLOCK', mutex: span.resource },
        origin: { kind: 'inserted', op: 'UNLOCK', slot },
      };
    case 'semaphore':
      return {
        instruction: {
          op: 'SEM_SIGNAL',
          sem: span.signalResource ?? span.resource,
        },
        origin: { kind: 'inserted', op: 'SEM_SIGNAL', slot },
      };
    case 'rwRead':
      return {
        instruction: { op: 'RW_RELEASE_READ', lock: span.resource },
        origin: { kind: 'inserted', op: 'RW_RELEASE_READ', slot },
      };
    case 'rwWrite':
      return {
        instruction: { op: 'RW_RELEASE_WRITE', lock: span.resource },
        origin: { kind: 'inserted', op: 'RW_RELEASE_WRITE', slot },
      };
  }
}

/**
 * Urutan pada satu titik: sisipan condition (slot k) dahulu, lalu pembuka
 * rentang mutex/semaphore yang mulai di k, lalu instruksi (atau penggantinya),
 * lalu penutup rentang yang berakhir di k. Sisipan slot n (sesudah instruksi
 * terakhir) ditaruh paling akhir.
 */
function buildProgram(
  program: Instruction[],
  spans: OrderedSpan[],
  replaced: ReadonlyMap<number, PlannedStep[]>,
  inserted: ReadonlyMap<number, PlannedStep[]>,
): { program: Instruction[]; origins: InstructionOrigin[] } {
  const result: Instruction[] = [];
  const origins: InstructionOrigin[] = [];
  const emit = (steps: readonly PlannedStep[]): void => {
    for (const step of steps) {
      result.push({ ...step.instruction });
      origins.push(step.origin);
    }
  };

  program.forEach((instruction, index) => {
    emit(inserted.get(index) ?? []);

    spans
      .filter((s) => s.start === index)
      .sort((a, b) => b.end - a.end || a.order - b.order)
      .forEach((s) => {
        emit([openStep(s)]);
      });

    const swap = replaced.get(index);
    if (swap !== undefined) {
      emit(swap);
    } else {
      result.push({ ...instruction });
      origins.push({ kind: 'original', index });
    }

    spans
      .filter((s) => s.end === index)
      .sort((a, b) => b.start - a.start || b.order - a.order)
      .forEach((s) => {
        emit([closeStep(s)]);
      });
  });

  emit(inserted.get(program.length) ?? []);
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
  const replaced: StepMap = new Map();
  const inserted: StepMap = new Map();
  const seenIds = new Set<string>();

  placed.forEach((tool, order) => {
    if (seenIds.has(tool.id)) {
      throw new Error(`Id alat "${tool.id}" dipakai lebih dari sekali.`);
    }
    seenIds.add(tool.id);

    if (tool.kind === 'condition') {
      planCondition(tool, threads, replaced, inserted);
      return;
    }

    const addSpan = (
      span: ToolSpan,
      spec: Pick<OrderedSpan, 'resource' | 'signalResource' | 'kind'>,
    ): void => {
      const thread = threads.find((t) => t.id === span.thread);
      if (!thread) {
        throw new Error(
          `Alat "${tool.id}" menunjuk thread "${span.thread}" yang tidak ada.`,
        );
      }
      validateSpan(tool, span, thread);
      const list = byThread.get(span.thread) ?? [];
      list.push({ ...spec, start: span.start, end: span.end, order });
      byThread.set(span.thread, list);
    };

    if (tool.kind === 'rwlock') {
      for (const span of tool.readers) {
        addSpan(span, { resource: tool.lock, kind: 'rwRead' });
      }
      for (const span of tool.writers) {
        addSpan(span, { resource: tool.lock, kind: 'rwWrite' });
      }
      return;
    }

    if (tool.kind === 'semaphore') {
      if (!Number.isInteger(tool.value) || tool.value < 1 || tool.value > 8) {
        throw new Error(
          'Nilai semaphore harus berupa bilangan bulat antara 1 dan 8.',
        );
      }
    }

    if (tool.kind === 'semaphorePair' && tool.waitSem === tool.signalSem) {
      throw new Error(
        `Alat "${tool.id}": semaphore tunggu dan sinyal harus berbeda.`,
      );
    }
    const resource =
      tool.kind === 'mutex'
        ? tool.mutex
        : tool.kind === 'semaphore'
          ? tool.sem
          : tool.waitSem;
    const signalResource =
      tool.kind === 'semaphorePair' ? tool.signalSem : undefined;

    for (const span of tool.spans) {
      addSpan(span, {
        resource,
        signalResource,
        kind: tool.kind === 'mutex' ? 'mutex' : 'semaphore',
      });
    }
  });

  const origins: Record<ThreadId, InstructionOrigin[]> = {};
  const result = threads.map((thread) => {
    const spans = byThread.get(thread.id) ?? [];
    validatePairs(spans, thread);
    const built = buildProgram(
      thread.program,
      spans,
      replaced.get(thread.id) ?? new Map(),
      inserted.get(thread.id) ?? new Map(),
    );
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
