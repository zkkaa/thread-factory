# ARCHITECTURE — Thread Factory: Pabrik Rebutan

> Dokumen ini menjawab **"bagaimana proyek dibangun"**. Untuk fitur dan level, lihat `PRD.md`. Untuk urutan kerja, lihat `TASKS.md`.
> Isi dokumen ini bersifat **aturan**: jika kode melanggarnya, kodenya yang diubah (atau dokumen ini diubah lewat diskusi tim).

## 1. Prinsip

1. **Engine adalah otak, Phaser adalah mata, React adalah tangan.** Logika hanya ada di engine; gambar hanya di Phaser; kontrol dan angka hanya di React.
2. **Deterministik.** Seed yang sama harus menghasilkan simulasi yang sama persis.
3. **Data-driven.** Level adalah data (konfigurasi), bukan kode khusus. Engine bersifat generik.
4. **Dapat diuji tanpa browser.** Seluruh `engine/` bisa dites dengan Vitest.
5. **Sederhana dulu.** Tidak ada library tambahan tanpa persetujuan tim.

## 2. Gambaran Tiga Lapisan

```
┌──────────────────────────────────────────────────────────┐
│  React Control Panel (src/ui)                            │
│  ControlBar · Toolbox · MetricsPanel · ResultDialog      │
└───────────────┬───────────────────────────▲──────────────┘
         perintah                      snapshot/events
                │                           │
┌───────────────▼───────────────────────────┴──────────────┐
│  SimulationController (src/controller)                   │
│  jam tick · state: idle/running/paused/finished          │
│  satu-satunya pemanggil engine.step()                    │
└───────────────┬───────────────────────────▲──────────────┘
          step(), reset()             snapshot + events
                │                           │
┌───────────────▼───────────────────────────┴──────────────┐
│  Simulation Engine (src/engine)  — TypeScript murni      │
│  threads · scheduler · mutex · semaphore · condition     │
│  tanpa import phaser, react, DOM, Math.random, Date.now  │
└──────────────────────────────────────────────────────────┘
                ▲ (hanya membaca snapshot/events)
┌───────────────┴──────────────────────────────────────────┐
│  Visual Renderer — Phaser 3 (src/game)                   │
│  scene · view robot/mesin/pintu · tween animasi          │
└──────────────────────────────────────────────────────────┘
```

Aturan ketergantungan (panah hanya boleh ke bawah/dalam):
- `engine/` **tidak mengimpor** apa pun dari `game/`, `ui/`, `controller/`, `phaser`, atau `react`.
- `controller/` hanya mengimpor `engine/` dan `levels/`.
- `game/` dan `ui/` mengimpor `controller/` (dan tipe dari `engine/`), tetapi **tidak saling mengimpor** komponen. Komunikasi UI-Phaser yang bukan state simulasi memakai `EventBus`.
- `levels/` hanya berisi data dan tipe.

## 3. Struktur Folder

```
src/
├─ engine/
│  ├─ types.ts            # tipe inti: Instruction, ThreadDef, Snapshot, SimEvent
│  ├─ prng.ts             # pseudo-random berbasis seed (mulberry32)
│  ├─ engine.ts           # SimulationEngine: load, step, reset, getSnapshot
│  ├─ scheduler.ts        # RandomSeeded, Scripted
│  ├─ tools.ts            # applyTools(): ubah rentang pengaman jadi instruksi
│  ├─ metrics.ts          # throughput, waktu tunggu, lost update, dst.
│  ├─ primitives/
│  │  ├─ mutex.ts
│  │  ├─ semaphore.ts
│  │  └─ condition.ts
│  ├─ deadlock.ts         # deteksi siklus tunggu (Modul 2)
│  └─ __tests__/          # tes Vitest untuk engine
├─ levels/
│  ├─ types.ts            # LevelDefinition
│  ├─ module1/            # level-1-1.ts, level-1-2.ts, ...
│  ├─ module2/            # level-2-1.ts, ...
│  └─ index.ts            # daftar level
├─ controller/
│  └─ SimulationController.ts
├─ game/                  # Phaser
│  ├─ main.ts             # konfigurasi game
│  ├─ EventBus.ts         # event non-simulasi antara React dan Phaser
│  ├─ theme.ts            # warna state, ukuran ubin
│  ├─ scenes/             # BootScene, LevelScene
│  └─ views/              # RobotView, BoardView, DoorView, TokenView, ...
├─ ui/                    # React
│  ├─ App.tsx
│  ├─ components/         # ControlBar, Toolbox, MetricsPanel, ResultDialog, LevelSelect
│  └─ hooks/              # useSimulation()
└─ main.tsx
docs/
├─ PRD.md · ARCHITECTURE.md · TASKS.md
└─ AI_USAGE.md            # catatan bagian yang dibantu AI (kewajiban tugas)
```

## 4. Simulation Engine

### 4.1 Model

- Setiap **thread** adalah program kecil: daftar **instruksi** yang dieksekusi satu per tick.
- Setiap **tick**, scheduler memilih hingga `cores` thread dalam state READY, dan tiap thread terpilih mengeksekusi **satu instruksi**. Default `cores = 1` (satu CPU), sehingga satu robot "dibekukan" sementara robot lain bergerak (ini yang menjelaskan interleaving).
- Race condition **muncul alami** dari urutan interleaving, bukan diskenariokan.
- Thread punya state: `NEW → READY ⇄ RUNNING → WAITING (diblokir) → READY → TERMINATED`.
- Thread yang menunggu (mutex dipegang orang lain, semaphore bernilai 0, condition belum disinyal) berstatus `WAITING` dan **tidak dipilih scheduler** sampai dibangunkan.

### 4.2 Tipe inti (sketsa)

```ts
export type ThreadId = string;
export type ThreadState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export type Instruction =
  | { op: 'WORK'; ticks: number }                 // pekerjaan lokal (tanpa data bersama)
  | { op: 'READ'; from: string; into: string }    // shared var -> register
  | { op: 'COMPUTE'; reg: string; add: number }
  | { op: 'WRITE'; reg: string; to: string }      // register -> shared var
  | { op: 'LOCK'; mutex: string }
  | { op: 'UNLOCK'; mutex: string }
  | { op: 'SEM_WAIT'; sem: string }
  | { op: 'SEM_SIGNAL'; sem: string }
  | { op: 'COND_WAIT'; cond: string; mutex: string }
  | { op: 'COND_SIGNAL'; cond: string }
  | { op: 'COND_BROADCAST'; cond: string };
// Instruksi khusus skenario (mis. PUT_ITEM, TAKE_ITEM, ACQUIRE_FORK) ditambahkan
// ke union ini saat Modul 2 dikerjakan, dan didokumentasikan di sini.

export interface ThreadDef {
  id: ThreadId;
  label: string;
  program: Instruction[];
  repeat?: number;                                // jumlah pengulangan program
}
```

### 4.3 API Engine

```ts
export interface SimulationEngine {
  load(config: EngineConfig, seed: number): void;
  step(): StepResult;                 // tepat satu tick
  reset(seed?: number): void;
  getSnapshot(): Readonly<Snapshot>;  // keadaan penuh saat ini (immutable bagi pemanggil)
  readonly isFinished: boolean;
}

export interface StepResult {
  tick: number;
  events: SimEvent[];
  finished: boolean;
}

export type SimEvent =
  | { type: 'THREAD_STATE'; tick: number; thread: ThreadId; from: ThreadState; to: ThreadState }
  | { type: 'INSTRUCTION'; tick: number; thread: ThreadId; index: number; op: Instruction['op'] }
  | { type: 'VAR_WRITTEN'; tick: number; thread: ThreadId; name: string; oldValue: number; newValue: number }
  | { type: 'LOCK_ACQUIRED' | 'LOCK_RELEASED'; tick: number; thread: ThreadId; mutex: string }
  | { type: 'BLOCKED'; tick: number; thread: ThreadId; on: string }
  | { type: 'DEADLOCK_DETECTED'; tick: number; cycle: ThreadId[] }
  | { type: 'FINISHED'; tick: number };
```

Engine **tidak punya timer**. Ia hanya maju saat `step()` dipanggil.

**Catatan (disepakati saat T-011):** engine menerima `EngineConfig` (didefinisikan di `engine/types.ts`), **bukan** `LevelDefinition`. Dengan begitu `engine/` tidak perlu mengimpor `levels/` (menghindari ketergantungan melingkar). `SimulationController` yang menerjemahkan `LevelDefinition` + alat pilihan pemain (lewat `applyTools`) menjadi `EngineConfig`. Isi `EngineConfig`: `threads`, `sharedVars`, `mutexes`, `semaphores` (nama → nilai awal), `conditions`, `scheduler`, dan `maxTicks` (batas pengaman).

### 4.4 Determinisme dan scheduler

- Semua keacakan berasal dari `prng.ts` (mulberry32) yang diinisialisasi dengan seed.
- **Dilarang** di dalam `engine/`: `Math.random()`, `Date.now()`, `performance.now()`, `setTimeout`.
- Scheduler yang tersedia:
  - `RandomSeeded`: memilih acak (dari PRNG) di antara thread READY tiap tick.
  - `Scripted`: urutan eksekusi diberikan eksplisit (untuk level tutorial agar race condition **pasti** muncul).
- Pemilihan scheduler dan parameternya (`cores`, `preemptProbability`) ada di `LevelDefinition`.

### 4.5 Primitif sinkronisasi

| Primitif | Perilaku |
|---|---|
| `Mutex` | Punya `owner` dan antrean tunggu FIFO. `LOCK` pada mutex terpakai membuat thread `WAITING`. `UNLOCK` hanya oleh pemilik, lalu membangunkan thread terdepan. |
| `Semaphore` | Punya `value` dan antrean FIFO. `SEM_WAIT` mengurangi nilai; jika hasilnya negatif, thread menunggu. `SEM_SIGNAL` menambah nilai dan membangunkan satu thread. |
| `Condition` | Berpasangan dengan mutex. `COND_WAIT` melepas mutex lalu tidur; setelah dibangunkan, thread mengambil mutex lagi. |

Pelanggaran penggunaan (mis. `UNLOCK` oleh bukan pemilik) memicu error engine yang jelas, bukan perilaku diam-diam.

### 4.6 Alat pemain menjadi instruksi (`tools.ts`)

Pemain menaruh alat pada **rentang ubin** di jalur robot. Fungsi murni berikut menerjemahkannya:

```ts
applyTools(threads: ThreadDef[], placed: PlacedTool[]): ThreadDef[]
// Contoh: mutex menutupi instruksi indeks 1..3 pada Robot A
//   -> LOCK sebelum indeks 1, UNLOCK setelah indeks 3
```

Aturan: `applyTools` tidak mengubah input, dan memiliki tes sendiri (urutan LOCK/UNLOCK seimbang, rentang tidak boleh tumpang tindih untuk mutex yang sama kecuali level mengizinkan).

### 4.7 Metrik (`metrics.ts`)

Dihitung dari event dan snapshot, bukan dari Phaser:
- `throughput` = pekerjaan selesai / tick
- `waitTicks` per thread (jumlah tick berstatus WAITING), rata-rata dan maksimum
- `lostUpdates` = (nilai yang seharusnya) − (nilai akhir), diukur lewat invariant level
- `utilization` mesin
- `deadlockCount`, dan `starvation` (waktu tunggu maksimum melebihi ambang)
- `busyWaitTicks` (Level 1-4)

### 4.8 Deteksi deadlock (`deadlock.ts`)

Deadlock terdeteksi bila **tidak ada thread READY, tetapi belum semua TERMINATED**. Engine lalu membangun *wait-for graph* dan mencari siklus, kemudian memancarkan `DEADLOCK_DETECTED` dengan daftar thread dalam siklus (dipakai renderer untuk menggambar garis merah).

## 5. Simulation Controller

Satu-satunya tempat yang memiliki **jam**.

```ts
type RunState = 'idle' | 'running' | 'paused' | 'finished';

class SimulationController {
  loadLevel(def: LevelDefinition): void;
  placeTool(tool: PlacedTool): void;   removeTool(id: string): void;
  run(): void;  pause(): void;  step(): void;  reset(seed?: number): void;
  setSpeed(multiplier: 0.5 | 1 | 5): void;
  subscribe(listener: (s: ControllerState) => void): () => void;   // snapshot + events + runState
}
```

- Laju dasar: tick per detik ditentukan satu konstanta (mis. 4 tick/detik), lalu dikali kecepatan.
- Jam memakai akumulator waktu dengan `requestAnimationFrame`; tiap kali akumulator melewati satu interval, panggil `engine.step()`.
- `step()` manual hanya berlaku saat `paused` atau `idle`.
- Mengubah alat setelah Run dimulai tidak diizinkan; pemain harus Reset dulu.

## 6. Visual Renderer (Phaser 3)

**Tugas:** menggambar dan menganimasikan apa yang terjadi. **Bukan tugas:** memutuskan apa yang terjadi.

- `LevelScene` dibuat dari data level: membangun *view* untuk tiap thread, resource, dan alat dari snapshot awal.
- Tiap entitas punya kelas view sendiri (`RobotView`, `BoardView`, `DoorView`, `TokenView`, `BufferView`, ...). Mengganti kotak geometris menjadi sprite nanti hanya mengubah isi kelas view.
- Menerima `events` dari controller, lalu menjalankan tween. Durasi tween = `tickInterval / speed`, sehingga animasi selalu selesai sebelum tick berikutnya.
- Saat `reset`, scene membuang dan membangun ulang view dari snapshot.
- Ukuran dan warna ditaruh di `theme.ts` (satu tempat). Warna state selalu dipasangkan dengan label atau ikon.
- Tidak ada aturan permainan di dalam scene (mis. "hasil benar atau salah" dihitung engine, bukan scene).

## 7. Control Panel (React + Tailwind)

- Komponen: `ControlBar` (Run/Pause/Step/Reset, kecepatan, seed), `Toolbox` (alat yang tersedia di level), `MetricsPanel`, `StepLog`, `ResultDialog`, `LevelSelect`, `CompareView` (mode Bandingkan).
- Hook `useSimulation()` memakai `useSyncExternalStore` untuk berlangganan ke controller, sehingga tidak perlu library state management.
- Tailwind **hanya** untuk UI React, bukan untuk isi arena Phaser.
- Komponen React **tidak memanggil Phaser langsung**. Ia memanggil controller; kalau perlu mengabari scene (mis. level dipilih), pakai `EventBus`.

## 8. Alur Data

```
Pemain klik "Run"
  → ControlBar memanggil controller.run()
  → controller memulai jam; tiap interval: engine.step() → { events, snapshot }
  → controller memancarkan state ke subscriber
      ├─ Phaser LevelScene: memutar tween dari events
      └─ React: memperbarui MetricsPanel dan StepLog dari snapshot
  → engine memancarkan FINISHED → controller berstatus 'finished'
  → ResultDialog menampilkan hasil, bintang, dan penjelasan
```

## 9. Format Level (sketsa)

```ts
export interface LevelDefinition {
  id: string;                          // '1-1'
  module: 1 | 2;
  title: string;                       // 'Bug Papan Stok'
  intro: string;                       // teks Pak Mandor
  threads: ThreadDef[];
  sharedVars: Record<string, number>;
  resources: ResourceDef[];            // mutex, semaphore, condition, buffer, dst.
  availableTools: ToolType[];          // alat yang boleh dipakai pemain
  scheduler: { kind: 'random' | 'scripted'; cores: number; script?: ThreadId[] };
  tutorialSeed?: number;               // seed yang pasti memunculkan masalah
  goal: {
    invariant: (snap: Snapshot) => { ok: boolean; message: string };
    stars: { fast: number; lowWait: number };   // ambang tick dan waktu tunggu
  };
}
```

## 10. Strategi Pengujian (Vitest)

Tes wajib untuk `engine/`:
1. **Determinisme:** seed sama → urutan event identik.
2. **Level 1-1 tanpa mutex:** pada `tutorialSeed`, nilai akhir ≠ target.
3. **Level 1-1 dengan mutex:** nilai akhir = target pada banyak seed (mis. 1.000 seed).
4. **Primitif:** mutex tidak pernah dimiliki dua thread; semaphore tidak negatif secara permanen; antrean FIFO.
5. **`applyTools`:** LOCK dan UNLOCK seimbang, input tidak termutasi.
6. **Deadlock (Modul 2):** Dining Philosophers tanpa strategi terdeteksi deadlock; dengan tiap strategi tidak deadlock.

Renderer dan UI diuji manual dengan daftar periksa di `TASKS.md`.

## 11. Cara Menambah Level atau Primitif

**Level baru:**
1. Buat `levels/moduleN/level-X-Y.ts` yang mengekspor `LevelDefinition`.
2. Daftarkan di `levels/index.ts`.
3. Tulis tes engine untuk level itu (kondisi gagal dan kondisi menang).
4. Tambahkan view baru di `game/views/` **hanya jika** ada entitas visual baru.

**Instruksi atau primitif baru:**
1. Tambahkan tipe di `engine/types.ts` dan dokumentasikan di bagian 4.2.
2. Implementasikan di `engine/` beserta tes.
3. Tambahkan event baru (jika perlu) dan view-nya di Phaser.

## 12. Konvensi Kode

- TypeScript `strict: true`; **tanpa `any`**.
- Fungsi engine sebisa mungkin murni; mutasi state hanya di dalam kelas engine.
- Nama berkas: `camelCase.ts` untuk modul, `PascalCase.ts(x)` untuk kelas dan komponen.
- Identifier dalam bahasa Inggris; komentar dan dokumen dalam bahasa Indonesia.
- Satu berkas, satu tanggung jawab; hindari berkas lebih dari sekitar 300 baris.

## 13. Catatan Keputusan Arsitektur (ADR singkat)

| # | Keputusan | Alasan |
|---|---|---|
| 1 | Engine terpisah total dari Phaser | Bisa dites tanpa browser; Step/Pause/Reset mudah |
| 2 | Thread = program instruksi, dieksekusi per tick | Race condition muncul alami dari interleaving |
| 3 | `cores = 1` sebagai default | Interleaving jelas; robot "dibekukan" mudah divisualkan |
| 4 | Jam hanya di controller | Satu tempat mengatur waktu; engine tetap murni |
| 5 | Level sebagai data | Menambah level tanpa mengubah engine |
| 6 | Aset awal geometris | Kejelasan state lebih penting; hemat waktu |
| 7 | Tanpa library state management | Mengurangi beban belajar enam orang |
| 8 | Tanpa backend | Cukup untuk tugas; mudah dideploy dan didemokan |
