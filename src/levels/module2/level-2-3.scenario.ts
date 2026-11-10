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
): EngineConfig {
  return {
    threads,
    sharedVars: {},
    mutexes: [...LEVEL_2_3_FORKS],
    semaphores: {},
    conditions: [],
    scheduler: LEVEL_2_3_SCHEDULER,
    maxTicks: 500,
  };
}