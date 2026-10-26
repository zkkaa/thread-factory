# ARCHITECTURE — Thread Factory: Pabrik Rebutan

> Dokumen ini menjawab **"bagaimana proyek dibangun"**. Untuk fitur dan level, lihat `PRD.md`. Untuk urutan kerja, lihat `TASKS.md`.
> Isi dokumen ini bersifat **aturan**: jika kode melanggarnya, kodenya yang diubah (atau dokumen ini diubah lewat diskusi tim).

## 1. Prinsip *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

1. **Engine adalah otak, Phaser adalah mata, React adalah tangan.** Logika hanya ada di engine; gambar hanya di Phaser; kontrol dan angka hanya di React.
2. **Deterministik.** Seed yang sama harus menghasilkan simulasi yang sama persis.
3. **Data-driven.** Level adalah data (konfigurasi), bukan kode khusus. Engine bersifat generik.
4. **Dapat diuji tanpa browser.** Seluruh `engine/` bisa dites dengan Vitest.
5. **Sederhana dulu.** Tidak ada library tambahan tanpa persetujuan tim.
6. **Tampilan adalah data presentasi.** Tata letak arena (posisi jalur, checkpoint, slot, papan) ada di `game/layouts/`, bukan di kode scene atau view; level baru cukup menambah data.
7. **Lapisan UI tidak memuat aturan permainan.** Penilaian (benar/salah, bintang) dihitung controller lewat `evaluateLevel`; layar, HUD, dan Phaser hanya menampilkan hasilnya.

## 2. Gambaran Tiga Lapisan *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
```
┌──────────────────────────────────────────────────────────────────────┐
│  Lapisan UI React (src/ui, src/App.tsx)                              │
│  AppShell (router layar) · Screens · HUD (overlay di atas kanvas)    │
│  MandorDialog · ResultDialog · Toolbox · Log · Metrik                │
└──────────┬───────────────────────────────────────▲───────────────────┘
      perintah                              state (snapshot, events, result)
           │                                       │
┌──────────▼───────────────────────────────────────┴───────────────────┐
│  SimulationController (src/controller) + evaluateLevel               │
│  jam tick · state: idle/running/paused/finished                      │
│  satu-satunya pemanggil engine.step()                                │
└──────────┬───────────────────────────────────────▲───────────────────┘
      step(), reset()                      snapshot + events
           │                                       │
┌──────────▼───────────────────────────────────────┴───────────────────┐
│  Simulation Engine (src/engine)  — TypeScript murni                  │
│  threads · scheduler · mutex · semaphore · condition · area          │
│  tanpa import phaser, react, DOM, Math.random, Date.now              │
└──────────────────────────────────────────────────────────────────────┘
                ▲ (hanya membaca snapshot/events dari controller)
┌───────────────┴──────────────────────────────────────────────────────┐
│  Renderer Phaser 3 (src/game)                                        │
│  LevelScene · views · layouts (data) · anchors/slots (fungsi murni)  │
│  meneruskan input pemain (menjatuhkan alat) ke controller            │
└──────────────────────────────────────────────────────────────────────┘
Samping: src/progress (progres, pengaturan, aturan buka-kunci; localStorage)
         src/levels (data level dan modul)   public/assets (aset)
```

Aturan ketergantungan (panah hanya boleh ke bawah/dalam):
- `engine/` **tidak mengimpor** apa pun dari `game/`, `ui/`, `controller/`, `progress/`, `phaser`, atau `react`.
- `controller/` hanya mengimpor `engine/` dan `levels/`.
- `progress/` hanya mengimpor tipe dari `levels/`; tidak mengimpor `react` atau `phaser` (penyimpanan disuntik, sehingga bisa dites di Node).
- `game/` dan `ui/` mengimpor `controller/` (dan tipe dari `engine/` dan `levels/`), tetapi **tidak saling mengimpor** komponen. Satu-satunya jembatan adalah `PhaserGame.tsx` yang memanggil `game/main.ts`. Komunikasi UI-Phaser yang bukan state simulasi memakai `EventBus`.
- `levels/` hanya berisi data dan tipe.
- **Input pemain di Phaser:** scene boleh meneruskan masukan pemain (menjatuhkan alat) ke `controller.placeTool/removeTool`. Scene tetap tidak boleh memutuskan benar/salah, menghitung metrik, atau menjalankan jam.

## 3. Struktur Folder *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
```
src/
├─ engine/
│  ├─ types.ts            # tipe inti: Instruction, ThreadDef, Snapshot, SimEvent
│  ├─ prng.ts             # pseudo-random berbasis seed (mulberry32)
│  ├─ engine.ts           # SimulationEngine: load, step, reset, getSnapshot
│  ├─ thread.ts           # state machine thread + eksekusi instruksi
│  ├─ scheduler.ts        # RandomSeeded, Scripted
│  ├─ tools.ts            # applyTools(): ubah rentang pengaman jadi instruksi (+ peta asal instruksi)
│  ├─ metrics.ts          # throughput, waktu tunggu, lost update, dst.
│  ├─ validateConfig.ts   # pemeriksaan EngineConfig saat load
│  ├─ primitives/         # mutex.ts, semaphore.ts, condition.ts, area.ts
│  ├─ deadlock.ts         # deteksi siklus tunggu (Modul 2)
│  └─ __tests__/          # tes Vitest untuk engine
├─ levels/
│  ├─ types.ts            # LevelDefinition, ModuleDefinition
│  ├─ modules.ts          # daftar modul (judul, deskripsi, konsep, urutan level)
│  ├─ module1/            # level-1-1.ts, level-1-2.ts, ...
│  ├─ module2/            # level-2-1.ts, ...
│  └─ index.ts            # daftar level
├─ controller/
│  ├─ SimulationController.ts
│  ├─ buildEngineConfig.ts
│  ├─ evaluateLevel.ts    # penilaian: lulus/gagal, metrik, bintang
│  ├─ clock.ts            # abstraksi jam frame
│  └─ CompareSession.ts   # dua controller berseed sama untuk mode Bandingkan
├─ progress/
│  ├─ storage.ts          # KeyValueStorage + pembungkus localStorage (try/catch)
│  ├─ progressStore.ts    # bintang per level, level selesai
│  ├─ settingsStore.ts    # volume, kurangi animasi, mode demo
│  └─ unlocks.ts          # aturan buka-kunci (fungsi murni)
├─ game/                  # Phaser
│  ├─ main.ts             # konfigurasi game (skala FIT, pixelArt)
│  ├─ registryKeys.ts     # kunci registry untuk controller
│  ├─ EventBus.ts         # event non-simulasi antara React dan Phaser
│  ├─ theme.ts            # warna state, ukuran ubin
│  ├─ assetManifest.ts    # daftar aset yang dimuat
│  ├─ layouts/            # ArenaLayout (data): types.ts, index.ts, level-1-1.layout.ts, ...
│  ├─ anchors.ts          # instruksi efektif -> titik visual (fungsi murni)
│  ├─ slots.ts            # slot terdekat, slot sah (fungsi murni)
│  ├─ doorPlacement.ts    # state machine pemasangan pintu masuk lalu keluar (murni)
│  ├─ scenes/             # Boot, Preloader, LevelScene (+ arena per jenis: loop, hall, belt, table)
│  └─ views/              # TrackView, CheckpointView, RobotView, BoardView, DoorView,
│                         # SlotMarkerView, TokenView, BufferView, TableView, ...
├─ ui/
│  ├─ AppShell.tsx        # merender layar aktif
│  ├─ screenState.ts      # state machine layar (murni)
│  ├─ screens/            # HomeScreen, ModeSelectScreen, ModuleIntroScreen, LevelMapScreen,
│  │                      # LevelIntroScreen, PlayScreen, ModuleCompleteScreen, GameCompleteScreen,
│  │                      # GuideScreen, SettingsScreen, SandboxScreen, CompareScreen
│  ├─ components/         # hud/ (kontrol, misi, toolbox, log, metrik, jeda), dialogs/ (MandorDialog,
│  │                      # ResultDialog), icons/ (SVG), Tooltip, IconButton
│  ├─ hooks/              # useSimulation, useEventLog, useProgress, useSettings
│  └─ toolSpans.ts, parseSeed.ts, eventLog.ts, hints.ts   # logika murni UI
├─ App.tsx · PhaserGame.tsx · main.tsx · index.css
public/assets/            # characters/, world/, ui/, audio/
docs/
├─ PRD.md · ARCHITECTURE.md · TASKS.md
├─ AI_USAGE.md            # catatan bagian yang dibantu AI (kewajiban tugas)
├─ ASSETS.md              # tabel aset: berkas, sumber, lisensi, status
└─ wireframe/             # gambar acuan layar dan arena
```

Catatan: komponen UI sementara (`ControlBar`, `Toolbox` klik-slot, `MetricsPanel`, `StepLog`, `ResultDialog` lama) tetap dipakai sampai pengganti HUD-nya stabil (TASKS U-064), lalu dihapus atau dipindahkan ke `components/hud/` dan `components/dialogs/`.

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
- **Pilihan `cores` per level (diubah):** `cores = 1` untuk level yang menekankan interleaving (Level 1-1). Dengan `cores = 1`, total tick tidak dipengaruhi besar kecilnya pintu mutex karena selalu ada robot yang bisa jalan; harga pengaman hanya tampak sebagai waktu tunggu. **Level 1-2 memakai `cores = 2`** supaya pintu yang terlalu besar membuat satu core menganggur dan total tick naik. **Level 1-3 memakai `cores` sama dengan jumlah robot (8)** supaya hanya kapasitas aula yang membatasi kecepatan.

### 4.5 Primitif sinkronisasi

| Primitif | Perilaku |
|---|---|
| `Mutex` | Punya `owner` dan antrean tunggu FIFO. `LOCK` pada mutex terpakai membuat thread `WAITING`. `UNLOCK` hanya oleh pemilik, lalu menyerahkan kepemilikan **langsung** ke thread terdepan (handoff): thread itu dibangunkan sebagai pemilik, instruksi `LOCK`-nya dianggap selesai, dan antrean FIFO terjaga. |
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

**Rentang dan slot *(baru)*:** `PlacedTool` berisi `spans` per robot dengan `start` dan `end` (indeks instruksi **asli**, inklusif). Di UI, rentang itu digambar sebagai pintu masuk di slot `start` dan pintu keluar di slot `end + 1` (program n instruksi punya n+1 slot, bernomor 0..n). `UNLOCK` selalu disisipkan sesudah `end`, jadi `LOCK` tidak pernah menjadi instruksi terakhir (`validateConfig` menolak program yang berakhir dengan `LOCK`).

**Peta asal instruksi *(baru, U-052)*:** renderer perlu tahu instruksi efektif ke-k berasal dari mana. `tools.ts` menyediakan
```ts
type InstructionOrigin =
  | { kind: 'original'; index: number }                          // instruksi asli ke-index
  | { kind: 'inserted'; op: 'LOCK' | 'UNLOCK'; slot: number };   // disisipkan alat, di slot tertentu
applyToolsDetailed(threads, placed): { threads: ThreadDef[]; origins: Record<ThreadId, InstructionOrigin[]> }
// applyTools() tetap ada dan hanya mengembalikan `threads`.
```
Peta ini dipakai `game/anchors.ts` untuk menentukan titik visual (checkpoint atau gerbang) tempat robot berada saat mengeksekusi instruksi tertentu.

### 4.7 Metrik (`metrics.ts`)

Dihitung dari event dan snapshot, bukan dari Phaser:
- `throughput` = pekerjaan selesai / tick
- `waitTicks` per thread (jumlah tick berstatus WAITING), rata-rata dan maksimum
- `lostUpdates` = (nilai yang seharusnya) − (nilai akhir), diukur lewat invariant level
- `utilization` mesin
- `deadlockCount`, dan `starvation` (waktu tunggu maksimum melebihi ambang)
- `busyWaitTicks` (Level 1-4)
- **`coreUtilization` *(baru, T-085)*:** instruksi yang dieksekusi / (`cores` x tick). `Snapshot` ditambah `cores` dan `executedInstructions` agar metrik bisa dihitung tanpa mengakses konfigurasi.
- **`overloadTicks` dan `areaUtilization` *(baru, T-041)*:** lihat bagian 4.9.

### 4.8 Deteksi deadlock (`deadlock.ts`)

Deadlock terdeteksi bila **tidak ada thread READY, tetapi belum semua TERMINATED**. Engine lalu membangun *wait-for graph* dan mencari siklus, kemudian memancarkan `DEADLOCK_DETECTED` dengan daftar thread dalam siklus (dipakai renderer untuk menggambar garis merah).

*Keadaan saat ini (sebelum T-055):* bila semua thread berstatus WAITING, engine berhenti dengan event `FINISHED` (bukan menunggu `maxTicks`), dan `evaluateLevel` menilai simulasi itu gagal dengan pesan "robot saling menunggu atau melewati batas tick". T-055 menambahkan `DEADLOCK_DETECTED` sebelum `FINISHED`.

### 4.9 Area berkapasitas (Level 1-3) *(baru, T-041)*

Aula mesin dimodelkan sebagai **area dengan kapasitas** yang dilindungi semaphore. Konflik didefinisikan sebagai **jumlah robot di dalam area melebihi kapasitas**, bukan "dua robot di satu mesin" (penugasan mesin tetap per robot membuat nilai optimal 3 tidak konsisten).

- `EngineConfig` ditambah `areas: Record<string, number>` (nama area ke kapasitas).
- Instruksi baru: `{ op: 'ENTER_AREA'; area: string }` dan `{ op: 'LEAVE_AREA'; area: string }`. Keduanya tidak memblokir; yang membatasi adalah semaphore (Kartu Akses) yang dipasang pemain di sekeliling area.
- Event baru: `AREA_ENTERED`, `AREA_LEFT`, `AREA_OVERLOAD` (dipancarkan pada tiap tick saat jumlah di dalam area melebihi kapasitas).
- Metrik: `overloadTicks` (jumlah tick dengan kelebihan kapasitas = bentrok) dan `areaUtilization` (rata-rata jumlah di dalam area dibagi kapasitas, dibatasi maksimal 1).
- Konsekuensi untuk level: nilai semaphore 3 menghasilkan utilisasi tertinggi tanpa bentrok; nilai lebih dari 3 bentrok; nilai kurang dari 3 membuat mesin menganggur. Level 1-3 memakai `cores = 8`.
- Instruksi baru wajib didokumentasikan di bagian 4.2 dan diberi tes (CLAUDE.md bagian 4 aturan 7).

### 4.10 Instruksi lain yang direncanakan
`PUT_ITEM`, `TAKE_ITEM` (Level 2-1), instruksi akses pembaca/penulis (Level 2-2), dan `ACQUIRE_FORK` (Level 2-3) ditambahkan saat levelnya dikerjakan, dengan prosedur di bagian 11.

## 5. Simulation Controller *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
Satu-satunya tempat yang memiliki **jam**, dan satu-satunya pemanggil `engine.step()`.

```ts
type RunState = 'idle' | 'running' | 'paused' | 'finished';
type Speed = 0.5 | 1 | 5;

interface ControllerState {
  level: LevelDefinition | null;
  runState: RunState;
  snapshot: Readonly<Snapshot> | null;
  events: readonly SimEvent[];     // semua event sejak notifikasi sebelumnya
  speed: Speed;
  seed: number;
  tools: readonly PlacedTool[];    // alat yang dipasang pemain (salinan)
  error: string | null;            // error engine; mengunci Run dan Step sampai Reset
  result: LevelResult | null;      // hanya terisi saat runState === 'finished'
}

class SimulationController {
  constructor(engine?: SimulationEngine, clock?: Clock);
  loadLevel(def: LevelDefinition, seed?: number): void;   // seed default: tutorialSeed
  placeTool(tool: PlacedTool): void;  removeTool(id: string): void;
  run(): void;  pause(): void;  step(): void;  reset(seed?: number): void;
  setSpeed(multiplier: Speed): void;
  getState(): ControllerState;
  subscribe(listener: (s: ControllerState) => void): () => void;
  dispose(): void;
}
```

Aturan perilaku:
- Laju dasar: `TICKS_PER_SECOND = 4` (satu konstanta), dikali kecepatan. Jam memakai akumulator waktu dengan `requestAnimationFrame` (lewat `Clock`, agar bisa dites dengan jam palsu); tiap kali akumulator melewati satu interval, panggil `engine.step()`. Selisih waktu antar frame dibatasi agar tab yang disembunyikan tidak memicu simulasi "ngebut".
- `step()` manual hanya berlaku saat `idle` atau `paused`, dan hanya bila `error === null`.
- Alat hanya boleh diubah saat `idle` (pemain harus Reset dulu setelah Run). Konfigurasi baru dimuat ke engine **sebelum** daftar alat disimpan, sehingga alat tidak valid tidak merusak state.
- **Error engine:** state menjadi `paused` dengan `error` terisi; Run dan Step ditolak sampai `reset()`.
- **Penilaian:** saat simulasi selesai, controller memanggil `evaluateLevel(level, snapshot)` dan menaruh hasilnya di `result`. Data level yang salah dilaporkan sebagai `error` tanpa mematikan jam.
- `buildEngineConfig(level, tools)` (murni) menerjemahkan `LevelDefinition` + alat pemain menjadi `EngineConfig` (termasuk `applyTools`).

**`evaluateLevel` (murni):** lulus bila semua thread TERMINATED **dan** `goal.invariant` terpenuhi. Bintang bertingkat: 1 bila benar; 2 bila tick <= `goal.stars.fast`; 3 bila total waitTicks <= `goal.stars.lowWait`. Bintang bernilai `null` (tidak dinilai) bila seed bukan `tutorialSeed` level. Metrik diambil dari `computeMetrics` memakai `goal.target`.

**Mode Bandingkan:** `CompareSession` memegang dua `SimulationController` (A dan B) dengan seed sama dan meneruskan perintah (run, pause, step, reset, setSpeed) ke keduanya. Karena keduanya memakai timestamp frame yang sama, akumulator waktunya berjalan seragam, jadi tick keduanya tetap serempak.

**Mencatat progres:** hook `useProgressRecorder(controller)` di lapisan UI mendengarkan controller; saat `result.ok` dan `result.stars !== null`, ia memanggil `progressStore.record(levelId, stars)` (menyimpan bintang terbaik). Controller sendiri tidak mengenal penyimpanan.

## 6. Visual Renderer (Phaser 3) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
**Tugas:** menggambar dan menganimasikan apa yang terjadi, serta meneruskan masukan pemain ke controller. **Bukan tugas:** memutuskan apa yang terjadi (benar/salah, bintang, metrik).

### 6.1 Struktur
- `LevelScene` dibuat dari data level dan **layout**: memilih arena menurut `layout.kind` (`loop`, `hall`, `belt`, `table`) dan membangun *view* dari snapshot awal.
- Tiap entitas punya kelas view sendiri (`TrackView`, `CheckpointView`, `RobotView`, `BoardView`, `DoorView`, `SlotMarkerView`, `TokenView`, `BufferView`, `TableView`, ...). Mengganti placeholder menjadi sprite hanya mengubah isi kelas view.
- Menerima `events` dari controller lalu menjalankan tween. Durasi tween = `tickInterval / speed`, sehingga animasi selesai sebelum tick berikutnya.
- Saat `reset` atau alat berubah (tick 0), scene membuang dan membangun ulang view dari snapshot.
- Ukuran dan warna ditaruh di `theme.ts`; posisi arena di `layouts/`. **Tidak ada koordinat yang di-hardcode di scene atau view.**
- Warna state selalu dipasangkan dengan label atau ikon.

### 6.2 Layout sebagai data (`game/layouts/`)
```ts
interface Point { x: number; y: number }

interface LoopLayout {
  kind: 'loop';
  id: string;                        // sama dengan LevelDefinition.layoutId
  path: Point[];                     // titik kontrol jalan melengkung (satu putaran), searah gerak
  checkpoints: number[];             // posisi tiap checkpoint sebagai fraksi panjang jalan (0..1), urut program asli
  slots: number[];                   // n+1 posisi slot (fraksi); slot k berada sebelum checkpoint k
  laneOffsets: Point[];              // geseran jalur sejajar per robot
  board: { x: number; y: number; width: number; height: number };
  boardLinks: { checkpoint: number; direction: 'read' | 'write' }[];
}
// HallLayout, BeltLayout, TableLayout didefinisikan saat level-level itu dikerjakan.
type ArenaLayout = LoopLayout | HallLayout | BeltLayout | TableLayout;
```
Tes validasi layout (wajib): jumlah checkpoint sama dengan panjang program asli, jumlah slot sama dengan n+1, urutan fraksi menaik, semua koordinat berada di dalam kanvas (`ARENA`).

### 6.3 Jangkar visual (`game/anchors.ts`, murni)
Event `INSTRUCTION` membawa indeks pada program **efektif** (sudah berisi `LOCK`/`UNLOCK`). `computeAnchors(origins, layout)` memakai peta asal dari `applyToolsDetailed` (bagian 4.6) untuk memetakan tiap indeks efektif ke titik visual: instruksi asli ke **checkpoint** ke-i, `LOCK`/`UNLOCK` yang disisipkan ke **gerbang** di slot terkait. Robot yang menunggu `LOCK` berhenti di gerbang (di depan pintu).

### 6.4 Gerak robot
Robot bergerak sepanjang `Phaser.Curves.Path` antara dua jangkar berurutan. Posisi dinyatakan sebagai fraksi jalan; melewati ujung berarti memasuki putaran berikutnya (penghitung "Produk x/y"). Bila satu notifikasi memuat beberapa tick (kecepatan tinggi), yang dipakai adalah jangkar terakhir tiap robot. Detail API Phaser 3.90.0 (Path, PathFollower, tween) dicek di dokumentasi versi terpasang saat implementasi.

### 6.5 Pemasangan alat dengan seret-lepas
1. Toolbox (React) memakai HTML5 Drag and Drop. Selama seret, React memancarkan lewat `EventBus`: `tool-drag-start` (jenis alat), `tool-drag-move` (koordinat halaman), `tool-drop` (koordinat halaman), dan `tool-drag-end`.
2. `LevelScene` mengubah koordinat halaman menjadi koordinat game (`scale.transformX/Y`), mencari slot terdekat dengan `slots.ts` (`nearestSlot`, batas jarak tertentu), dan menyorot slot yang sah.
3. `doorPlacement.ts` (state machine murni): `idle → placingEntry → placingExit → done`. Setelah pintu masuk dipasang di slot `s`, hanya slot `e > s` yang sah untuk pintu keluar. `done` menghasilkan `ToolSpan` dengan `start = s`, `end = e - 1` untuk **semua robot di loop itu**.
4. Scene memanggil `controller.placeTool(...)` (atau `removeTool`). Controller memuat ulang konfigurasi dan memancarkan tick 0, sehingga scene membangun ulang view.
5. Memindahkan pintu: seret pintu terpasang ke slot lain (lepas lalu pasang ulang secara atomik). Menghapus: seret ke area **Hapus** (React) atau tombol "Lepas".
6. **Mode klik:** pemilihan alat di toolbox lalu klik slot masuk dan slot keluar, memakai logika `doorPlacement` yang sama.

### 6.6 Visual pendukung pembelajaran
Catatan di tangan robot (isi `registers` dari snapshot), badge waktu tunggu (`waitTicks`), penghitung putaran (`iteration`), efek Si Penjadwal (RUNNING menyala, READY dibekukan), antrean di depan pintu (`MutexSnapshot.queue`), dan tooltip penjelas pada checkpoint.

## 7. Control Panel (React + Tailwind) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
### 7.1 Router layar
- `ui/screenState.ts` adalah state machine murni untuk layar aktif: `home`, `mode`, `moduleIntro`, `levelMap`, `levelIntro`, `play`, `moduleComplete`, `gameComplete`, `guide`, `settings`, `sandbox`, `compare`, ditambah tumpukan riwayat untuk tombol kembali. Tidak memakai library router.
- `AppShell` merender layar aktif dan menyediakan controller, store progres, dan store pengaturan lewat props atau hook.

### 7.2 PlayScreen dan HUD
- `PlayScreen` memasang `PhaserGame` (kanvas memenuhi layar, skala FIT) dan menumpuk HUD React di atasnya dengan posisi tetap (PRD bagian 17.1).
- Komponen HUD: kontrol (toggle Play/Pause, Step, Reset, chip kecepatan, chip seed, chip status dengan tick), chip Misi, toolbox bawah, log kejadian, laci metrik, tombol Tanya Pak Mandor, menu jeda, legenda status, panel error.
- Dialog: `MandorDialog` (potret, gelembung, halaman, Lanjut/Lewati) dan `ResultDialog` (Pak Mandor, kartu angka, bintang, tombol).

### 7.3 Aturan umum
- Hook `useSimulation()` memakai `useSyncExternalStore` untuk berlangganan ke controller; `useEventLog`, `useProgress`, dan `useSettings` serupa. Tidak ada library state management.
- Tailwind **hanya** untuk UI React, bukan untuk isi arena Phaser.
- Komponen React **tidak memanggil Phaser langsung**. Ia memanggil controller; hal non-simulasi (seret alat, tooltip) memakai `EventBus`.
- **Ikon SVG dibuat sendiri** (`components/icons/`), tooltip dibuat sendiri (`Tooltip`); setiap `IconButton` wajib punya `aria-label`. Grafik di mode Bandingkan berupa batang SVG buatan sendiri.
- Teks UI berbahasa Indonesia (istilah teknis OS tetap bahasa Inggris). Pengaturan "kurangi animasi" dibaca dari `useSettings` oleh komponen dan oleh scene (lewat `EventBus` atau registry).
- Logika yang dapat dipisah dari tampilan ditaruh di berkas murni (`toolSpans.ts`, `parseSeed.ts`, `eventLog.ts`, `hints.ts`, `screenState.ts`) dan dites di Vitest.

## 8. Alur Data *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
**Simulasi:**
```
Pemain klik "Run"
  → HUD memanggil controller.run()
  → controller memulai jam; tiap interval: engine.step() → { events, snapshot }
  → controller memancarkan state ke subscriber
      ├─ LevelScene (Phaser): memutar tween dari events, memperbarui robot, papan, pintu
      └─ React: memperbarui HUD, log, metrik dari snapshot
  → engine memancarkan FINISHED → controller berstatus 'finished' dan mengisi result (evaluateLevel)
  → ResultDialog menampilkan hasil, bintang, dan penjelasan; useProgressRecorder menyimpan bintang
```

**Pemasangan alat:**
```
Pemain menyeret Pintu Mutex dari toolbox
  → React memancarkan tool-drag-* / tool-drop lewat EventBus
  → LevelScene: koordinat → slot terdekat; doorPlacement menentukan pintu masuk lalu keluar
  → LevelScene memanggil controller.placeTool(tool)
  → controller memuat ulang engine (tick 0) dan memancarkan state
  → LevelScene membangun ulang view; HUD memperbarui daftar alat
```

**Navigasi dan progres:**
```
AppShell (screenState) → layar aktif
Level selesai → useProgressRecorder → progressStore.record → localStorage
Peta Level / Pilih Mode membaca progressStore + unlocks untuk status kunci dan bintang
```

**Petunjuk:** jumlah kegagalan per level dihitung dalam sesi (state UI); `hints.ts` memilih petunjuk berikutnya dari `level.hints` dan menawarkannya setelah 2 kegagalan.

## 9. Format Level (sketsa) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
```ts
export type MandorMood = 'netral' | 'senang' | 'sedih' | 'berpikir';
export interface IntroPage { text: string; mood?: MandorMood }

export interface LevelDefinition {
  id: string;                          // '1-1'
  module: 1 | 2;
  title: string;                       // 'Bug Papan Stok'
  intro: IntroPage[];                  // diubah: sebelumnya string; kini 2-3 halaman dialog Pak Mandor
  hints: string[];                     // baru: petunjuk bertahap (samar sampai jelas)
  concepts: string[];                  // baru: konsep yang dipelajari (Layar Tamat)
  explanation?: { pass: string; fail: string };   // penjelasan di popup hasil
  layoutId: string;                    // baru: kunci ke game/layouts
  threads: ThreadDef[];
  sharedVars: Record<string, number>;
  resources: ResourceDef[];            // mutex, semaphore, condition, buffer, area, dst.
  availableTools: ToolType[];          // alat yang boleh dipakai pemain
  scheduler: { kind: 'random' | 'scripted'; cores: number; script?: ThreadId[] };
  tutorialSeed?: number;               // seed yang pasti memunculkan masalah; satu-satunya seed berbintang
  maxTicks?: number;
  sandbox?: ParameterDef[];            // baru: parameter yang boleh diubah di Sandbox
  goal: {
    target: { variable: string; value: number };
    invariant: (snap: Snapshot) => { ok: boolean; message: string };
    stars: { fast: number; lowWait: number };   // batas tick dan total waktu tunggu
  };
}

export interface ModuleDefinition {    // baru: levels/modules.ts
  id: 1 | 2;
  title: string;                       // 'Modul 1'
  subtitle: string;                    // 'Sinkronisasi Dasar'
  description: string;
  concepts: string[];
  levelIds: string[];                  // urutan level
}
```

Catatan:
- Koordinat arena **tidak** ada di data level; level hanya menyebut `layoutId`.
- Migrasi `intro: string` menjadi `IntroPage[]` dikerjakan di TASKS U-039 dan menyentuh `level-1-1.ts` serta kode yang membaca `intro`.
- `ParameterDef` (kunci, label, minimum, maksimum, nilai awal) dirinci di T-105 (Sandbox).

## 10. Strategi Pengujian (Vitest) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
Tes wajib untuk `engine/`:
1. **Determinisme:** seed sama → urutan event identik.
2. **Level 1-1 tanpa mutex:** pada `tutorialSeed`, nilai akhir ≠ target.
3. **Level 1-1 dengan mutex:** nilai akhir = target pada banyak seed (mis. 1.000 seed).
4. **Primitif:** mutex tidak pernah dimiliki dua thread; semaphore tidak negatif secara permanen; antrean FIFO; area berkapasitas menghitung kelebihan dengan benar.
5. **`applyTools` dan peta asal instruksi:** LOCK dan UNLOCK seimbang, input tidak termutasi, setiap instruksi efektif punya asal.
6. **Deadlock (Modul 2):** Dining Philosophers tanpa strategi terdeteksi deadlock; dengan tiap strategi tidak deadlock.
7. **Metrik baru:** `coreUtilization`, `areaUtilization`, `overloadTicks`.

Tes wajib di luar engine *(baru)*:
8. **Controller:** `evaluateLevel` (lulus/gagal, bintang bertingkat, seed non-tutorial), kunci error, pembersihan `result`, `CompareSession` serempak.
9. **Progres:** `progressStore`, `settingsStore`, `unlocks` dengan penyimpanan palsu (data rusak, penyimpanan penuh atau nonaktif, migrasi versi).
10. **Logika murni UI dan game:** `screenState`, `hints`, `eventLog`, `toolSpans`, `parseSeed`, `anchors`, `slots`, `doorPlacement`.
11. **Layout:** validasi tiap `ArenaLayout` terhadap level (jumlah checkpoint, slot, batas kanvas); manifest aset: semua berkas yang disebut ada di `public/assets/`.
12. **Render UI:** komponen dirender dengan `react-dom/server` pada tiap keadaan penting (idle, error, selesai, terkunci); memeriksa teks, atribut `disabled`, dan `aria-label`.

Yang diuji manual (checklist di TASKS): tampilan Phaser (gerak, efek, skala), seret-lepas, tooltip, animasi, suara, dan alur penuh Beranda sampai Tamat Game.

## 11. Cara Menambah Level atau Primitif *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
**Level baru:**
1. Buat `levels/moduleN/level-X-Y.ts` yang mengekspor `LevelDefinition` (termasuk `intro`, `hints`, `concepts`, `explanation`, `layoutId`, ambang bintang, `tutorialSeed`).
2. Daftarkan di `levels/index.ts` dan di `levelIds` modulnya (`levels/modules.ts`).
3. Buat layout `game/layouts/level-X-Y.layout.ts` dan daftarkan di `layouts/index.ts`; tambahkan tes validasinya.
4. Tulis tes engine untuk level itu (kondisi gagal dan kondisi menang) dan tes `evaluateLevel` bila ada ambang khusus.
5. Tambahkan view baru di `game/views/` **hanya jika** ada entitas visual baru; tambahkan aset ke `public/assets/`, `assetManifest.ts`, dan `docs/ASSETS.md`.
6. Isi teks Pak Mandor (intro, petunjuk, penjelasan) dan periksa kebenaran konsepnya.

**Instruksi atau primitif baru:**
1. Tambahkan tipe di `engine/types.ts` dan dokumentasikan di bagian 4.2 atau 4.9.
2. Implementasikan di `engine/` beserta tes.
3. Tambahkan event baru (jika perlu), tangani di `eventLog.ts` (pernyataan `assertNever` memaksa semua event ditangani), dan view-nya di Phaser.

## 12. Konvensi Kode *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
- TypeScript `strict: true`; **tanpa `any`**.
- Fungsi engine sebisa mungkin murni; mutasi state hanya di dalam kelas engine.
- Nama berkas: `camelCase.ts` untuk modul, `PascalCase.ts(x)` untuk kelas dan komponen.
- Identifier dalam bahasa Inggris; komentar, pesan UI, dan dokumen dalam bahasa Indonesia.
- Satu berkas, satu tanggung jawab; hindari berkas lebih dari sekitar 300 baris.
- **Pemformatan:** indentasi 2 spasi, diatur Prettier dan `.editorconfig` (TASKS U-002); seluruh berkas, termasuk `game/` yang berasal dari template (4 spasi), diformat ulang sekali.
- **Tanpa koordinat atau angka tata letak yang di-hardcode** di scene dan view; semuanya dari `layouts/` dan `theme.ts`.
- **Tombol ikon** wajib `aria-label` dan tooltip; teks UI baru wajib berbahasa Indonesia.
- Setiap aset baru dicatat di `docs/ASSETS.md` dan README Kredit; aset hasil generator juga di `docs/AI_USAGE.md`.

## 13. Catatan Keputusan Arsitektur (ADR singkat) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

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
| 9 | HUD dan layar sebagai overlay React di atas kanvas Phaser | Teks, tooltip, dan aksesibilitas lebih mudah; Phaser fokus ke arena |
| 10 | Tata letak arena sebagai data (`game/layouts/`) | Level baru murah; bisa divalidasi lewat tes |
| 11 | Robot berprogram identik berbagi satu loop | Satu pintu satu kunci sesuai konsep mutex; antrean terlihat; satu putaran = satu pengulangan |
| 12 | Pintu mutex = pintu masuk + pintu keluar di slot (n+1 slot) | Memetakan `LOCK`/`UNLOCK` secara langsung ke objek yang bisa diseret |
| 13 | Router layar buatan sendiri (state machine murni) | Tanpa dependency baru; mudah dites |
| 14 | Progres di `localStorage` lewat store dengan penyimpanan yang disuntik | Dapat dites di Node; tahan terhadap penyimpanan nonaktif |
| 15 | Penilaian di controller (`evaluateLevel`); bintang hanya pada seed tutorial | Satu sumber kebenaran; adil bagi semua pemain |
| 16 | Level 1-2 memakai 2 core; Level 1-3 memakai cores = jumlah robot | Agar harga pengaman dan kapasitas aula benar-benar terlihat pada metrik |
| 17 | Aset Kenney untuk dunia permainan; potret generator hanya di lapisan UI | Keseragaman gaya; lisensi dan pelaporan AI tercatat |
| 18 | Seret-lepas lewat HTML5 DnD + `EventBus`; scene meneruskan ke controller | Mematuhi aturan lapisan; mode klik sebagai alternatif |
| 19 | Konflik Level 1-3 = jumlah robot di area melebihi kapasitas | Nilai optimal 3 konsisten, tidak bergantung penugasan mesin |

## 14. Penyimpanan Progres dan Pengaturan *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
```ts
interface KeyValueStorage {                 // diimplementasikan localStorage, atau memori untuk tes
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface ProgressData {
  version: 1;
  levels: Record<string, { bestStars: 0 | 1 | 2 | 3; cleared: boolean }>;
}
interface SettingsData {
  version: 1;
  volume: number;          // 0..1
  reduceMotion: boolean;
  demoMode: boolean;       // membuka semua level
}
```
- Kunci: `threadfactory:progress:v1` dan `threadfactory:settings:v1`.
- Semua akses dibungkus try/catch; data rusak atau versi tidak dikenal menghasilkan nilai awal; kegagalan menyimpan (penyimpanan penuh atau nonaktif) diabaikan dan game tetap berjalan dengan state di memori.
- `unlocks.ts` (murni): `isLevelUnlocked`, `isModuleUnlocked` (Modul 2 setelah Level 1-4 selesai), `isSandboxUnlocked` (setelah level kampanyenya selesai); `demoMode` membuka semuanya.
- `record(levelId, stars)` menyimpan bintang terbaik dan menandai level selesai; `reset()` menghapus progres (dengan konfirmasi di UI).

## 15. Aset dan Pemuatan *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
- Struktur: `public/assets/characters/`, `world/`, `ui/`, `audio/`. Penamaan huruf kecil dengan tanda hubung (mis. `mandor-senang.png`).
- `game/assetManifest.ts` mendaftar kunci dan jalur tiap aset; `Preloader` memuatnya. Tes memastikan semua berkas yang disebut manifest ada.
- Konfigurasi Phaser memakai `pixelArt: true` (nearest-neighbor); ubin dunia 16x16 diskalakan 4x menjadi 64 px (`TILE_SIZE`).
- **Placeholder wajib:** setiap view tetap dapat menggambar bentuk geometris bila tekstur belum ada, sehingga pengembangan tidak menunggu aset.
- Potret Pak Mandor hanya dipakai di lapisan UI (React), bukan di kanvas Phaser.
- Ukuran total aset dijaga ringan (target di bawah sekitar 15 MB) agar build dan demo offline tetap cepat.
- Sumber, lisensi, dan status tiap aset ada di `docs/ASSETS.md` dan README Kredit.

## 16. Riwayat Perubahan *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
| Tanggal | Perubahan |
|---|---|
| Okt 2026 (awal) | Draf awal arsitektur tiga lapisan |
| 26 Okt 2026 | Lapisan UI berlayar dan HUD overlay; layout arena sebagai data; pintu masuk/keluar dan slot; peta asal instruksi; area berkapasitas (Level 1-3); `cores` per level; penilaian di controller; progres dan pengaturan; aset dan pemuatan; folder `progress/`; tambahan tes |
