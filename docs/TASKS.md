# TASKS — Thread Factory: Pabrik Rebutan

> Checklist pengerjaan bertahap. Rujukan: `PRD.md` (apa) dan `ARCHITECTURE.md` (bagaimana).
> **Cara pakai:** satu tugas = satu branch = satu sesi AI. Sebut ID tugas (mis. `T-021` atau `U-031`) saat meminta bantuan. Centang `[x]` setelah memenuhi *Definition of Done* di `CLAUDE.md`.
> **Prioritas:** `P0` MVP · `P1` wajib · `P2` bonus (tetap dikerjakan; prioritas hanya menentukan urutan).
> **ID tugas:** `T-xxx` = engine, level, mode, dokumentasi. `U-xxx` = tampilan (layar, HUD, arena, aset), ditambahkan pada revisi 26 Okt 2026 *(baru, sesuai kesepakatan akhir)*. Tugas T lama yang berubah ditandai *(diubah)*; tugas baru ditandai *(baru)*.
> **Kesepakatan:** tidak ada tugas atau fitur yang dikorbankan.

## Peta Waktu *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

Hari ini Senin 26 Okt 2026. Ujian 30 Nov sampai 5 Des 2026. Pengumpulan **H-2 sebelum presentasi**; dengan asumsi paling awal presentasi Senin 30 Nov, pengumpulan **Sabtu 28 Nov 2026**. Jadwal presentasi pasti dicatat di U-006; bila lebih lambat, tanggal pengumpulan ikut bergeser tetapi feature freeze tidak.

| Minggu | Tanggal | Target |
|---|---|---|
| 1 | 26 Okt sampai 1 Nov | Selesaikan M1 (build produksi, tes bersih). Fase U0 (kesepakatan desain dan perbaikan teknis), U1 (kerangka layar, penyimpanan), U2 (HUD dan dialog Pak Mandor, masih placeholder). Jalur engine mulai Level 1-2 |
| 2 | 2 sampai 8 Nov | Fase U3 (arena Level 1-1: loop, checkpoint, seret-lepas) dan U4 (aset). **Milestone M2:** Level 1-1 tampil lengkap dengan UI baru. Engine Level 1-3 dan 1-4 |
| 3 | 9 sampai 15 Nov | Arena dan konten Level 1-2 sampai 1-5. Engine Modul 2 (2-1, 2-2, 2-3). **Milestone M3:** Modul 1 lengkap dengan tampilan baru |
| 4 | 16 sampai 22 Nov | Arena dan konten Modul 2, Sandbox, Bandingkan, layar tamat, audio. **Milestone M4: feature freeze Jumat 20 Nov** |
| 5 | 23 sampai 28 Nov | Uji menyeluruh, perbaikan bug saja, laporan, video, slide, cadangan demo. **Milestone M5: pengumpulan Sabtu 28 Nov** |
| Ujian | 30 Nov sampai 5 Des | Presentasi dan demo |

> **Aturan bila terlambat:** tidak ada yang dikorbankan secara otomatis. Di akhir tiap minggu (M1 sampai M4) tim memeriksa; bila tertinggal lebih dari 2 hari dari tabel di atas, tim memutuskan bersama apa yang digeser. **Jangan mengorbankan stabilitas demo.** Setelah feature freeze (20 Nov), hanya perbaikan bug dan dokumentasi.

### Jalur kerja paralel (6 anggota)
Tiap jalur punya satu penanggung jawab (isi nama di tabel). Satu tugas tetap satu branch; merge sering.

| Jalur | Isi | Tugas utama | Penanggung jawab |
|---|---|---|---|
| A. Engine dan Level Modul 1 | Engine, level 1-2 sampai 1-5, alat baru | T-037 sampai T-047, T-085, T-088, T-091 | ____ |
| B. Engine dan Level Modul 2 | Producer-Consumer, Readers-Writers, Dining Philosophers | T-048 sampai T-061, T-098 | ____ |
| C. Layar dan HUD (React) | Router layar, penyimpanan, layar, HUD, dialog | U-010 sampai U-042, T-105, T-106 | ____ |
| D. Arena (Phaser) | Layout, views, gerak robot, seret-lepas, layout tiap level | U-050 sampai U-064, T-086, T-089, T-092, T-094, T-096, T-099, T-101, T-103 | ____ |
| E. Aset dan Konten | Aset Kenney, potret Pak Mandor, teks tiap level, audio | U-070 sampai U-077, T-067, T-087, T-090, T-093, T-095, T-097, T-100, T-102, T-104 | ____ |
| F. Integrasi, QA, Dokumentasi | Dokumen, uji, laporan, video, slide, pengumpulan | U-001 sampai U-006, Fase 9 dan 10 | ____ |

Ketergantungan kritis: U-039 (`LevelDefinition` baru) mendahului dialog dan konten level; U-052 (`applyToolsDetailed`) mendahului jangkar arena; U-050 (tipe layout) mendahului semua view arena; U-011 (progres) mendahului Peta Level; T-088 (alat semaphore) mendahului Level 1-3 dan 2-1.

---

## Fase 0 — Setup Proyek (Minggu 1)

- [x] **T-001** `P0` Buat repo GitHub/GitLab (publik atau akses dosen), undang semua anggota, atur branch utama dan proteksi dasar.
- [x] **T-002** `P0` Inisialisasi dari template `phaserjs/template-react-ts`; pastikan `npm run dev` jalan.
- [x] **T-003** `P0` Tambah Tailwind CSS untuk UI React; pastikan tidak mengganggu arena Phaser.
- [x] **T-004** `P0` Tambah Vitest; satu tes contoh lulus.
- [x] **T-005** `P0` Konfigurasi ESLint, Prettier, dan `typecheck` (strict TS, tanpa `any`); tambahkan skrip di `package.json`.
- [x] **T-006** `P0` Buat struktur folder sesuai `ARCHITECTURE.md` bagian 3 (folder kosong boleh berisi `.gitkeep`).
- [x] **T-007** `P0` Masukkan `PRD.md`, `ARCHITECTURE.md`, `TASKS.md` ke `docs/`, `CLAUDE.md` ke akar repo, dan buat `docs/AI_USAGE.md`.
- [x] **T-008** `P0` Kunci versi dependency di `package.json`; isi daftar versi di `CLAUDE.md`.
- [x] **T-009** `P1` README awal: deskripsi, cara instalasi dan menjalankan, anggota tim, bagian "Kredit" (kosong dulu).
- [x] **T-010** `P1` Siapkan deploy situs statis (GitHub Pages atau Vercel) agar tiap merge bisa dilihat online.

## Fase 1 — Engine Inti (Minggu 1)

- [x] **T-011** `P0` `engine/types.ts`: `ThreadState`, `Instruction`, `ThreadDef`, `Snapshot`, `SimEvent`, `StepResult`.
- [x] **T-012** `P0` `engine/prng.ts`: PRNG berbasis seed (mulberry32) + tes determinisme.
- [x] **T-013** `P0` State machine thread (NEW/READY/RUNNING/WAITING/TERMINATED) + eksekusi instruksi `WORK`, `READ`, `COMPUTE`, `WRITE`.
- [x] **T-014** `P0` `engine/scheduler.ts`: `RandomSeeded` dan `Scripted`, mendukung parameter `cores`.
- [x] **T-015** `P0` `engine/engine.ts`: `load`, `step`, `reset`, `getSnapshot`, `isFinished`; pancarkan event per tick.
- [x] **T-016** `P0` `engine/metrics.ts`: throughput, `waitTicks`, `lostUpdates`.
- [x] **T-017** `P0` Tes: simulasi dua thread tanpa pengaman menghasilkan *lost update* pada seed tertentu; hasil identik pada seed sama.

## Fase 2 — Mutex dan Alat Pemain (Minggu 1)

- [x] **T-018** `P0` `primitives/mutex.ts`: `LOCK`/`UNLOCK`, pemilik, antrean FIFO, thread menunggu berstatus WAITING.
- [x] **T-019** `P0` `engine/tools.ts`: `applyTools()` mengubah rentang pengaman menjadi `LOCK`/`UNLOCK` (fungsi murni).
- [x] **T-020** `P0` Tes mutex: tidak pernah dimiliki dua thread; `UNLOCK` oleh non-pemilik menghasilkan error jelas.
- [x] **T-021** `P0` Tes Level 1-1 dengan mutex: nilai akhir = target pada banyak seed (mis. 1.000).

## Fase 3 — Level 1-1 sebagai Data dan Controller (Minggu 1)

- [x] **T-022** `P0` `levels/types.ts` (`LevelDefinition`) dan `levels/module1/level-1-1.ts` (dua robot, 5 produk masing-masing, target 10).
- [x] **T-023** `P0` Tentukan `tutorialSeed` atau `Scripted` yang **pasti** memunculkan race condition; tulis tesnya.
- [x] **T-024** `P0` `controller/SimulationController.ts`: state `idle/running/paused/finished`, jam tick (akumulator `requestAnimationFrame`), `run/pause/step/reset/setSpeed`, `subscribe`.
- [x] **T-025** `P0` Controller: `placeTool`/`removeTool`; alat terkunci saat simulasi berjalan.

## Fase 4 — Renderer Minimal Phaser (Minggu 1)

- [x] **T-026** `P0` `game/theme.ts` (warna state, ukuran ubin) dan `LevelScene` yang membangun view dari snapshot awal.
- [x] **T-027** `P0` `RobotView` (kotak berwarna + label sesuai state) dan `BoardView` (menampilkan nilai Papan Stok).
- [x] **T-028** `P0` Animasi: robot bergerak per ubin mengikuti event; durasi tween = `tickInterval / speed`.
- [x] **T-029** `P0` `DoorView` (pintu mutex) di slot yang tersedia; tampilan robot menunggu di depan pintu.
- [x] **T-030** `P0` Reset membangun ulang view dari snapshot.

## Fase 5 — Control Panel React (Minggu 1)

- [x] **T-031** `P0` `useSimulation()` dengan `useSyncExternalStore`.
- [x] **T-032** `P0` `ControlBar`: Run, Pause, Step, Reset, pilihan kecepatan, input seed.
- [x] **T-033** `P0` `Toolbox` + interaksi klik slot untuk memasang/melepas mutex.
- [x] **T-034** `P0` `MetricsPanel`: nilai akhir, lost updates, waktu tunggu per robot.
- [x] **T-035** `P0` `ResultDialog`: "Seharusnya 10, hasilnya X", status benar/salah, penjelasan singkat konsepnya.
- [x] **T-036** `P1` `StepLog`: daftar event terakhir (membantu penjelasan saat demo).

## Milestone M1 — MVP Level 1-1 (akhir Minggu 1)

Centang semuanya sebelum lanjut ke fase berikutnya:
- [ ] Run, Pause, Step, Reset berfungsi.
- [ ] Input seed dan kecepatan berfungsi.
- [ ] Tanpa mutex: hasil salah dan terlihat jelas.
- [ ] Pemasangan mutex lewat klik slot; hasil benar setelahnya.
- [ ] Panel hasil menampilkan nilai akhir, pembaruan hilang, waktu tunggu.
- [ ] Semua tes Vitest lulus; `typecheck` dan `lint` bersih.
- [ ] Build produksi berjalan dan bisa dibuka dari situs statis.
- [ ] Seluruh anggota bisa menjelaskan alur data engine → controller → Phaser/React.

> Dua butir terakhir (build produksi dan penjelasan alur data) dikerjakan paralel dengan Fase U; target selesai 1 Nov 2026.

---

## Fase U0 — Kesepakatan Desain dan Perbaikan Teknis (26 sampai 28 Okt) *(baru)*

- [x] **U-001** `P0` Pasang dokumen revisi (`PRD.md`, `ARCHITECTURE.md`, `TASKS.md` ke `docs/`; `CLAUDE.md` ke akar). Pastikan `docs/` **tidak** diabaikan git (`git ls-files docs` tidak kosong; hapus `docs/` dari `.gitignore` dan `git add docs` bila perlu). Commit `docs: revisi PRD, ARCHITECTURE, TASKS, CLAUDE sesuai kesepakatan akhir`.
- [x] **U-002** `P0` Perbaikan teknis dari review: ganti nama `level1-1Mutext.test.ts` menjadi `level1-1Mutex.test.ts`; pasang Prettier (T-005 meminta, belum terpasang) dan `.editorconfig` 2 spasi; tambah skrip `format` dan `format:check`; format ulang seluruh `src/` sekali dalam satu commit terpisah (`refactor: format`). Minta persetujuan tim untuk menambah dev dependency Prettier. *Selesai bila:* `typecheck`, `lint`, `test` hijau dan `game/` berindentasi 2 spasi.
- [ ] **U-003** `P0` Lengkapi `docs/AI_USAGE.md` untuk seluruh tugas T-011 sampai T-036 dan perubahan setelahnya (satu baris per tugas: tanggal, ID, berkas, peran AI, peninjau).
- [x] **U-004** `P0` Wireframe final: satu gambar per layar S1 sampai S13 (PRD bagian 16) dan satu gambar arena Level 1-1 yang menunjukkan jalan melengkung, posisi 4 checkpoint, 5 slot, papan tengah, dan gerbang. Simpan di `docs/wireframe/`. Disetujui tim sebelum U-050.
- [x] **U-005** `P0` Buat `docs/ASSETS.md`: tabel aset (nama berkas, kegunaan, ukuran, sumber, lisensi, status) dari PRD bagian 18.5, dan siapkan folder `public/assets/{characters,world,ui,audio}/`.
- [ ] **U-006** `P1` Pastikan jadwal presentasi kelompok dari dosen atau kalender akademik; catat tanggalnya di bagian atas berkas ini dan hitung ulang tanggal pengumpulan (H-2).
- [x] **U-007** `P1` Sepakati palet warna dan gaya bingkai UI (navy, kuning, oranye seperti mockup), simpan sebagai token di `ui/` (variabel CSS atau konstanta Tailwind) dan `game/theme.ts`.

---

## Fase U1 — Kerangka Aplikasi, Penyimpanan, dan Layar (27 Okt sampai 1 Nov) *(baru)*

- [x] **U-010** `P0` `levels/modules.ts` (`ModuleDefinition`: id, judul, subjudul, deskripsi, konsep, `levelIds`) dan urutan level di `levels/index.ts`. Tes: semua `levelIds` ada di daftar level, tiap level termasuk tepat satu modul.
- [x] **U-011** `P0` `progress/storage.ts` dan `progress/progressStore.ts` (bintang terbaik per level, level selesai, `record`, `reset`) dengan `KeyValueStorage` yang disuntik. Semua akses try/catch; data rusak atau versi asing menghasilkan nilai awal. Tes: penyimpanan palsu, data rusak, penyimpanan penuh atau nonaktif, bintang hanya naik.
- [x] **U-012** `P0` `progress/unlocks.ts` (fungsi murni): level terbuka bila level sebelumnya selesai; Modul 2 terbuka setelah Level 1-4 selesai; Sandbox dan Bandingkan per level terbuka setelah level kampanyenya selesai; `demoMode` membuka semua. Tes tiap aturan.
- [x] **U-013** `P0` `progress/settingsStore.ts` (volume, kurangi animasi, mode demo) dengan tes serupa U-011.
- [x] **U-014** `P0` `ui/screenState.ts` (state machine layar murni + tumpukan kembali) dan `ui/AppShell.tsx`. Tanpa library router. Tes: semua transisi pada alur PRD bagian 16, tombol kembali, layar terkunci ditolak.
- [x] **U-015** `P0` Hook `useProgress`, `useSettings`, dan `useProgressRecorder(controller)`: saat `result.ok` dan `result.stars !== null`, simpan bintang terbaik. Tes integrasi dengan controller dan penyimpanan palsu.
- [x] **U-016** `P1` `HomeScreen` (S1): logo, Pak Mandor, Mulai Game/Lanjutkan, Panduan, Pengaturan, versi. Placeholder aset boleh.
- [x] **U-017** `P1` `ModeSelectScreen` (S2): tab Kampanye/Sandbox/Bandingkan, kartu modul dengan progres dan kunci, daftar level Sandbox/Bandingkan dengan syarat pembukaan.
- [x] **U-018** `P1` `ModuleIntroScreen` (S3 bagian A): judul, deskripsi, konsep; lanjut otomatis sekitar 3 detik; Lewati.
- [x] **U-019** `P1` `LevelMapScreen` (S3 bagian B): titik level, bintang, kunci, sorotan level berikutnya, tombol Mulai/Lanjut Level X, ulangi level lama.
- [x] **U-020** `P1` `GuideScreen` (S9): cara bermain 3 langkah, arti status robot, arti kontrol HUD, glosarium. Isi benar secara konsep (periksa terhadap materi kuliah).
- [x] **U-021** `P1` `SettingsScreen` (S10): volume, kurangi animasi, reset progres (konfirmasi), mode demo, Kredit (daftar aset dari `docs/ASSETS.md`).
- [x] **U-022** `P1` `ModuleCompleteScreen` (S7) dan `GameCompleteScreen` (S8) berdasarkan progres, bintang, dan `concepts` level.
- [x] **U-023** `P1` Komponen dasar: ikon SVG buatan sendiri (play, pause, step, reset, gear, kunci, tempat sampah, tanda tanya, menu, kembali, bintang, panah), `Tooltip`, dan `IconButton` (aria-label wajib). Tes render: setiap `IconButton` punya `aria-label`.

---

## Fase U2 — HUD, Dialog Pak Mandor, dan Popup Hasil (28 Okt sampai 2 Nov) *(baru)*

- [x] **U-030** `P0` `PlayScreen` (S5): kanvas Phaser memenuhi layar (skala FIT), HUD React ditumpuk dengan posisi tetap sesuai PRD bagian 17.1; layar minimal 1280 px tanpa scroll horizontal. Tes render komposisi dasar.
- [x] **U-031** `P0` Kontrol HUD (mengganti `ControlBar`): toggle Play/Pause, Step, Reset berupa ikon dengan tooltip; chip kecepatan 0.5x/1x/5x; chip seed (klik membuka isian, `parseSeed`, menerapkan seed me-reset); chip status dengan tick; Run dan Step nonaktif setelah error atau saat selesai. Tes render tiap keadaan (idle, running, paused, finished, error).
- [x] **U-032** `P0` Chip Misi: target dan kriteria bintang dari data level; dapat dilipat.
- [x] **U-033** `P0` Toolbox bawah (mengganti tampilan `Toolbox`): hanya alat yang tersedia di level ditambah Hapus; terkunci saat simulasi dimulai (dengan keterangan). Mode klik slot tetap tersedia lewat toolbox ini.
- [x] **U-034** `P1` Log Kejadian kiri bawah (restyle `StepLog`): dapat dilipat, terbaru di atas, filter perpindahan READY/RUNNING; memakai `EventLog` yang sudah ada.
- [x] **U-035** `P1` Laci Metrik opsional dan badge waktu tunggu per robot (data dari snapshot).
- [x] **U-036** `P1` Menu Jeda (S13): Lanjut, Ulangi Level, Peta Level, Pengaturan.
- [x] **U-037** `P1` Legenda arti status robot (READY, RUNNING, WAITING, TERMINATED) yang dapat dibuka dari menu.
- [x] **U-038** `P0` `MandorDialog`: potret, gelembung, halaman, Lanjut/Mulai/Lewati, mood potret; menghormati pengaturan kurangi animasi; fokus keyboard terkelola; tes render.
- [x] **U-039** `P0` Perluas `LevelDefinition`: `intro: IntroPage[]`, `hints: string[]`, `concepts: string[]`, `layoutId`; migrasi `level-1-1.ts` dan kode yang membaca `intro`; tes data level (jumlah halaman, minimal 3 petunjuk, `layoutId` terdaftar).
- [x] **U-040** `P1` Sistem petunjuk: tombol "Tanya Pak Mandor", petunjuk bertahap, tawaran otomatis setelah 2 kegagalan dalam sesi (`ui/hints.ts` murni) + tes.
- [x] **U-041** `P0` `ResultDialog` baru (S6): judul dari data level, badge SALAH/BENAR, potret sesuai mood, gelembung "Seharusnya X, hasilnya Y", tiga kartu angka, bintang muncul satu per satu (hormati kurangi animasi), rincian kriteria, pesan Pak Mandor, tombol Reset/Petunjuk/Tutup (salah) atau Lanjut/Ulangi/Tutup (benar). Tes render tiap keadaan.
- [x] **U-042** `P1` Panel error engine bergaya baru (pesan jelas, tombol Reset).

---

## Fase U3 — Arena Phaser (29 Okt sampai 8 Nov) *(baru)*

- [x] **U-050** `P0` `game/layouts/types.ts` (`ArenaLayout`: `loop`, dan tipe lain saat dibutuhkan) dan `layouts/index.ts`; fungsi validasi layout terhadap level. Tes: jumlah checkpoint sama dengan panjang program asli, slot = n+1, fraksi menaik, koordinat di dalam `ARENA`.
- [x] **U-051** `P0` Layout Level 1-1: loop bersama melengkung (dua jalur sejajar), 4 checkpoint, 5 slot, papan di tengah dengan tautan ke READ dan WRITE.
- [x] **U-052** `P0` `tools.ts`: `applyToolsDetailed` yang mengembalikan peta asal instruksi (`original`/`inserted`); `applyTools` tetap ada. Tes: setiap instruksi efektif punya asal, slot `LOCK`/`UNLOCK` benar, masukan tidak termutasi. Lalu `game/anchors.ts` (murni) dan tesnya.
- [x] **U-053** `P0` `TrackView`: gambar jalan dari `Curves.Path` dengan panah arah.
- [x] **U-054** `P0` `CheckpointView`: lingkaran dengan ikon dan label instruksi, tooltip penjelasan awam saat di-hover.
- [x] **U-055** `P0` `RobotView` v2: sprite (placeholder bentuk dahulu), nama di atas, badge status, badge waktu tunggu, penghitung putaran, catatan di tangan (register), efek RUNNING/READY dibekukan/WAITING.
- [x] **U-056** `P0` Gerak robot sepanjang jalan antar jangkar: durasi `tickInterval / speed`, putaran berikutnya melewati ujung jalan, notifikasi batch memakai jangkar terakhir, tween tidak saling menimpa.
- [x] **U-057** `P0` `BoardView` di tengah dengan panah aliran saat READ dan WRITE serta animasi perubahan angka.
- [x] **U-058** `P0` `DoorView` v2: gerbang melintang di jalan (terbuka/tertutup), pemegang kunci, robot yang menunggu berbaris di depan pintu.
- [x] **U-059** `P1` Visual Si Penjadwal: sorot robot RUNNING, bekukan robot READY.
- [x] **U-060** `P0` `game/slots.ts` (`nearestSlot`, daftar slot sah) dan `SlotMarkerView` (penanda dan sorotan saat seret). Tes `slots.ts`.
- [x] **U-061** `P0` Seret-lepas pintu: HTML5 DnD dari toolbox, `EventBus` (`tool-drag-start/move/drop/end`), `LevelScene` mencari slot, `game/doorPlacement.ts` (state machine murni: pintu masuk lalu pintu keluar, Esc membatalkan), `controller.placeTool/removeTool`; pindah pintu, seret ke Hapus; mode klik sebagai alternatif. Tes `doorPlacement` dan konversi slot menjadi `ToolSpan` (`start = s`, `end = e - 1`, untuk semua robot di loop).
- [ ] **U-062** `P1` Skala FIT, HiDPI, dan perubahan ukuran jendela; uji manual pada 1280x720 dan 1920x1080.
- [ ] **U-063** `P1` Uji kinerja arena Level 1-1 (sekitar 60 fps) dan catat hasilnya.
- [ ] **U-064** `P0` Sambungkan seluruh komponen baru ke `PlayScreen`; hapus `ControlBar`, `Toolbox` lama, dan tampilan panel kanan setelah pengganti stabil; perbarui tes.

---

## Fase U4 — Aset dan Karakter (29 Okt sampai 10 Nov; audio sampai 19 Nov) *(baru)*

- [ ] **U-070** `P0` Pilih dan unduh aset Kenney (Tiny Factory, Robot Pack, paket UI atau ikon bila perlu); periksa kecocokan gaya; simpan di `public/assets/`; catat sumber dan lisensi di `docs/ASSETS.md` dan README Kredit.
- [ ] **U-071** `P0` Konfigurasi Phaser `pixelArt: true`, `assetManifest.ts`, scene `Preloader` (muat aset), tes manifest (berkas ada). Latar arena Level 1-1 dari Tiny Factory (ubin 16x16 diskalakan 4x).
- [ ] **U-072** `P0` Sprite robot top-down (A dan B dengan tint, animasi jalan dan diam) menggantikan placeholder `RobotView`.
- [ ] **U-073** `P1` Sprite checkpoint dan ikon instruksi, gerbang, papan stok (bila perlu digambar sendiri atau disusun dari aset Kenney).
- [ ] **U-074** `P0` Potret Pak Mandor: pilih gambar resmi; hasilkan ekspresi netral, senang, sedih, berpikir (minimal tiga) dengan latar polos tanpa teks; hapus latar; PNG transparan sekitar 1024 px; optimalkan; buat avatar kepala. Catat prompt, generator, tanggal, peninjau di `docs/AI_USAGE.md` dan Kredit; periksa ketentuan penggunaan generator.
- [ ] **U-075** `P1` Logo Thread Factory, latar Beranda, dan gambar pratinjau kartu modul.
- [ ] **U-076** `P1` Efek kecil: bintang muncul, percikan bentrok, zzz, kilau pintu; hormati kurangi animasi.
- [ ] **U-077** `P2` Audio: klik, benar, salah, kunci dipegang atau dilepas, musik latar opsional; sumber CC0 tercatat; pemutar menghormati volume dan dimatikan di tes. (Menggantikan T-074.)

---

## Fase 6 — Modul 1 Lanjutan (30 Okt sampai 15 Nov) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

Setiap level memiliki paket tetap: engine atau data (T), layout arena (jalur D), konten Pak Mandor (jalur E). Tampilan baru dikerjakan setelah U3 stabil.

**Level 1-2 — Pintu Kebesaran** `P1`
- [ ] **T-037** *(diubah)* Pintu bebas ditaruh di slot mana pun, termasuk sebelum WORK, lewat seret-lepas (U-061). `tools.ts` sudah mendukung rentang; tambah tes kasus rentang yang menutupi `WORK` dan pastikan UI tidak membatasi slot di level ini.
- [ ] **T-038** *(diubah)* Data level 1-2 dengan `cores: 2`. Tes: mutex terlalu besar (menutupi `WORK`) → total tick naik; mutex pas → benar dan cepat; tes eksplisit bahwa pada `cores = 1` total tick sama (dokumentasi alasan memakai 2 core).
- [ ] **T-039** *(diubah)* Kriteria bintang berdasarkan throughput. Karena beban kerja tetap, `goal.stars.fast` dinyatakan sebagai batas tick (setara throughput) dan dijelaskan di UI sebagai throughput. Tes `evaluateLevel` untuk level ini.
- [ ] **T-085** *(baru)* Metrik `coreUtilization` di `metrics.ts`; `Snapshot` ditambah `cores` dan `executedInstructions` (perbarui `types.ts`, `engine.ts`, dan tes); tampil di laci metrik dan popup hasil.
- [ ] **T-086** *(baru)* Layout dan visual Level 1-2: pakai ulang loop 1-1, tambah indikator Core 1 dan Core 2 (sibuk atau menganggur) dan meter utilisasi.
- [ ] **T-087** *(baru)* Konten Level 1-2: intro, petunjuk, penjelasan lulus dan gagal, konsep; tes data level.

**Level 1-3 — Tiga Mesin, Delapan Robot** `P1`
- [ ] **T-040** `primitives/semaphore.ts` (`SEM_WAIT`/`SEM_SIGNAL`, antrean FIFO) + tes.
- [ ] **T-041** *(diubah)* Area berkapasitas di engine (ARCHITECTURE 4.9): `areas` di `EngineConfig`, instruksi `ENTER_AREA` dan `LEAVE_AREA`, event `AREA_ENTERED`, `AREA_LEFT`, `AREA_OVERLOAD`, metrik `overloadTicks` dan `areaUtilization`; dokumentasikan di ARCHITECTURE 4.2; tes: kelebihan kapasitas terdeteksi, utilisasi dihitung benar.
- [ ] **T-088** *(baru)* Alat semaphore: perluas `PlacedTool` dengan `kind: 'semaphore'` (nilai awal 1 sampai 8 dipilih pemain) dan `applyTools` menyisipkan `SEM_WAIT` sebelum dan `SEM_SIGNAL` sesudah rentang; `buildEngineConfig` memasang nilai awal; `placeTool` memvalidasi. Tes: seimbang, nilai di luar 1..8 ditolak, masukan tidak termutasi.
- [ ] **T-042** *(diubah)* `TokenView` (rak Kartu Akses), visual antrean, slider nilai semaphore 1 sampai 8 di toolbox, dan seret Kartu Akses ke pintu aula.
- [ ] **T-043** *(diubah)* Data level 1-3 (`cores` = 8, 8 robot, area kapasitas 3) + tes: nilai 3 memberi `areaUtilization` tertinggi tanpa bentrok, nilai di atas 3 bentrok, nilai di bawah 3 utilisasi lebih rendah.
- [ ] **T-089** *(baru)* Layout aula (`HallLayout`): 8 robot antre, pintu aula, 3 mesin, efek "BENTROK".
- [ ] **T-090** *(baru)* Konten Level 1-3 (intro, petunjuk, penjelasan, konsep).

**Level 1-4 — Lampu Sinyal** `P1`
- [ ] **T-044** `primitives/condition.ts` (`COND_WAIT`/`COND_SIGNAL`/`COND_BROADCAST`) + tes.
- [ ] **T-045** Metrik `busyWaitTicks` dan visual baterai robot.
- [ ] **T-046** Data level 1-4 + tes: tanpa condition variable energi terkuras; dengan condition variable hemat dan benar.
- [ ] **T-091** *(baru)* Alat Lampu Sinyal: `PlacedTool` `kind: 'condition'` yang menyisipkan `COND_WAIT`/`COND_SIGNAL` bersama mutex; seret ke checkpoint pengepak. Tes `applyTools`.
- [ ] **T-092** *(baru)* Layout meja barang: pengepak dengan meter baterai, lampu sinyal merah atau hijau, efek tidur (zzz).
- [ ] **T-093** *(baru)* Konten Level 1-4.

**Level 1-5 — Lini Gabungan** `P2`
- [ ] **T-047** Gabungkan skenario 1-1 sampai 1-4; tes pemilihan kombinasi alat.
- [ ] **T-094** *(baru)* Layout gabungan (elemen 1-1 sampai 1-4 dalam satu arena).
- [ ] **T-095** *(baru)* Konten Level 1-5.

---

## Fase 7 — Modul 2: Masalah Klasik (2 sampai 19 Nov) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

**Level 2-1 — Ban Berjalan (Producer-Consumer)** `P1`
- [ ] **T-048** Tambah instruksi buffer (mis. `PUT_ITEM`, `TAKE_ITEM`) ke engine + dokumentasikan di `ARCHITECTURE.md` 4.2.
- [ ] **T-049** `BufferView` (slot ban berjalan, overflow, underflow).
- [ ] **T-050** Data level 2-1 (parameter jumlah producer, consumer, kapasitas) + tes tiga semaphore (`empty`, `full`, mutex).
- [ ] **T-096** *(baru)* Layout ban (`BeltLayout`): jalur producer di kiri dan consumer di kanan (program berbeda, jalur terpisah), efek barang jatuh (overflow) dan tangan meraih kosong (underflow).
- [ ] **T-097** *(baru)* Konten Level 2-1.
- [ ] **T-098** *(baru)* Alat untuk tiga semaphore (`empty`, `full`) dan mutex pelindung ban di toolbox (memakai T-088); tes `applyTools`.

**Level 2-2 — Papan Pengumuman (Readers-Writers)** `P1`
- [ ] **T-051** Mekanisme akses banyak-reader/satu-writer di engine.
- [ ] **T-052** Tiga kebijakan: reader priority, writer priority, fair (FIFO) sebagai pilihan di level.
- [ ] **T-053** Deteksi starvation (waktu tunggu maksimum) dan visual bar kesabaran writer.
- [ ] **T-054** Tes: reader priority → writer kelaparan pada seed tertentu; fair → tidak.
- [ ] **T-099** *(baru)* Layout papan pengumuman (barisan reader dan writer), sakelar kebijakan di papan (komponen UI), tampilan tulisan setengah jadi saat tanpa pengaman.
- [ ] **T-100** *(baru)* Konten Level 2-2.

**Level 2-3 — Meja Teknisi (Dining Philosophers)** `P1`
- [ ] **T-055** `engine/deadlock.ts`: deteksi siklus tunggu + event `DEADLOCK_DETECTED`.
- [ ] **T-056** Skenario 5 teknisi dan 5 kunci; tes: tanpa strategi terdeteksi deadlock.
- [ ] **T-057** Strategi: urutan pengambilan resource, batasi 4 teknisi (semaphore), asimetris genap/ganjil; tes tiap strategi bebas deadlock.
- [ ] **T-058** Strategi pemulihan ("Rampas kunci" / preemption) + UI.
- [ ] **T-059** Visual: garis merah siklus tunggu dan empat kotak kondisi Coffman yang menyala/padam sesuai strategi.
- [ ] **T-060** Metrik fairness (jumlah makan per teknisi).
- [ ] **T-101** *(baru)* Layout meja bundar (`TableLayout`): 5 teknisi, 5 kunci inggris, cincin progres langkah tiap teknisi.
- [ ] **T-102** *(baru)* Konten Level 2-3.

**Level 2-4 — Lini Produksi Penuh** `P2`
- [ ] **T-061** Skenario campuran dengan "anggaran alat" terbatas.
- [ ] **T-103** *(baru)* Layout gabungan tiga area dan tampilan koin anggaran alat di toolbox.
- [ ] **T-104** *(baru)* Konten Level 2-4.

---

## Fase 8 — Mode Sandbox, Bandingkan, dan Skor (9 sampai 20 Nov) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

- [ ] **T-062** `P1` *(diubah)* Level select dan progres kampanye: **digantikan oleh U-011, U-012, U-017, U-019**. Tugas ini selesai bila keempatnya selesai dan alur level select diuji dari Beranda.
- [ ] **T-063** `P1` *(diubah)* Sistem bintang generik: sebagian besar sudah ada di `evaluateLevel`; sisanya menampilkan bintang di Peta Level dan layar tamat (U-019, U-022). Tes ambang tiap level.
- [ ] **T-064** `P1` Mode **Sandbox** (logika): `LevelDefinition.sandbox` (parameter yang boleh diubah: jumlah thread, kapasitas buffer, jumlah token, kebijakan, seed) dan pembangunan konfigurasi dengan parameter pengganti; tes batas nilai.
- [ ] **T-105** `P1` *(baru)* `SandboxScreen` (S11): arena level dengan laci Parameter; tanpa bintang; popup hasil ringkas.
- [ ] **T-065** `P1` Mode **Bandingkan** (logika): `CompareSession` (dua `SimulationController` berseed sama, perintah diteruskan ke keduanya). Tes: tick keduanya serempak, hasil identik pada konfigurasi identik.
- [ ] **T-106** `P1` *(baru)* `CompareScreen` (S12): layar terbagi dua panel, arena mini, konfigurasi A dan B, ringkasan "lebih baik" per metrik.
- [ ] **T-066** `P1` Tabel dan grafik perbandingan metrik (throughput, waktu tunggu, lost update, deadlock, fairness); grafik batang SVG buatan sendiri (tanpa library).
- [ ] **T-067** `P1` Teks Pak Mandor untuk **semua** level: intro 2 sampai 3 halaman, petunjuk bertahap, penjelasan lulus dan gagal (konsep harus benar; ditinjau oleh anggota selain penulis).
- [ ] **T-068** `P2` Papan skor lokal / tantangan berbasis seed.

---

## Fase 9 — Polesan dan Stabilitas (16 sampai 27 Nov) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

- [ ] **T-069** `P1` Uji menyeluruh semua level di Chrome dan Edge/Firefox; catat dan perbaiki bug.
- [ ] **T-070** `P1` Uji kinerja (sekitar 60 fps) pada laptop standar, khusus arena Level 1-3 (8 robot) dan 2-4; perbaiki jika turun.
- [ ] **T-071** `P1` Periksa semua penjelasan konsep di UI terhadap materi kuliah.
- [ ] **T-072** `P1` Aksesibilitas: label atau ikon selain warna, `aria-label` dan tooltip di semua tombol ikon, kontras teks, dialog dapat ditutup dengan Esc, pengaturan kurangi animasi berfungsi.
- [ ] **T-073** `P2` *(dipindah)* Sprite dan aset: dikerjakan di Fase U4 (U-070 sampai U-076).
- [ ] **T-074** `P2` *(dipindah)* Efek suara dan animasi tambahan: dikerjakan di U-076 dan U-077.
- [ ] **T-075** `P1` **Bekukan fitur (feature freeze) Jumat 20 Nov 2026**; sesudahnya hanya perbaikan bug dan dokumentasi.
- [ ] **T-107** `P1` *(baru)* Uji alur penuh dari Beranda sampai Tamat Game (checklist manual), termasuk mode demo, Sandbox, dan Bandingkan; catat hasil dan tangkapan layar.
- [ ] **T-108** `P1` *(baru)* Uji progres dan penyimpanan: muat ulang halaman, penyimpanan nonaktif (mode privat), reset progres, data rusak.

---

## Fase 10 — Luaran Wajib (mulai minggu 2 secara paralel; selesai Sabtu 28 Nov) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

Dokumentasi tidak menunggu akhir: laporan Bab I, II, dan III dapat ditulis sejak minggu 2 oleh jalur F.

- [ ] **T-076** `P1` README lengkap: deskripsi, instalasi, cara pakai, anggota tim, kredit dan lisensi (termasuk aset Kenney dan potret hasil generator).
- [ ] **T-077** `P1` Laporan PDF 10–20 halaman sesuai sistematika (BAB I–V, Daftar Pustaka, Lampiran), termasuk tabel pembagian tugas (No, Nama, NPM, Peran, Rincian Tugas dan Kontribusi) di akhir BAB I.
- [ ] **T-078** `P1` Bab II memuat landasan teori (race condition, critical section, mutex, semaphore, monitor/condition variable, Producer-Consumer, Readers-Writers, Dining Philosophers, deadlock, starvation) dan karya terkait (Deadlock Empire, Parallel, Railway Quest).
- [ ] **T-079** `P1` Bagian dalam laporan yang dibantu AI dicantumkan (dari `docs/AI_USAGE.md`), termasuk potret Pak Mandor dan aset hasil generator.
- [ ] **T-080** `P1` Video demo 3–5 menit (unlisted YouTube atau Google Drive); naskah dan latihan.
- [ ] **T-081** `P1` Slide presentasi (PDF/PPTX); latihan 15 menit + antisipasi tanya jawab 10 menit.
- [ ] **T-082** `P1` Pastikan setiap anggota bisa menjawab pertanyaan tentang seluruh bagian produk.
- [ ] **T-083** `P1` Pengumpulan seluruh luaran (**H-2 sebelum jadwal presentasi; paling awal Sabtu 28 Nov 2026**): produk (tautan situs), tautan repo, laporan, video, slide.
- [ ] **T-084** `P1` Siapkan cadangan demo: build lokal yang bisa dijalankan tanpa internet, dengan mode demo aktif.

---

## Milestone M2 sampai M5 *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*

**M2 — Level 1-1 dengan tampilan baru (Minggu 8 Nov)**
- [ ] Seluruh kriteria PRD bagian 13A terpenuhi.
- [ ] Alur Beranda sampai Arena, popup hasil, dan penyimpanan progres berjalan.
- [ ] Aset Level 1-1 terpasang (Kenney dan potret Pak Mandor minimal 3 ekspresi) dan tercatat di Kredit.
- [ ] Semua tes, `typecheck`, dan `lint` bersih; build produksi berjalan dari situs statis.

**M3 — Modul 1 lengkap (Minggu 15 Nov)**
- [ ] Level 1-1 sampai 1-5 memiliki engine, tes, layout, dan konten.
- [ ] Engine Level 2-1, 2-2, dan 2-3 dengan tes (tampilan boleh menyusul).
- [ ] Peta Level, layar tamat modul, dan aturan buka-kunci berjalan.

**M4 — Feature freeze (Jumat 20 Nov)**
- [ ] Semua level (termasuk P2) berjalan dengan tampilan baru.
- [ ] Sandbox dan Bandingkan berjalan; Panduan, Pengaturan, Kredit, dan audio selesai.
- [ ] Tidak ada tugas fitur yang tersisa; hanya bug dan dokumentasi.

**M5 — Pengumpulan (Sabtu 28 Nov)**
- [ ] Produk (tautan), repo, laporan, video, dan slide terkumpul.
- [ ] Cadangan demo offline siap; setiap anggota siap menjawab pertanyaan.

---

## Catatan Pengerjaan *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

- Selesaikan **M1** (cek build produksi dan tes bersih) di minggu pertama; Fase U dan Fase 6 berjalan paralel sesuai jalur kerja.
- Perubahan di `engine/` selalu disertai tes; engine yang salah akan menggagalkan semua level.
- **Tugas tampilan (U-xxx)** disertai tangkapan layar di deskripsi PR dan daftar periksa manual; bagian logikanya dipisah ke berkas murni agar bisa dites.
- Tiap tugas ditutup dengan baris di `docs/AI_USAGE.md` dan pemeriksaan *Definition of Done* di `CLAUDE.md`. Aset hasil generator juga dicatat di sana.
- Jika ada keputusan yang mengubah `PRD.md` atau `ARCHITECTURE.md`, ubah dokumennya **terlebih dahulu**, baru kodenya.
- Commit memakai tanda kutip tunggal pada `git commit -m '...'` (tanda backtick di dalam tanda kutip ganda dieksekusi shell dan memotong pesan).
- Jangan mengorbankan stabilitas demo; setelah 20 Nov hanya perbaikan bug.

## Riwayat Perubahan *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*

| Tanggal | Perubahan |
|---|---|
| Okt 2026 (awal) | Daftar tugas T-001 sampai T-084 |
| 26 Okt 2026 | Jadwal bertanggal sampai pengumpulan 28 Nov; jalur kerja paralel; Fase U0 sampai U4 (U-001 sampai U-077) untuk tampilan; Fase 6 sampai 10 diperbarui dan ditambah T-085 sampai T-108; milestone M2 sampai M5 |
