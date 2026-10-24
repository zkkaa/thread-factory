# PRD — Thread Factory: Pabrik Rebutan

> Product Requirements Document. Dokumen ini menjawab **"apa yang dibangun"**.
> Untuk **"bagaimana"**, lihat `ARCHITECTURE.md`. Untuk urutan kerja, lihat `TASKS.md`.

| | |
|---|---|
| Status | Draf v0.1 |
| Konteks | Final Project Sistem Operasi, Ganjil 2026/2027, Kategori B (aplikasi simulasi) |
| Tim | 6 orang |
| Platform | Web (browser desktop), tanpa backend |

---

## 1. Ringkasan Produk

**Thread Factory: Pabrik Rebutan** adalah game edukasi web 2D bertema pabrik untuk memahami **sinkronisasi thread** pada sistem operasi. Pemain menjadi *Manajer Lantai* yang mengatur robot-robot pekerja (thread) yang berebut mesin dan papan stok (shared resource). Pemain memasang pengaman (mutex, semaphore, condition variable, kebijakan antrean), menjalankan simulasi, lalu melihat apakah pabrik berjalan benar dan efisien.

**Satu kalimat:** "Kegagalan sinkronisasi dibuat terlihat dan terasa (stok salah hitung, robot menganggur, teknisi saling menunggu), sehingga orang awam memahami konsepnya tanpa membaca kode."

## 2. Visi dan Tujuan

**Visi:** membuat konsep sinkronisasi yang abstrak bisa dipahami lewat metafora fisik dan pengalaman mencoba sendiri.

**Tujuan produk:**
1. Pemain memahami *mengapa* race condition, starvation, dan deadlock terjadi.
2. Pemain memahami *bagaimana* mutex, semaphore, condition variable, dan kebijakan antrean mencegahnya.
3. Pemain memahami bahwa pengaman punya **harga** (trade-off antara kebenaran dan kecepatan).

**Tujuan proyek (akademik):** memenuhi persyaratan minimum Kategori B dan rubrik penilaian (Kompleksitas 50%, Presentasi dan demo 30%, Dokumentasi 20%).

## 3. Sasaran Pengguna

- **Utama:** mahasiswa semester awal yang baru belajar sistem operasi.
- **Sekunder:** pelajar atau pemula yang belum pernah mendengar istilah "mutex".
- **Asumsi:** pemain tidak perlu bisa memprogram.

## 4. Ruang Lingkup

### 4.1 Dalam lingkup
- Dua modul: **Modul 1 Pabrik Rebutan** (sinkronisasi dasar) dan **Modul 2 Masalah Klasik Konkurensi**.
- Tiga mode: **Kampanye**, **Sandbox**, **Bandingkan**.
- Kontrol simulasi: Run, Pause, Step, Reset, kecepatan, seed.
- Metrik kinerja dan panel hasil.
- Berjalan sepenuhnya di browser (situs statis).

### 4.2 Di luar lingkup
- Multiplayer dan backend/akun pengguna.
- Banker's Algorithm dan deadlock sebagai modul tersendiri (kelompok lain, "Dapur Macet!", sudah mengambil topik deadlock; deadlock di sini hanya muncul sebagai bagian Dining Philosophers).
- Aplikasi mobile native dan tata letak khusus layar ponsel.
- Editor kode atau pemrograman blok untuk robot.

## 5. Pembeda dan Karya Terkait

Karya terkait **wajib dikutip di Bab II laporan** dan dijelaskan perbedaannya:

| Karya | Kemiripan | Pembeda Thread Factory |
|---|---|---|
| The Deadlock Empire | Pemain berperan sebagai scheduler | Kita memakai metafora fisik, bukan membaca kode |
| Parallel (Ontañón dkk.) | Puzzle: pasang semaphore, lalu tekan "test" | Kita memakai robot/pabrik, lebih banyak alat (mutex, condition variable, kebijakan), dan mode Bandingkan dengan metrik |
| Railway Quest | Metafora kendaraan = thread | Fokus kita sinkronisasi klasik dengan perbandingan kebijakan |
| Dapur Macet! (kelompok 10) | Game edukasi OS | Fokus mereka deadlock; fokus kita sinkronisasi |

## 6. Metafora Konsep Sistem Operasi

| Di game | Konsep sisop |
|---|---|
| Robot pekerja | Thread |
| Papan stok / buku besar | Shared variable |
| Mesin | Shared resource |
| Area di depan papan/mesin | Critical section |
| Pintu dengan satu kunci | Mutex |
| Kartu akses (jumlah terbatas) | Counting semaphore |
| Lampu sinyal "siap/tunggu" | Condition variable |
| Antrean di depan pintu | Wait queue |
| Ban berjalan berslot terbatas | Bounded buffer |
| Si Penjadwal (membekukan robot acak) | Scheduler dan context switch |
| Pak Mandor (pemandu tutorial) | Penjelas konsep per level |
| Teknisi dan kunci inggris | Proses dan resource pada Dining Philosophers |

Warna state robot (selalu disertai label, jangan hanya warna): **Ready**, **Running**, **Waiting**, **Terminated**.

## 7. Gaya Interaksi (Keputusan Desain)

**Gaya A: pemain menaruh dan mengatur alat pengaman; robot berjalan otomatis.** Pemain *tidak* menulis kode dan *tidak* menyusun perintah per robot.

Alur inti satu level:
1. **Amati masalah:** pemain menekan Run tanpa pengaman dan melihat kegagalannya.
2. **Pasang pengaman:** pilih alat dari toolbox dan tempatkan di slot/rentang yang tersedia.
3. **Jalankan lagi:** lihat apakah masalah hilang dan berapa harganya (waktu tunggu).
4. **Hasil dan bintang:** panel hasil menjelaskan apa yang terjadi.

Padanan teknis: jalur robot = deretan ubin; tiap ubin = satu instruksi. Alat pengaman menutupi rentang ubin tertentu (detail di `ARCHITECTURE.md`).

## 8. Mode Permainan

| Mode | Deskripsi | Prioritas |
|---|---|---|
| **Kampanye** | Level berurutan dengan tutorial Pak Mandor dan sistem bintang | P0/P1 |
| **Sandbox** | Pemain mengubah jumlah robot, kapasitas buffer, jumlah token, kebijakan, dan seed | P1 |
| **Bandingkan** | Dua konfigurasi dijalankan berdampingan dengan seed sama, hasil dalam tabel dan grafik | P1 |

### Kontrol simulasi
- **Run / Pause / Step / Reset**
- **Kecepatan:** 0.5x, 1x, 5x (mengubah laju tick, bukan logika)
- **Seed:** angka input agar kejadian bisa diulang persis sama

### Metrik
Throughput (pekerjaan selesai per tick), waktu tunggu rata-rata dan maksimum, utilisasi mesin, jumlah pembaruan data yang hilang (data corruption), jumlah deadlock terdeteksi, indikator starvation, dan (Level 1-4) konsumsi energi akibat busy waiting.

## 9. Spesifikasi Level

Prioritas: **P0** = MVP, **P1** = wajib, **P2** = bonus.

### Modul 1 — Pabrik Rebutan (Sinkronisasi Dasar)

**Level 1-1 — Bug Papan Stok** `P0`
- **Situasi:** Robot A dan B masing-masing merakit 5 produk, lalu menambah angka di Papan Stok. Target stok akhir 10.
- **Program tiap robot (diulang 5x):** `WORK` (merakit) → `READ` stok → `COMPUTE` +1 → `WRITE` stok.
- **Kegagalan:** pembaruan hilang (lost update); angka akhir kurang dari 10.
- **Alat:** Mutex.
- **Menang:** stok akhir sama dengan target, tanpa pembaruan hilang.
- **Bintang:** ★ benar; ★★ selesai dalam batas tick; ★★★ total waktu tunggu di bawah ambang.
- **Konsep:** race condition, critical section, mutual exclusion.

**Level 1-2 — Pintu Kebesaran** `P1`
- **Situasi:** skenario sama, tapi mutex bisa menutupi rentang ubin apa saja, termasuk proses merakit.
- **Kegagalan:** mutex terlalu besar membuat throughput anjlok.
- **Menang:** data benar **dan** throughput memenuhi target (mutex hanya menutupi baca-hitung-tulis).
- **Konsep:** granularitas lock, trade-off aman vs cepat.

**Level 1-3 — Tiga Mesin, Delapan Robot** `P1`
- **Situasi:** 8 robot memakai 3 mesin identik. Dua robot di satu mesin = konflik/data rusak.
- **Alat:** Counting semaphore dengan nilai awal yang bisa diatur (1 sampai 8).
- **Menang:** tanpa konflik dan utilisasi mesin mencapai target (nilai optimal = 3).
- **Konsep:** counting semaphore, `wait`/`signal`, antrean.

**Level 1-4 — Lampu Sinyal** `P1`
- **Situasi:** robot pengepak baru boleh bekerja setelah ada minimal 3 barang di meja.
- **Kegagalan:** tanpa sinyal, pengepak terus mengecek (busy waiting) dan baterainya terkuras.
- **Alat:** Condition variable (bersama mutex).
- **Menang:** hasil benar dan konsumsi energi di bawah ambang.
- **Konsep:** condition variable, blocking vs busy waiting.

**Level 1-5 — Lini Gabungan** `P2`
- Perakit, penggudang, dan pengepak bekerja bersamaan; pemain memilih kombinasi alat yang tepat.

### Modul 2 — Masalah Klasik Konkurensi

**Level 2-1 — Ban Berjalan (Producer-Consumer)** `P1`
- **Situasi:** 2 sampai 4 producer, 2 sampai 4 consumer, ban dengan N slot (bounded buffer).
- **Kegagalan:** overflow (ban penuh), underflow (ban kosong), race pada ban.
- **Alat:** semaphore `empty`, semaphore `full`, mutex pelindung ban.
- **Bandingkan:** kapasitas N berbeda; rasio producer dan consumer berbeda.
- **Konsep:** bounded buffer, tiga semaphore.

**Level 2-2 — Papan Pengumuman (Readers-Writers)** `P1`
- **Situasi:** banyak reader boleh bersamaan; writer harus eksklusif.
- **Kegagalan:** pembaca melihat data setengah jadi (tanpa pengaman); writer kelaparan di bawah reader priority.
- **Alat:** pilihan kebijakan: reader priority, writer priority, fair (FIFO).
- **Bandingkan:** tiga kebijakan dengan seed sama (waktu tunggu reader, waktu tunggu writer, throughput).
- **Konsep:** readers-writers, starvation, trade-off kebijakan.

**Level 2-3 — Meja Teknisi (Dining Philosophers)** `P1`
- **Situasi:** 5 teknisi melingkar, 5 kunci inggris; tiap teknisi butuh dua kunci.
- **Kegagalan:** semua mengambil kiri bersamaan, lalu deadlock. Tampilkan garis merah siklus tunggu dan empat kotak **kondisi Coffman** (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait).
- **Strategi pemain:** urutan pengambilan resource; batasi 4 teknisi (semaphore); asimetris genap/ganjil; pemulihan (biarkan deadlock, lalu "Rampas kunci").
- **Bandingkan:** throughput, jumlah makan per teknisi (fairness), ada tidaknya starvation.
- **Konsep:** deadlock, kondisi Coffman, pencegahan, deteksi dan pemulihan.

**Level 2-4 — Lini Produksi Penuh** `P2`
- Ban berjalan, papan pengumuman, dan meja teknisi aktif bersamaan; jatah "anggaran alat" terbatas.

## 10. Sistem Skor

- ★ **Benar:** tanpa data rusak, tanpa deadlock, tanpa starvation.
- ★★ **Efisien:** throughput memenuhi target level.
- ★★★ **Hemat:** waktu tunggu (atau energi) di bawah ambang level.
- Ambang tiap level disimpan di data level (`levels/`), bukan di kode engine.

## 11. Pemetaan ke Persyaratan Tugas

| Persyaratan Kategori B | Pemenuhan |
|---|---|
| Minimal 3 algoritma/mekanisme per modul | Modul 1: mutex, semaphore, condition variable. Modul 2: Producer-Consumer, Readers-Writers (3 kebijakan), Dining Philosophers (beberapa strategi) |
| Visualisasi langkah demi langkah | Tombol Step, kontrol kecepatan, log event |
| Input yang dapat diubah pengguna | Mode Sandbox (jumlah thread, kapasitas, token, kebijakan, seed) |
| Perbandingan metrik antar algoritma | Mode Bandingkan dan panel metrik |

## 12. Persyaratan Non-Fungsional

- **Determinisme:** seed yang sama menghasilkan jalannya simulasi yang sama persis.
- **Kinerja:** lancar (sekitar 60 fps) hingga sekitar 12 entitas aktif di layar pada laptop standar mahasiswa.
- **Kompatibilitas:** Chrome/Edge/Firefox versi terbaru, layar desktop minimal 1280 px.
- **Aksesibilitas dasar:** state tidak hanya dibedakan lewat warna (selalu ada label atau ikon).
- **Tanpa backend:** seluruh data level dibundel di aplikasi; progres disimpan di `localStorage`.
- **Bahasa antarmuka:** Indonesia (istilah teknis tetap dalam bahasa Inggris).

## 13. Kriteria Penerimaan MVP (Level 1-1)

- [ ] Tombol **Run, Pause, Step, Reset** berfungsi.
- [ ] Ada input **seed** dan pengaturan **kecepatan** sederhana.
- [ ] Tanpa mutex, angka akhir salah dan terlihat jelas (mis. "Seharusnya 10, hasilnya 8").
- [ ] Pemain dapat **memasang mutex** (klik slot), menjalankan lagi, dan hasilnya benar.
- [ ] Panel hasil menampilkan nilai akhir, jumlah pembaruan hilang, dan waktu tunggu robot.
- [ ] Tes Vitest lulus: tanpa mutex hasil salah pada seed tutorial; dengan mutex hasil benar pada banyak seed.
- [ ] Jalan stabil saat dibuild dan dibuka dari situs statis.

## 14. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Race condition tidak muncul pada seed acak | Seed tutorial terkurasi atau jadwal paksa (`ScriptedSchedule`), dengan tes yang memastikan |
| Integrasi enam orang yang memakai AI menghasilkan gaya berbeda | `CLAUDE.md`, aturan folder, merge sering, antarmuka engine-renderer disepakati lebih dulu |
| Anggota tidak memahami kode hasil AI | Tiap anggota wajib bisa menjelaskan modul miliknya; catat bantuan AI di `docs/AI_USAGE.md` |
| Cakupan membengkak | Fitur dibagi P0/P1/P2; kerjakan P0 dulu, P2 hanya bila waktu longgar |
| Mirip karya lain (Parallel, Dapur Macet!) | Kutip sebagai karya terkait, tonjolkan pembeda (bagian 5) |
| Waktu sebulan terlalu singkat | Walking skeleton minggu 1; buffer minggu 4; pengumpulan H-2 sebelum presentasi |

## 15. Keputusan yang Sudah Diambil

- Stack: React + TypeScript + Phaser 3 + Vite + Tailwind CSS.
- Simulasi OS dalam TypeScript murni per tick, terpisah dari Phaser.
- Aset awal: bentuk geometris (kotak/lingkaran) + label; sprite Kenney.nl hanya polesan akhir (bonus).
- Single-player saja.
- Deadlock hanya sebagai bagian Modul 2 (Dining Philosophers).
