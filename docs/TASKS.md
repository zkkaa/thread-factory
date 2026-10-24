# TASKS — Thread Factory: Pabrik Rebutan

> Checklist pengerjaan bertahap. Rujukan: `PRD.md` (apa) dan `ARCHITECTURE.md` (bagaimana).
> **Cara pakai:** satu tugas = satu branch = satu sesi AI. Sebut ID tugas (mis. `T-021`) saat meminta bantuan. Centang `[x]` setelah memenuhi *Definition of Done* di `CLAUDE.md`.
> **Prioritas:** `P0` MVP · `P1` wajib · `P2` bonus.

## Peta Waktu (target kasar, 4 minggu)

| Minggu | Target |
|---|---|
| 1 | Setup + **walking skeleton**: Level 1-1 berjalan dari engine sampai layar (Milestone M1) |
| 2 | Modul 1 lengkap (1-2, 1-3, 1-4) + fondasi Modul 2 |
| 3 | Modul 2 (2-1, 2-2, 2-3) + Sandbox + Bandingkan + skor |
| 4 | Polesan, uji menyeluruh, dokumentasi, video, pengumpulan (**H-2 sebelum presentasi**) |

> Jika terlambat: potong `P2` dulu, lalu sederhanakan `P1` terakhir. **Jangan** mengorbankan stabilitas demo.

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

- [] **T-022** `P0` `levels/types.ts` (`LevelDefinition`) dan `levels/module1/level-1-1.ts` (dua robot, 5 produk masing-masing, target 10).
- [ ] **T-023** `P0` Tentukan `tutorialSeed` atau `Scripted` yang **pasti** memunculkan race condition; tulis tesnya.
- [ ] **T-024** `P0` `controller/SimulationController.ts`: state `idle/running/paused/finished`, jam tick (akumulator `requestAnimationFrame`), `run/pause/step/reset/setSpeed`, `subscribe`.
- [x] **T-025** `P0` Controller: `placeTool`/`removeTool`; alat terkunci saat simulasi berjalan.

## Fase 4 — Renderer Minimal Phaser (Minggu 1)

- [ ] **T-026** `P0` `game/theme.ts` (warna state, ukuran ubin) dan `LevelScene` yang membangun view dari snapshot awal.
- [ ] **T-027** `P0` `RobotView` (kotak berwarna + label sesuai state) dan `BoardView` (menampilkan nilai Papan Stok).
- [ ] **T-028** `P0` Animasi: robot bergerak per ubin mengikuti event; durasi tween = `tickInterval / speed`.
- [ ] **T-029** `P0` `DoorView` (pintu mutex) di slot yang tersedia; tampilan robot menunggu di depan pintu.
- [ ] **T-030** `P0` Reset membangun ulang view dari snapshot.

## Fase 5 — Control Panel React (Minggu 1)

- [ ] **T-031** `P0` `useSimulation()` dengan `useSyncExternalStore`.
- [ ] **T-032** `P0` `ControlBar`: Run, Pause, Step, Reset, pilihan kecepatan, input seed.
- [ ] **T-033** `P0` `Toolbox` + interaksi klik slot untuk memasang/melepas mutex.
- [ ] **T-034** `P0` `MetricsPanel`: nilai akhir, lost updates, waktu tunggu per robot.
- [ ] **T-035** `P0` `ResultDialog`: "Seharusnya 10, hasilnya X", status benar/salah, penjelasan singkat konsepnya.
- [ ] **T-036** `P1` `StepLog`: daftar event terakhir (membantu penjelasan saat demo).

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

---

## Fase 6 — Modul 1 Lanjutan (Minggu 2)

**Level 1-2 — Pintu Kebesaran** `P1`
- [ ] **T-037** Rentang mutex yang bisa diatur (pilih ubin awal dan akhir) di `tools.ts` + UI.
- [ ] **T-038** Data level 1-2, tes: mutex terlalu besar → throughput turun; mutex pas → benar dan cepat.
- [ ] **T-039** Kriteria bintang berdasarkan throughput.

**Level 1-3 — Tiga Mesin, Delapan Robot** `P1`
- [ ] **T-040** `primitives/semaphore.ts` (`SEM_WAIT`/`SEM_SIGNAL`, antrean FIFO) + tes.
- [ ] **T-041** Resource "mesin" dan deteksi konflik (dua robot di satu mesin = data rusak).
- [ ] **T-042** `TokenView` dan visual antrean; kontrol nilai semaphore di Toolbox (1 sampai 8).
- [ ] **T-043** Data level 1-3 + tes: nilai 3 memberi utilisasi tertinggi tanpa konflik.

**Level 1-4 — Lampu Sinyal** `P1`
- [ ] **T-044** `primitives/condition.ts` (`COND_WAIT`/`COND_SIGNAL`/`COND_BROADCAST`) + tes.
- [ ] **T-045** Metrik `busyWaitTicks` dan visual baterai robot.
- [ ] **T-046** Data level 1-4 + tes: tanpa condition variable energi terkuras; dengan condition variable hemat dan benar.

**Level 1-5 — Lini Gabungan** `P2`
- [ ] **T-047** Gabungkan skenario 1-1 sampai 1-4; tes pemilihan kombinasi alat.

## Fase 7 — Modul 2: Masalah Klasik (Minggu 2 akhir sampai Minggu 3)

**Level 2-1 — Ban Berjalan (Producer-Consumer)** `P1`
- [ ] **T-048** Tambah instruksi buffer (mis. `PUT_ITEM`, `TAKE_ITEM`) ke engine + dokumentasikan di `ARCHITECTURE.md` 4.2.
- [ ] **T-049** `BufferView` (slot ban berjalan, overflow, underflow).
- [ ] **T-050** Data level 2-1 (parameter jumlah producer, consumer, kapasitas) + tes tiga semaphore (`empty`, `full`, mutex).

**Level 2-2 — Papan Pengumuman (Readers-Writers)** `P1`
- [ ] **T-051** Mekanisme akses banyak-reader/satu-writer di engine.
- [ ] **T-052** Tiga kebijakan: reader priority, writer priority, fair (FIFO) sebagai pilihan di level.
- [ ] **T-053** Deteksi starvation (waktu tunggu maksimum) dan visual bar kesabaran writer.
- [ ] **T-054** Tes: reader priority → writer kelaparan pada seed tertentu; fair → tidak.

**Level 2-3 — Meja Teknisi (Dining Philosophers)** `P1`
- [ ] **T-055** `engine/deadlock.ts`: deteksi siklus tunggu + event `DEADLOCK_DETECTED`.
- [ ] **T-056** Skenario 5 teknisi dan 5 kunci; tes: tanpa strategi terdeteksi deadlock.
- [ ] **T-057** Strategi: urutan pengambilan resource, batasi 4 teknisi (semaphore), asimetris genap/ganjil; tes tiap strategi bebas deadlock.
- [ ] **T-058** Strategi pemulihan ("Rampas kunci" / preemption) + UI.
- [ ] **T-059** Visual: garis merah siklus tunggu dan empat kotak kondisi Coffman yang menyala/padam sesuai strategi.
- [ ] **T-060** Metrik fairness (jumlah makan per teknisi).

**Level 2-4 — Lini Produksi Penuh** `P2`
- [ ] **T-061** Skenario campuran dengan "anggaran alat" terbatas.

## Fase 8 — Mode Sandbox, Bandingkan, dan Skor (Minggu 3)

- [ ] **T-062** `P1` Level select dan progres kampanye (`localStorage`, dibungkus try/catch).
- [ ] **T-063** `P1` Sistem bintang generik dari `goal.stars` di data level.
- [ ] **T-064** `P1` Mode **Sandbox**: ubah jumlah thread, kapasitas buffer, jumlah token, kebijakan, seed.
- [ ] **T-065** `P1` Mode **Bandingkan**: dua instance engine dengan seed sama, tampilan berdampingan.
- [ ] **T-066** `P1` Tabel dan grafik perbandingan metrik (throughput, waktu tunggu, lost update, deadlock, fairness).
- [ ] **T-067** `P1` Teks tutorial Pak Mandor untuk tiap level (isi `intro`; konsep harus benar).
- [ ] **T-068** `P2` Papan skor lokal / tantangan berbasis seed.

## Fase 9 — Polesan dan Stabilitas (Minggu 4)

- [ ] **T-069** `P1` Uji menyeluruh semua level di Chrome dan Edge/Firefox; catat dan perbaiki bug.
- [ ] **T-070** `P1` Uji kinerja (≈60 fps) pada laptop standar; perbaiki jika turun.
- [ ] **T-071** `P1` Periksa semua penjelasan konsep di UI terhadap materi kuliah.
- [ ] **T-072** `P1` Cek aksesibilitas dasar (label/ikon selain warna, kontras teks).
- [ ] **T-073** `P2` Ganti bentuk geometris dengan sprite (mis. Kenney.nl) lewat kelas view; catat lisensi di README.
- [ ] **T-074** `P2` Efek suara/animasi tambahan.
- [ ] **T-075** `P1` Bekukan fitur (feature freeze) beberapa hari sebelum pengumpulan; hanya perbaikan bug.

## Fase 10 — Luaran Wajib (Minggu 4, selesai H-2 sebelum presentasi)

- [ ] **T-076** `P1` README lengkap: deskripsi, instalasi, cara pakai, anggota tim, kredit dan lisensi.
- [ ] **T-077** `P1` Laporan PDF 10–20 halaman sesuai sistematika (BAB I–V, Daftar Pustaka, Lampiran), termasuk tabel pembagian tugas (No, Nama, NPM, Peran, Rincian Tugas dan Kontribusi) di akhir BAB I.
- [ ] **T-078** `P1` Bab II memuat landasan teori (race condition, critical section, mutex, semaphore, monitor/condition variable, Producer-Consumer, Readers-Writers, Dining Philosophers, deadlock, starvation) dan karya terkait (Deadlock Empire, Parallel, Railway Quest).
- [ ] **T-079** `P1` Bagian dalam laporan yang dibantu AI dicantumkan (dari `docs/AI_USAGE.md`).
- [ ] **T-080** `P1` Video demo 3–5 menit (unlisted YouTube atau Google Drive); naskah dan latihan.
- [ ] **T-081** `P1` Slide presentasi (PDF/PPTX); latihan 15 menit + antisipasi tanya jawab 10 menit.
- [ ] **T-082** `P1` Pastikan setiap anggota bisa menjawab pertanyaan tentang seluruh bagian produk.
- [ ] **T-083** `P1` Pengumpulan seluruh luaran (**H-2 sebelum jadwal presentasi**): produk (tautan situs), tautan repo, laporan, video, slide.
- [ ] **T-084** `P1` Siapkan cadangan demo: build lokal yang bisa dijalankan tanpa internet.

---

## Catatan Pengerjaan

- Selesaikan **M1** sebelum menyentuh Fase 6 dan seterusnya; M1 adalah fondasi semua level.
- Perubahan di `engine/` selalu disertai tes; engine yang salah akan menggagalkan semua level.
- Tiap tugas ditutup dengan baris di `docs/AI_USAGE.md` dan pemeriksaan *Definition of Done* di `CLAUDE.md`.
- Jika ada keputusan yang mengubah `PRD.md` atau `ARCHITECTURE.md`, ubah dokumennya **terlebih dahulu**, baru kodenya.
