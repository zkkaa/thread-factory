import type {
  EngineConfig,
  Instruction,
  SchedulerConfig,
  ThreadDef,
} from '../../engine/types';

export const LEVEL_2_3_TECHNICIANS = 5;
/** Berapa kali tiap teknisi harus makan (program diulang sekian kali). */
export const LEVEL_2_3_MEALS = 3;
export const LEVEL_2_3_EAT_TICKS = 2;

/** Satu kunci inggris di antara tiap dua teknisi bertetangga, melingkar. */
export const LEVEL_2_3_FORKS: string[] = Array.from(
  { length: LEVEL_2_3_TECHNICIANS },
  (_, i) => `kunci-${i + 1}`,
);

/** Kunci kiri teknisi ke-i (mulai 0) = kunci ke-i. */
export function leftFork(i: number): string {
  return `kunci-${(i % LEVEL_2_3_TECHNICIANS) + 1}`;
}

/** Kunci kanan teknisi ke-i = kunci tetangga; teknisi terakhir memakai kunci-1 (siklus). */
export function rightFork(i: number): string {
  return `kunci-${((i + 1) % LEVEL_2_3_TECHNICIANS) + 1}`;
}

/** Program asli tanpa strategi: ambil kiri, ambil kanan, makan, lepas keduanya. */
export function technicianProgram(i: number): Instruction[] {
  return [
    { op: 'LOCK', mutex: leftFork(i) },
    { op: 'LOCK', mutex: rightFork(i) },
    { op: 'WORK', ticks: LEVEL_2_3_EAT_TICKS },
    { op: 'UNLOCK', mutex: rightFork(i) },
    { op: 'UNLOCK', mutex: leftFork(i) },
  ];
}

export const LEVEL_2_3_THREADS: ThreadDef[] = Array.from(
  { length: LEVEL_2_3_TECHNICIANS },
  (_, i) => ({
    id: `T${i + 1}`,
    label: `Teknisi ${i + 1}`,
    program: technicianProgram(i),
    repeat: LEVEL_2_3_MEALS,
  }),
);

/** cores = jumlah teknisi: semuanya bisa bergerak bersamaan, jadi deadlock pasti terjadi. */
export const LEVEL_2_3_SCHEDULER: SchedulerConfig = {
  kind: 'random',
  cores: LEVEL_2_3_TECHNICIANS,
};

/** EngineConfig skenario; `threads` bisa diganti untuk strategi di T-057. */
export function buildLevel23Config(
  threads: ThreadDef[] = LEVEL_2_3_THREADS,
  semaphores: Record<string, number> = {},
): EngineConfig {
  return {
    threads,
    sharedVars: {},
    mutexes: [...LEVEL_2_3_FORKS],
    semaphores,
    conditions: [],
    scheduler: LEVEL_2_3_SCHEDULER,
    maxTicks: 500,
  };
}

/** Strategi pencegahan deadlock (T-057). `none` = perilaku T-056 (pasti deadlock). */
export type TechnicianStrategy = 'none' | 'ordered' | 'limit4' | 'asymmetric';

export const TECHNICIAN_STRATEGIES: readonly TechnicianStrategy[] = [
  'none',
  'ordered',
  'limit4',
  'asymmetric',
];

/** Semaphore "kursi" untuk strategi limit4: paling banyak 4 teknisi memegang kunci. */
export const LEVEL_2_3_SEAT_SEMAPHORE = 'kursi';
export const LEVEL_2_3_MAX_SEATED = LEVEL_2_3_TECHNICIANS - 1;

function forkName(n: number): string {
  return `kunci-${n + 1}`;
}

/** Ambil `first`, lalu `second`, makan, lepas dengan urutan terbalik. */
function eatWith(first: string, second: string): Instruction[] {
  return [
    { op: 'LOCK', mutex: first },
    { op: 'LOCK', mutex: second },
    { op: 'WORK', ticks: LEVEL_2_3_EAT_TICKS },
    { op: 'UNLOCK', mutex: second },
    { op: 'UNLOCK', mutex: first },
  ];
}

/**
 * Program teknisi ke-i (mulai 0) menurut strategi. Ketiganya memutus kondisi
 * Coffman "Circular Wait":
 * - ordered: selalu ambil kunci bernomor lebih kecil dulu.
 * - limit4: semaphore membatasi 4 teknisi sekaligus, jadi minimal satu bisa
 *   mendapat dua kunci.
 * - asymmetric: nomor teknisi genap ambil kiri dulu, ganjil ambil kanan dulu.
 */
export function strategyProgram(
  i: number,
  strategy: TechnicianStrategy,
): Instruction[] {
  const left = i % LEVEL_2_3_TECHNICIANS;
  const right = (i + 1) % LEVEL_2_3_TECHNICIANS;

  switch (strategy) {
    case 'none':
      return technicianProgram(i);
    case 'ordered':
      return eatWith(
        forkName(Math.min(left, right)),
        forkName(Math.max(left, right)),
      );
    case 'limit4':
      return [
        { op: 'SEM_WAIT', sem: LEVEL_2_3_SEAT_SEMAPHORE },
        ...technicianProgram(i),
        { op: 'SEM_SIGNAL', sem: LEVEL_2_3_SEAT_SEMAPHORE },
      ];
    case 'asymmetric':
      // nomor teknisi = i + 1
      return (i + 1) % 2 === 0
        ? eatWith(forkName(left), forkName(right))
        : eatWith(forkName(right), forkName(left));
  }
}

export function buildStrategyThreads(strategy: TechnicianStrategy): ThreadDef[] {
  return Array.from(
    { length: LEVEL_2_3_TECHNICIANS },
    (_, i): ThreadDef => ({
      id: `T${i + 1}`,
      label: `Teknisi ${i + 1}`,
      program: strategyProgram(i, strategy),
      repeat: LEVEL_2_3_MEALS,
    }),
  );
}

/** EngineConfig Level 2-3 untuk satu strategi (limit4 menambah semaphore kursi). */
export function buildLevel23StrategyConfig(
  strategy: TechnicianStrategy,
): EngineConfig {
  const semaphores: Record<string, number> = {};
  if (strategy === 'limit4') {
    semaphores[LEVEL_2_3_SEAT_SEMAPHORE] = LEVEL_2_3_MAX_SEATED;
  }

  return buildLevel23Config(buildStrategyThreads(strategy), semaphores);
}