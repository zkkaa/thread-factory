export type ThreadId = string;

/**
 * Status thread.
 * NEW -> READY -> RUNNING -> (WAITING <-> READY) -> TERMINATED
 * WAITING = diblokir (menunggu mutex/semaphore/condition) dan TIDAK dipilih scheduler.
 */
export type ThreadState =
  'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

/**
 * Satu instruksi dalam program sebuah thread. Satu tick = satu instruksi.
 * Instruksi khusus skenario Modul 2 (mis. PUT_ITEM, TAKE_ITEM) akan
 * ditambahkan di sini saat Modul 2 dikerjakan (T-048 dan seterusnya).
 */
export type Instruction =
  | { op: 'WORK'; ticks: number } // pekerjaan lokal, tanpa data bersama
  | { op: 'READ'; from: string; into: string } // shared var -> register
  | { op: 'COMPUTE'; reg: string; add: number } // register += add
  | { op: 'WRITE'; reg: string; to: string } // register -> shared var
  | { op: 'LOCK'; mutex: string }
  | { op: 'UNLOCK'; mutex: string }
  | { op: 'SEM_WAIT'; sem: string }
  | { op: 'SEM_SIGNAL'; sem: string }
  | { op: 'COND_WAIT'; cond: string; mutex: string }
  | { op: 'COND_SIGNAL'; cond: string }
  | { op: 'COND_BROADCAST'; cond: string };

/** Nama operasi saja, mis. 'LOCK'. Dipakai di event INSTRUCTION. */
export type Op = Instruction['op'];

/** Definisi sebuah thread: program + jumlah pengulangan. */
export interface ThreadDef {
  id: ThreadId;
  /** Nama tampilan di layar, mis. 'Robot A'. */
  label: string;
  program: Instruction[];
  /** Berapa kali program dijalankan berulang. Default 1. */
  repeat?: number;
}

// ---------------------------------------------------------------------------
// Konfigurasi engine
// ---------------------------------------------------------------------------

/**
 * Pengaturan scheduler.
 * - random   : tiap tick memilih acak (dari PRNG berbasis seed) di antara thread READY.
 * - scripted : urutan eksekusi diberikan eksplisit (agar race condition PASTI muncul
 *              di level tutorial). Detail perilaku saat script habis diatur di T-014.
 * `cores` = jumlah thread yang boleh mengeksekusi instruksi dalam satu tick.
 */
export type SchedulerConfig =
  | { kind: 'random'; cores: number }
  | { kind: 'scripted'; cores: number; script: ThreadId[] };

/**
 * Semua yang dibutuhkan engine untuk menjalankan satu simulasi.
 *
 * Catatan: engine TIDAK mengimpor LevelDefinition dari levels/ (supaya tidak
 * ada ketergantungan melingkar). Controller yang menerjemahkan
 * LevelDefinition + alat pilihan pemain menjadi EngineConfig ini.
 */
export interface EngineConfig {
  threads: ThreadDef[];
  /** Nilai awal variabel bersama, mis. { stok: 0 }. */
  sharedVars: Record<string, number>;
  /** Daftar nama mutex. */
  mutexes: string[];
  /** Nama semaphore -> nilai awal. */
  semaphores: Record<string, number>;
  /** Daftar nama condition variable. */
  conditions: string[];
  scheduler: SchedulerConfig;
  /** Batas pengaman: simulasi dihentikan paksa setelah tick ini. */
  maxTicks: number;
}

// ---------------------------------------------------------------------------
// Snapshot (keadaan penuh pada satu saat)
// ---------------------------------------------------------------------------

export interface ThreadSnapshot {
  id: ThreadId;
  label: string;
  state: ThreadState;
  /** Indeks instruksi berikutnya yang akan dieksekusi. */
  pc: number;
  /** Pengulangan program ke berapa (mulai 0). */
  iteration: number;
  registers: Record<string, number>;
  /** Nama resource yang sedang ditunggu (mis. 'mutex:papan'), atau null. */
  waitingOn: string | null;
  /** Sisa tick untuk instruksi WORK yang sedang berjalan. */
  workRemaining: number;
  /** Total tick yang sudah dihabiskan di state WAITING. */
  waitTicks: number;
}

export interface MutexSnapshot {
  id: string;
  owner: ThreadId | null;
  queue: ThreadId[];
}

export interface SemaphoreSnapshot {
  id: string;
  value: number;
  queue: ThreadId[];
}

export interface ConditionSnapshot {
  id: string;
  queue: ThreadId[];
}

/**
 * Keadaan penuh simulasi. Bagi pemanggil (controller, Phaser, React) snapshot
 * bersifat BACA-SAJA: jangan dimodifikasi.
 * Metrik (throughput, lostUpdates, dst.) dihitung terpisah oleh metrics.ts (computeMetrics).
 */
export interface Snapshot {
  tick: number;
  seed: number;
  finished: boolean;
  threads: ThreadSnapshot[];
  sharedVars: Record<string, number>;
  mutexes: MutexSnapshot[];
  semaphores: SemaphoreSnapshot[];
  conditions: ConditionSnapshot[];
}

// ---------------------------------------------------------------------------
// Event (apa yang terjadi pada satu tick)
// ---------------------------------------------------------------------------

/** Event dipancarkan engine; Phaser menganimasikannya, React menampilkannya di log. */
export type SimEvent =
  | {
      type: 'THREAD_STATE';
      tick: number;
      thread: ThreadId;
      from: ThreadState;
      to: ThreadState;
    }
  | {
      type: 'INSTRUCTION';
      tick: number;
      thread: ThreadId;
      index: number;
      op: Op;
    }
  | {
      type: 'VAR_WRITTEN';
      tick: number;
      thread: ThreadId;
      name: string;
      oldValue: number;
      newValue: number;
    }
  | { type: 'LOCK_ACQUIRED'; tick: number; thread: ThreadId; mutex: string }
  | { type: 'LOCK_RELEASED'; tick: number; thread: ThreadId; mutex: string }
  /** Thread berhenti menunggu resource `on` (mis. 'mutex:papan'). */
  | { type: 'BLOCKED'; tick: number; thread: ThreadId; on: string }
  | { type: 'DEADLOCK_DETECTED'; tick: number; cycle: ThreadId[] }
  | { type: 'FINISHED'; tick: number };

/** Hasil dari satu pemanggilan engine.step(). */
export interface StepResult {
  tick: number;
  events: SimEvent[];
  finished: boolean;
}

// ---------------------------------------------------------------------------
// Antarmuka engine
// ---------------------------------------------------------------------------

/**
 * Kontrak publik engine. Engine TIDAK punya timer: ia hanya maju saat step()
 * dipanggil (oleh SimulationController).
 */
export interface SimulationEngine {
  load(config: EngineConfig, seed: number): void;
  /** Maju tepat satu tick. */
  step(): StepResult;
  /** Mulai ulang dengan konfigurasi yang sama; seed opsional (default: seed terakhir). */
  reset(seed?: number): void;
  getSnapshot(): Readonly<Snapshot>;
  readonly isFinished: boolean;
}
