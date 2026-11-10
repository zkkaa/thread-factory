import type { RwLockSnapshot, RwMode, RwPolicy } from './primitives/rwlock';
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
  | { op: 'COND_BROADCAST'; cond: string }
  | { op: 'ENTER_AREA'; area: string }
  | { op: 'LEAVE_AREA'; area: string }

  // Ban berjalan (T-048). Tidak memblokir; pembatasnya semaphore empty/full.
  | { op: 'PUT_ITEM'; buffer: string } // taruh satu barang; ban penuh = overflow
  | { op: 'TAKE_ITEM'; buffer: string } // ambil satu barang; ban kosong = underflow

  // Readers-Writers (T-051, Level 2-2). Acquire bisa memblokir (WAITING).
  | { op: 'RW_ACQUIRE_READ'; lock: string }
  | { op: 'RW_RELEASE_READ'; lock: string }
  | { op: 'RW_ACQUIRE_WRITE'; lock: string }
  | { op: 'RW_RELEASE_WRITE'; lock: string }

  // Papan pengumuman: penulisan dua langkah; bacaan di antaranya setengah jadi.
  | { op: 'BOARD_READ'; board: string }
  | { op: 'BOARD_WRITE_START'; board: string }
  | { op: 'BOARD_WRITE_END'; board: string }
  // Busy waiting (T-045): tiap tick mengecek variabel bersama; selama nilainya
  // masih di bawah atLeast, thread TIDAK tidur dan terus memakai core.
  | { op: 'SPIN_UNTIL'; variable: string; atLeast: number };

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
 * cores = jumlah thread yang boleh mengeksekusi instruksi dalam satu tick.
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

  /** Kapasitas area berkapasitas, mis. { aula: 3 }. Bila tidak dispesifikasikan, default {}. */
  areas?: Record<string, number>;

  /** Kapasitas ban berjalan, mis. { ban: 3 }. Bila tidak ada, default {}. */
  buffers?: Record<string, number>;

  /** Kunci pembaca/penulis: nama -> kebijakan (Level 2-2). Bila tidak ada, default {}. */
  rwLocks?: Record<string, RwPolicy>;

  /** Nama papan pengumuman (Level 2-2). Bila tidak ada, default []. */
  boards?: string[];

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

  busyWaitTicks: number;
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

export interface BoardSnapshot {
  id: string;

  /** Jumlah penulis yang sedang menulis (0 = papan utuh). */
  activeWriters: number;

  /** Berapa kali penulisan selesai. */
  version: number;

  reads: number;

  /** Bacaan saat papan sedang ditulis (data setengah jadi). */
  inconsistentReads: number;

  /** Penulisan yang dimulai saat penulis lain masih menulis. */
  writeConflicts: number;
}

export interface BufferSnapshot {
  id: string;
  capacity: number;

  /** Barang di ban saat ini. */
  items: number;

  /** Berapa kali PUT_ITEM pada ban penuh (barang jatuh). */
  overflows: number;

  /** Berapa kali TAKE_ITEM pada ban kosong (tangan meraih kosong). */
  underflows: number;

  /** Barang yang berhasil ditaruh dan diambil. */
  totalPut: number;
  totalTaken: number;
}

/**
 * Keadaan penuh simulasi. Bagi pemanggil (controller, Phaser, React) snapshot
 * bersifat BACA-SAJA: jangan dimodifikasi.
 *
 * Metrik (throughput, lostUpdates, dst.) dihitung terpisah oleh metrics.ts (computeMetrics).
 */
export interface Snapshot {
  tick: number;
  seed: number;
  busyWaitTicks: number;
  finished: boolean;

  threads: ThreadSnapshot[];
  sharedVars: Record<string, number>;
  mutexes: MutexSnapshot[];
  semaphores: SemaphoreSnapshot[];
  conditions: ConditionSnapshot[];

  /** Jumlah thread yang saat ini berada di dalam tiap area, mis. { aula: 2 }. */
  areaOccupancy: Record<string, number>;

  /** Total tick dengan kejadian overload kapasitas area. */
  overloadTicks: number;

  /** Rata-rata utilisasi area (0..1). */
  areaUtilization: number;

  /** Jumlah core yang dipakai scheduler (dari konfigurasi level). */
  cores: number;

  /** Total eksekusi instruksi sejak tick 0 (satu per thread terpilih per tick). */
  executedInstructions: number;

  /** Keadaan tiap ban berjalan (kosong bila level tanpa ban). */
  buffers: BufferSnapshot[];

  /** Jumlah overflow dan underflow dari semua ban. */
  overflowCount: number;
  underflowCount: number;

  /** Papan pengumuman (Level 2-2); kosong bila level tanpa papan. */
  boards: BoardSnapshot[];

  /** Kunci pembaca/penulis (Level 2-2); kosong bila level tanpa kunci itu. */
  rwLocks: RwLockSnapshot[];

  /** Jumlah bacaan papan saat sedang ditulis, dari semua papan. */
  inconsistentReadCount: number;

  /** Jumlah penulisan papan yang bertabrakan, dari semua papan. */
  writeConflictCount: number;
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
  | {
      type: 'LOCK_ACQUIRED';
      tick: number;
      thread: ThreadId;
      mutex: string;
    }
  | {
      type: 'LOCK_RELEASED';
      tick: number;
      thread: ThreadId;
      mutex: string;
    }

  /** Thread berhenti menunggu resource on (mis. 'mutex:papan'). */
  | {
      type: 'BLOCKED';
      tick: number;
      thread: ThreadId;
      on: string;
    }
  | {
      type: 'DEADLOCK_DETECTED';
      tick: number;
      cycle: ThreadId[];
    }
  | {
      type: 'AREA_ENTERED';
      tick: number;
      thread: ThreadId;
      area: string;
    }
  | {
      type: 'AREA_LEFT';
      tick: number;
      thread: ThreadId;
      area: string;
    }
  | {
      type: 'AREA_OVERLOAD';
      tick: number;
      area: string;
      count: number;
      capacity: number;
    }
  | {
      type: 'BUFFER_PUT';
      tick: number;
      thread: ThreadId;
      buffer: string;
      items: number;
    }
  | {
      type: 'BUFFER_TAKEN';
      tick: number;
      thread: ThreadId;
      buffer: string;
      items: number;
    }
  | {
      type: 'BUFFER_OVERFLOW';
      tick: number;
      thread: ThreadId;
      buffer: string;
      capacity: number;
    }
  | {
      type: 'RW_ACQUIRED';
      tick: number;
      thread: ThreadId;
      lock: string;
      mode: RwMode;
    }
  | {
      type: 'RW_RELEASED';
      tick: number;
      thread: ThreadId;
      lock: string;
      mode: RwMode;
    }
  | {
      type: 'BOARD_READ';
      tick: number;
      thread: ThreadId;
      board: string;
      consistent: boolean;
    }
  | {
      type: 'BOARD_WRITE';
      tick: number;
      thread: ThreadId;
      board: string;
      phase: 'start' | 'end';
      conflict: boolean;
    }
  | {
      type: 'BUFFER_UNDERFLOW';
      tick: number;
      thread: ThreadId;
      buffer: string;
    }
  | {
      type: 'FINISHED';
      tick: number;
    };

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
