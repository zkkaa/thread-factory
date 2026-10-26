# PRD — Thread Factory: Pabrik Rebutan

> Product Requirements Document. Dokumen ini menjawab **"apa yang dibangun"**.
> Untuk **"bagaimana"**, lihat `ARCHITECTURE.md`. Untuk urutan kerja, lihat `TASKS.md`.

| | |
|---|---|
| Status | Draf v0.2 (direvisi 26 Okt 2026: tampilan game, alur layar, aset; ditandai "diubah/baru sesuai kesepakatan akhir") |
| Konteks | Final Project Sistem Operasi, Ganjil 2026/2027, Kategori B (aplikasi simulasi) |
| Tim | 6 orang |
| Platform | Web (browser desktop), tanpa backend |
| Batas waktu | Ujian 30 Nov sampai 5 Des 2026. Pengumpulan H-2 sebelum presentasi; paling awal Sabtu 28 Nov 2026 (jadwal presentasi pasti: lihat TASKS U-006) |

---

## 1. Ringkasan Produk *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*

**Thread Factory: Pabrik Rebutan** adalah game edukasi web 2D bertema pabrik untuk memahami **sinkronisasi thread** pada sistem operasi. Pemain menjadi *Manajer Lantai* yang mengatur robot-robot pekerja (thread) yang berebut mesin dan papan stok (shared resource). Pemain memasang pengaman (mutex, semaphore, condition variable, kebijakan antrean), menjalankan simulasi, lalu melihat apakah pabrik berjalan benar dan efisien.

**Satu kalimat:** "Kegagalan sinkronisasi dibuat terlihat dan terasa (stok salah hitung, robot menganggur, teknisi saling menunggu), sehingga orang awam memahami konsepnya tanpa membaca kode."

**Tampilan permainan:** game 2D top-down bergaya pabrik. Pak Mandor (karakter pemandu) berbicara lewat dialog bergaya komik; robot berjalan di jalur melengkung dengan checkpoint bulat; kontrol berupa ikon di atas arena (HUD ala game), bukan panel formulir. Rincian ada di bagian 16, 17, dan 18.

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

## 4. Ruang Lingkup *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
### 4.1 Dalam lingkup
- Dua modul: **Modul 1 Pabrik Rebutan** (sinkronisasi dasar) dan **Modul 2 Masalah Klasik Konkurensi**.
- Tiga mode: **Kampanye**, **Sandbox**, **Bandingkan** (dipilih lewat tab di layar Pilih Mode).
- Alur layar lengkap: Beranda, Pilih Mode dan Modul, Pembuka Modul, Peta Level, Intro Level (Pak Mandor), Arena, Popup Hasil, Layar Tamat Modul, Layar Tamat Game (bagian 16).
- Layar pendukung: Panduan, Pengaturan (suara, kurangi animasi, reset progres, mode demo, Kredit), dan Menu Jeda.
- Kontrol simulasi: Run/Pause, Step, Reset, kecepatan, seed.
- Metrik kinerja dan panel hasil.
- Progres kampanye dan pengaturan tersimpan di `localStorage`.
- Aset visual dan audio: Kenney.nl (latar, robot, ikon, audio CC0) dan potret Pak Mandor hasil generator gambar (bagian 18).
- Berjalan sepenuhnya di browser (situs statis).
- **Semua level (termasuk P2) dikerjakan.** Kesepakatan tim: tidak ada fitur yang dikorbankan; prioritas hanya menentukan urutan pengerjaan.

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

## 6. Metafora Konsep Sistem Operasi *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
| Di game | Konsep sisop |
|---|---|
| Robot pekerja | Thread |
| Jalur robot (loop jalan melengkung) | Program sebuah thread |
| Checkpoint bulat (WORK, READ, COMPUTE, WRITE) | Instruksi |
| Satu putaran loop | Satu pengulangan program (`repeat`) |
| Catatan di tangan robot (mis. `r = 3`) | Register thread |
| Papan stok / buku besar | Shared variable |
| Mesin | Shared resource |
| Area di depan papan/mesin | Critical section |
| Pintu dengan satu kunci (pintu masuk + pintu keluar) | Mutex (`LOCK` + `UNLOCK`) |
| Kartu akses (jumlah terbatas) | Counting semaphore |
| Aula mesin berkapasitas | Area dengan kapasitas yang dijaga semaphore |
| Lampu sinyal "siap/tunggu" | Condition variable |
| Antrean di depan pintu | Wait queue |
| Ban berjalan berslot terbatas | Bounded buffer |
| Si Penjadwal (robot RUNNING menyala, robot READY "dibekukan") | Scheduler dan context switch |
| Core 1 dan Core 2 (meja kerja Si Penjadwal) | CPU core (`cores`) |
| Pak Mandor (pemandu tutorial, petunjuk, dan penilai) | Penjelas konsep per level |
| Teknisi dan kunci inggris | Proses dan resource pada Dining Philosophers |

Warna state robot (selalu disertai label, jangan hanya warna): **Ready**, **Running**, **Waiting**, **Terminated**.

## 7. Gaya Interaksi (Keputusan Desain) *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
**Gaya A: pemain menaruh dan mengatur alat pengaman; robot berjalan otomatis.** Pemain *tidak* menulis kode dan *tidak* menyusun perintah per robot.

Alur inti satu level (tidak berubah):
1. **Amati masalah:** pemain menekan Run tanpa pengaman dan melihat kegagalannya.
2. **Pasang pengaman:** pilih alat dari toolbox dan tempatkan di slot pada jalur.
3. **Jalankan lagi:** lihat apakah masalah hilang dan berapa harganya (waktu tunggu).
4. **Hasil dan bintang:** popup hasil menjelaskan apa yang terjadi.

**Padanan teknis (diubah):**
- Jalur robot = loop (jalan melengkung) dengan checkpoint bulat; tiap checkpoint = satu instruksi.
- Satu putaran loop = satu pengulangan program (mis. satu produk).
- Di antara checkpoint ada **slot** pemasangan. Program dengan n instruksi punya n+1 slot bernomor 0..n; slot k adalah celah sebelum checkpoint ke-k (slot 0 sebelum checkpoint pertama, slot n sesudah checkpoint terakhir).
- **Pintu mutex = pintu masuk + pintu keluar.** Pintu masuk di slot `s` (`LOCK` sebelum instruksi `s`) dan pintu keluar di slot `e` dengan `e > s` (`UNLOCK` sesudah instruksi `e-1`). Dalam data alat: `start = s`, `end = e - 1`. Contoh: pintu masuk di slot 1 (sebelum READ) dan pintu keluar di slot 4 (sesudah WRITE) berarti `start = 1`, `end = 3`.
- **Loop bersama:** robot yang berprogram identik berbagi satu loop (dua jalur sejajar), dan alat yang dipasang pada loop berlaku untuk semua robot di loop itu. Robot dengan program berbeda (mis. producer dan consumer) memakai jalur terpisah.
- **Cara memasang:** seret dari toolbox ke slot (pintu masuk dahulu, lalu pintu keluar). Mode klik slot tetap tersedia sebagai alternatif (touchpad dan aksesibilitas).

Detail layar dan interaksi ada di bagian 16 dan 17; arsitekturnya di `ARCHITECTURE.md`.

## 8. Mode Permainan *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
| Mode | Deskripsi | Prioritas |
|---|---|---|
| **Kampanye** | Level berurutan dengan peta level, dialog Pak Mandor, petunjuk bertahap, dan sistem bintang | P0/P1 |
| **Sandbox** | Arena level yang sama dengan laci Parameter: pemain mengubah jumlah robot, kapasitas buffer, jumlah token, kebijakan, dan seed (tanpa bintang) | P1 |
| **Bandingkan** | Layar terbagi dua: dua konfigurasi dijalankan berdampingan dengan seed sama, hasil dalam tabel dan grafik | P1 |

### Aturan buka-kunci *(baru)*
- Sebuah level terbuka bila level sebelumnya selesai (minimal 1 bintang).
- **Modul 2 terbuka setelah Level 1-4 selesai.**
- Sandbox dan Bandingkan untuk suatu level terbuka setelah level kampanye itu selesai.
- Pengaturan memuat sakelar **"Buka semua level (mode demo)"** agar dosen dan penguji dapat melihat seluruh isi game tanpa menamatkan kampanye.

### Kontrol simulasi
- **Play/Pause** (satu tombol toggle), **Step**, **Reset**
- **Kecepatan:** 0.5x, 1x, 5x (mengubah laju tick, bukan logika)
- **Seed:** angka input agar kejadian bisa diulang persis sama (ditampilkan sebagai chip kecil; klik untuk mengubah)

### Metrik
Throughput (pekerjaan selesai per tick), waktu tunggu rata-rata dan maksimum, utilisasi mesin/aula, **utilisasi core (Level 1-2)**, jumlah pembaruan data yang hilang (data corruption), **jumlah bentrok di aula (Level 1-3)**, jumlah deadlock terdeteksi, indikator starvation, dan (Level 1-4) konsumsi energi akibat busy waiting.

## 9. Spesifikasi Level *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
Prioritas: **P0** = MVP, **P1** = wajib, **P2** = bonus. *Kesepakatan akhir: semua level tetap dikerjakan; prioritas hanya menentukan urutan.*

### Konten wajib setiap level *(baru)*
- **Intro** 2 sampai 3 halaman dialog Pak Mandor (situasi, misi beserta kriteria bintang, petunjuk alat).
- **Petunjuk bertahap** minimal 3 tingkat (dari samar sampai hampir jelas) untuk tombol "Tanya Pak Mandor".
- **Penjelasan** konsep saat lulus dan saat gagal (benar secara konsep sisop).
- **Daftar konsep** yang dipelajari (dipakai Layar Tamat Modul dan Tamat Game).
- **Tata letak arena** (data di `game/layouts/`), **ambang bintang**, dan tes level.

### Modul 1: Pabrik Rebutan (Sinkronisasi Dasar)

**Level 1-1: Bug Papan Stok** `P0`
- **Situasi:** Robot A dan B masing-masing merakit 5 produk, lalu menambah angka di Papan Stok. Target stok akhir 10.
- **Program tiap robot (diulang 5x):** `WORK` (merakit) → `READ` stok → `COMPUTE` +1 → `WRITE` stok.
- **Kegagalan:** pembaruan hilang (lost update); angka akhir kurang dari 10.
- **Alat:** Pintu Mutex (pintu masuk dan pintu keluar), berlaku untuk kedua robot di loop bersama.
- **Menang:** stok akhir sama dengan target, tanpa pembaruan hilang.
- **Bintang:** ★ benar; ★★ selesai dalam batas tick; ★★★ total waktu tunggu di bawah ambang. Bintang hanya dinilai pada seed tutorial (seed 10).
- **Konsep:** race condition, critical section, mutual exclusion.
- **Tata letak:** loop bersama (dua jalur sejajar), 4 checkpoint, papan stok di tengah (terhubung ke READ dan WRITE), 5 slot.
- **Catatan:** dengan `cores = 1`, total tick dengan mutex apa pun tetap sama (selalu ada robot yang bisa jalan); hanya waktu tunggu yang berubah. Karena itu bintang ★★ di level ini nyaris pasti terpenuhi, dan harga granularitas baru diuji di Level 1-2.

**Level 1-2: Pintu Kebesaran** `P1`
- **Situasi:** skenario sama, tapi pintu bisa menutupi rentang slot apa saja, termasuk proses merakit. Scheduler memakai **2 core** (`cores = 2`).
- **Kegagalan:** pintu terlalu besar membuat salah satu core menganggur sehingga throughput anjlok (data tetap benar). Pada `cores = 1` perbedaan ini tidak terlihat, jadi level ini wajib 2 core.
- **Menang:** data benar **dan** throughput memenuhi target (pintu hanya menutupi baca-hitung-tulis). Ambang dinyatakan sebagai batas tick, setara dengan throughput karena beban kerja tetap.
- **Tampilan:** indikator Core 1 dan Core 2 (sibuk/menganggur) dan meter utilisasi core.
- **Konsep:** granularitas lock, trade-off aman vs cepat.
- **Tata letak:** loop 1-1 ditambah indikator core.

**Level 1-3: Tiga Mesin, Delapan Robot** `P1`
- **Situasi:** 8 robot memakai aula mesin yang berisi 3 mesin identik (kapasitas 3). **Bentrok** terjadi bila jumlah robot di aula melebihi kapasitas (data rusak).
- **Alat:** Kartu Akses (counting semaphore) dengan nilai awal yang bisa diatur (1 sampai 8), diseret ke pintu aula.
- **Menang:** tanpa bentrok dan utilisasi aula mencapai target (nilai optimal = 3: lebih dari 3 bentrok, kurang dari 3 mesin menganggur).
- **Konsep:** counting semaphore, `wait`/`signal`, antrean.
- **Tata letak:** aula mesin dengan pintu aula, rak kartu akses, antrean robot. Scheduler memakai `cores` sama dengan jumlah robot (8) supaya hanya kapasitas aula yang membatasi kecepatan.

**Level 1-4: Lampu Sinyal** `P1`
- **Situasi:** robot pengepak baru boleh bekerja setelah ada minimal 3 barang di meja.
- **Kegagalan:** tanpa sinyal, pengepak terus mengecek (busy waiting) dan baterainya terkuras.
- **Alat:** Lampu Sinyal (condition variable) bersama Pintu Mutex.
- **Menang:** hasil benar dan konsumsi energi di bawah ambang.
- **Tampilan:** meter baterai pengepak; saat menunggu dengan benar ia tidur (zzz) sampai lampu hijau.
- **Konsep:** condition variable, blocking vs busy waiting.
- **Tata letak:** meja barang, lampu sinyal, jalur perakit dan pengepak.

**Level 1-5: Lini Gabungan** `P2`
- Perakit, penggudang, dan pengepak bekerja bersamaan; pemain memilih kombinasi alat yang tepat dari semua alat Modul 1.
- **Tata letak:** gabungan elemen 1-1 sampai 1-4.

### Modul 2: Masalah Klasik Konkurensi

**Level 2-1: Ban Berjalan (Producer-Consumer)** `P1`
- **Situasi:** 2 sampai 4 producer, 2 sampai 4 consumer, ban dengan N slot (bounded buffer).
- **Kegagalan:** overflow (ban penuh: barang jatuh), underflow (ban kosong: tangan consumer meraih kosong), race pada ban.
- **Alat:** semaphore `empty`, semaphore `full`, mutex pelindung ban.
- **Bandingkan:** kapasitas N berbeda; rasio producer dan consumer berbeda.
- **Konsep:** bounded buffer, tiga semaphore.
- **Tata letak:** jalur producer di kiri dan jalur consumer di kanan (program berbeda, jalur terpisah) dengan ban di tengah.

**Level 2-2: Papan Pengumuman (Readers-Writers)** `P1`
- **Situasi:** banyak reader boleh bersamaan; writer harus eksklusif.
- **Kegagalan:** pembaca melihat data setengah jadi (tanpa pengaman); writer kelaparan di bawah reader priority (bar kesabaran writer habis).
- **Alat:** sakelar kebijakan di papan: reader priority, writer priority, fair (FIFO).
- **Bandingkan:** tiga kebijakan dengan seed sama (waktu tunggu reader, waktu tunggu writer, throughput).
- **Konsep:** readers-writers, starvation, trade-off kebijakan.
- **Tata letak:** papan pengumuman besar, barisan reader, barisan writer.

**Level 2-3: Meja Teknisi (Dining Philosophers)** `P1`
- **Situasi:** 5 teknisi melingkar, 5 kunci inggris; tiap teknisi butuh dua kunci.
- **Kegagalan:** semua mengambil kiri bersamaan, lalu deadlock. Tampilkan garis merah siklus tunggu dan empat kotak **kondisi Coffman** (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait).
- **Strategi pemain:** urutan pengambilan resource; batasi 4 teknisi (semaphore); asimetris genap/ganjil; pemulihan (biarkan deadlock, lalu "Rampas kunci").
- **Bandingkan:** throughput, jumlah makan per teknisi (fairness), ada tidaknya starvation.
- **Konsep:** deadlock, kondisi Coffman, pencegahan, deteksi dan pemulihan.
- **Tata letak:** meja bundar (bukan jalur dengan checkpoint); langkah tiap teknisi ditampilkan sebagai cincin progres.

**Level 2-4: Lini Produksi Penuh** `P2`
- Ban berjalan, papan pengumuman, dan meja teknisi aktif bersamaan; jatah "anggaran alat" terbatas (ditampilkan sebagai koin di toolbox).
- **Tata letak:** tiga area dalam satu arena.

## 10. Sistem Skor *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
- ★ **Benar:** semua robot selesai, tanpa data rusak, tanpa deadlock, tanpa starvation.
- ★★ **Efisien:** bintang bertingkat; hanya dihitung bila ★ terpenuhi dan throughput (atau batas tick) memenuhi target level.
- ★★★ **Hemat:** hanya dihitung bila ★★ terpenuhi dan waktu tunggu (atau energi) di bawah ambang level.
- Ambang tiap level disimpan di data level (`levels/`), bukan di kode engine.
- **Bintang hanya dinilai pada seed tutorial level.** Pada seed lain, hasil lulus/gagal tetap ditampilkan, tetapi bintang tidak dinilai (waktu tunggu bergantung seed). Level tanpa seed tutorial dinilai pada seed mana pun.
- Simulasi yang berhenti sebelum semua robot selesai (macet atau melewati batas tick) dinilai gagal dengan pesan yang jelas.
- Penilaian dihitung oleh controller (`evaluateLevel`) dan dibaca UI; UI dan Phaser tidak menghitung sendiri.

## 11. Pemetaan ke Persyaratan Tugas

| Persyaratan Kategori B | Pemenuhan |
|---|---|
| Minimal 3 algoritma/mekanisme per modul | Modul 1: mutex, semaphore, condition variable. Modul 2: Producer-Consumer, Readers-Writers (3 kebijakan), Dining Philosophers (beberapa strategi) |
| Visualisasi langkah demi langkah | Tombol Step, kontrol kecepatan, log event |
| Input yang dapat diubah pengguna | Mode Sandbox (jumlah thread, kapasitas, token, kebijakan, seed) |
| Perbandingan metrik antar algoritma | Mode Bandingkan dan panel metrik |

## 12. Persyaratan Non-Fungsional *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
- **Determinisme:** seed yang sama menghasilkan jalannya simulasi yang sama persis.
- **Kinerja:** lancar (sekitar 60 fps) hingga sekitar 12 entitas aktif di layar pada laptop standar mahasiswa. Arena Level 1-3 (8 robot) dan Level 2-4 diuji khusus.
- **Kompatibilitas:** Chrome/Edge/Firefox versi terbaru, layar desktop minimal 1280 px. Kanvas arena mengikuti ukuran area yang tersedia (skala FIT) tanpa scroll horizontal.
- **Aksesibilitas dasar:** state tidak hanya dibedakan lewat warna (selalu ada label atau ikon); setiap tombol ikon punya `aria-label` dan tooltip; pengaturan "kurangi animasi" dihormati; kontras teks memadai.
- **Tanpa backend:** seluruh data level dan aset dibundel di aplikasi; progres dan pengaturan disimpan di `localStorage` (dibungkus try/catch, tetap berjalan bila penyimpanan nonaktif).
- **Bahasa antarmuka:** Indonesia (istilah teknis tetap dalam bahasa Inggris).
- **Tanpa library baru:** ikon SVG, tooltip, dan grafik dibuat sendiri; menambah dependency perlu persetujuan tim.
- **Kredit dan lisensi:** setiap aset tercatat (sumber, lisensi); aset hasil generator gambar tercatat juga di `docs/AI_USAGE.md`.

## 13. Kriteria Penerimaan MVP (Level 1-1)

- [ ] Tombol **Run, Pause, Step, Reset** berfungsi.
- [ ] Ada input **seed** dan pengaturan **kecepatan** sederhana.
- [ ] Tanpa mutex, angka akhir salah dan terlihat jelas (mis. "Seharusnya 10, hasilnya 8").
- [ ] Pemain dapat **memasang mutex** (klik slot), menjalankan lagi, dan hasilnya benar.
- [ ] Panel hasil menampilkan nilai akhir, jumlah pembaruan hilang, dan waktu tunggu robot.
- [ ] Tes Vitest lulus: tanpa mutex hasil salah pada seed tutorial; dengan mutex hasil benar pada banyak seed.
- [ ] Jalan stabil saat dibuild dan dibuka dari situs statis.

## 13A. Kriteria Penerimaan Tampilan Baru (Milestone M2) *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
- [ ] Alur Beranda → Pilih Mode → Pilih Modul → Pembuka Modul → Peta Level → Intro Level → Arena dapat dilalui.
- [ ] Intro Pak Mandor berupa dialog bergaya komik (potret besar, gelembung, tombol Lanjut dan Lewati).
- [ ] HUD sesuai bagian 17.1: ikon kontrol dengan tooltip, toolbox bawah, log kiri bawah, chip kecepatan dan seed.
- [ ] Arena Level 1-1: loop melengkung, 4 checkpoint bulat, papan stok di tengah, dua robot bernama dengan label status.
- [ ] Pintu mutex dapat dipasang dengan seret (masuk lalu keluar); mode klik slot juga berfungsi.
- [ ] Popup hasil menampilkan Pak Mandor (sedih saat salah, senang saat benar), "Seharusnya X, hasilnya Y", kartu angka, dan bintang.
- [ ] Progres (bintang, level terbuka) tersimpan dan terbaca kembali setelah halaman dimuat ulang.
- [ ] Sekitar 60 fps pada resolusi 1280x720; tanpa scroll horizontal.
- [ ] Semua aset yang dipakai tercatat di Kredit dan `docs/ASSETS.md`.

## 14. Risiko dan Mitigasi *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
| Risiko | Mitigasi |
|---|---|
| Race condition tidak muncul pada seed acak | Seed tutorial terkurasi atau jadwal paksa (`ScriptedSchedule`), dengan tes yang memastikan |
| Integrasi enam orang yang memakai AI menghasilkan gaya berbeda | `CLAUDE.md`, aturan folder, merge sering, antarmuka engine-renderer disepakati lebih dulu |
| Anggota tidak memahami kode hasil AI | Tiap anggota wajib bisa menjelaskan modul miliknya; catat bantuan AI di `docs/AI_USAGE.md` |
| Cakupan membengkak | Kesepakatan: tidak ada fitur yang dikorbankan; urutan P0, P1, P2 dijaga; cek di tiap milestone, dan bila tertinggal lebih dari 2 hari tim memutuskan bersama (jangan mengorbankan stabilitas demo) |
| Mirip karya lain (Parallel, Dapur Macet!) | Kutip sebagai karya terkait, tonjolkan pembeda (bagian 5) |
| Waktu terbatas (pengumpulan paling awal 28 Nov 2026) | Pekerjaan dibagi dalam jalur paralel (lihat TASKS); feature freeze 20 Nov; minggu terakhir hanya uji, dokumentasi, video |
| **Gaya aset tidak seragam** (pixel Kenney vs potret ilustrasi) | Potret hanya tampil di lapisan UI dengan bingkai bergaya sama; dunia permainan memakai satu keluarga aset; palet warna HUD disepakati lebih dulu |
| **Potret Pak Mandor tidak konsisten antar-ekspresi** | Minimal 3 ekspresi; hasilkan dari gambar resmi yang sama sebagai referensi; periksa berdampingan sebelum dipakai |
| **Aset hasil generator: lisensi dan kewajiban pelaporan** | Cek ketentuan generator; catat prompt, generator, tanggal di `docs/AI_USAGE.md` dan Kredit |
| **Seret-lepas rumit atau tidak jalan di semua perangkat** | Mode klik slot sebagai alternatif; logika slot dan penempatan dibuat murni dan dites |
| **Layout arena di-hardcode sehingga tiap level mahal** | Tata letak sebagai data (`game/layouts/`) dengan tes validasi; jenis arena: loop, aula, ban, meja |
| **Kinerja Phaser turun pada arena ramai** | Uji dini (Level 1-3 dengan 8 robot); batasi efek; pakai tween ringan |

## 15. Keputusan yang Sudah Diambil *(diubah sesuai kesepakatan akhir, 26 Okt 2026)*
- Stack: React + TypeScript + Phaser 3 + Vite + Tailwind CSS.
- Simulasi OS dalam TypeScript murni per tick, terpisah dari Phaser.
- **Aset (diubah):** latar, robot, dan ikon memakai aset Kenney.nl (mis. Tiny Factory) sejak awal; potret Pak Mandor hasil generator gambar (gambar resmi, beberapa ekspresi). Bentuk geometris hanya sebagai placeholder sementara pengembangan.
- Single-player saja.
- Deadlock hanya sebagai bagian Modul 2 (Dining Philosophers).
- **Tujuh keputusan tampilan (baru, disepakati 26 Okt 2026):**
  1. Pembuka modul berupa kartu judul lalu peta level (tanpa hitung mundur 3-2-1).
  2. Modul 2 terkunci sampai Level 1-4 selesai; ada sakelar mode demo di Pengaturan.
  3. Sandbox dan Bandingkan muncul sebagai tab di layar Pilih Mode, terbuka per level setelah level kampanyenya selesai.
  4. Pintu mutex di Level 1-1 berlaku untuk seluruh loop bersama.
  5. Pintu masuk dan keluar diseret sebagai dua objek; mode klik slot sebagai alternatif.
  6. Pak Mandor punya target 4 ekspresi (netral, senang, sedih, berpikir), minimal 3.
  7. Level 1-2 memakai 2 core; bentrok di Level 1-3 didefinisikan sebagai jumlah robot di aula melebihi kapasitas.
- **Tidak ada tugas atau fitur yang dikorbankan** (kesepakatan tim, 26 Okt 2026).
- Bintang dinilai hanya pada seed tutorial level.
- Mockup hasil generator hanyalah gambaran alur dan UI; tata letak arena ditentukan oleh dokumen ini.

## 16. Alur Layar dan Antarmuka *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
Alur besar:

```
Beranda → Pilih Mode ─┬─ Kampanye → Pilih Modul → Pembuka Modul → Peta Level → Intro Level → Arena ⇄ Popup Hasil
                      │                                                                    ├─ benar → level berikutnya / Tamat Modul / Tamat Game
                      │                                                                    └─ salah → Reset (atau Petunjuk) → Arena
                      ├─ Sandbox → pilih level terbuka → Arena + laci Parameter
                      └─ Bandingkan → pilih level terbuka → layar terbagi dua
Beranda → Panduan | Pengaturan (termasuk Kredit)
Arena → Menu Jeda → Lanjut | Ulangi Level | Peta Level | Pengaturan
```

Kode layar dipakai di TASKS dan ARCHITECTURE. Latar tiap layar memakai aset dunia permainan (bagian 18).

### S1. Beranda
- Logo "Thread Factory: Pabrik Rebutan", Pak Mandor (jempol), tagline, nomor versi.
- Tombol: **Mulai Game** (berubah menjadi **Lanjutkan** bila ada progres), **Panduan**, **Pengaturan**.
- Transisi: Mulai/Lanjutkan → S2.

### S2. Pilih Mode dan Modul
- Tab di atas: **Kampanye | Sandbox | Bandingkan**.
- Kampanye: dua kartu modul (judul, deskripsi singkat, pratinjau, progres `x / y level`, ikon kunci bila terkunci dengan syarat pembukaannya). Klik modul terbuka → S3.
- Sandbox dan Bandingkan: daftar level yang terbuka; level terkunci diberi keterangan syarat ("Selesaikan Level 1-1 dahulu").
- Tombol kembali → S1.

### S3. Pembuka Modul dan Peta Level
- **Kartu judul:** judul modul, deskripsi singkat, daftar konsep yang akan dipelajari. Lanjut otomatis sekitar 3 detik; ketuk atau tombol **Lewati** untuk langsung ke peta. (Dipilih alih-alih hitung mundur 3-2-1 karena simulasi tidak berjalan otomatis; pemain sendiri yang menekan Run.)
- **Peta level:** titik level berurutan dengan bintang tertinggi, ikon kunci untuk level terkunci, dan sorotan pada level berikutnya. Tombol **Mulai Level X** atau **Lanjut Level X**. Level lama dapat diulang untuk mengejar bintang.
- Pilih level → S4. Kembali → S2.

### S4. Intro Level
- Pak Mandor besar di kiri (hampir memenuhi layar), gelembung dialog di kanan, latar arena level yang diburamkan, badge "Level 1-1: Bug Papan Stok" di kiri atas.
- Dialog 2 sampai 3 halaman: situasi, misi (target dan kriteria bintang), petunjuk alat. Tombol **Lanjut** (halaman terakhir: **Mulai**) dan **Lewati**.
- Transisi: selesai → S5.

### S5. Arena
Layar permainan utama. Rincian di bagian 17.

### S6. Popup Hasil
- Muncul di atas arena saat simulasi selesai. Judul dari data level (mis. "Waduh, Stok Salah!" atau "Bagus! Sinkronisasi Berhasil!").
- Badge **SALAH** atau **BENAR** (ikon dan teks), potret Pak Mandor (sedih atau senang) dengan gelembung "Seharusnya 10, hasilnya 8."
- Tiga kartu angka: **Pembaruan hilang**, **Total tick**, **Waktu tunggu**.
- Bintang muncul satu per satu dengan rincian kriteria (benar, efisien, hemat). Bila seed bukan seed tutorial: catatan "Bintang hanya dinilai pada seed tutorial (10)".
- Pesan Pak Mandor (penjelasan konsep untuk kasus lulus atau gagal).
- Tombol saat **salah**: **Reset Simulasi**, **Petunjuk** (muncul setelah 2 kegagalan dalam sesi), **Tutup**.
- Tombol saat **benar**: **Lanjut ke Level Berikutnya** (pada level terakhir modul: ke S7), **Ulangi untuk Bintang** (bila belum 3 bintang), **Tutup**.
- Di Sandbox dan Bandingkan, popup berupa ringkasan angka dan penjelasan tanpa bintang.

### S7. Tamat Modul
- Pak Mandor senang, ringkasan bintang modul, daftar konsep yang dipelajari, pembukaan modul berikutnya. Tombol: **Lanjut ke Modul Berikutnya** dan **Peta Level**.

### S8. Tamat Game
- Tampil setelah seluruh level kampanye (termasuk Level 1-5 dan 2-4) selesai.
- Ucapan selamat dari Pak Mandor, total bintang `x / y`, daftar semua konsep (race condition sampai deadlock). Tombol: **Sandbox**, **Bandingkan**, **Ulangi Level**, **Kredit**, **Beranda**.

### S9. Panduan
- Cara bermain dalam 3 langkah (amati, pasang, jalankan), arti status robot (READY, RUNNING, WAITING, TERMINATED), arti kontrol HUD, glosarium istilah (race condition, critical section, mutex, semaphore, condition variable, deadlock, starvation). Isi harus benar secara konsep.

### S10. Pengaturan dan Kredit
- Volume suara, **Kurangi animasi**, **Reset progres** (dengan konfirmasi), **Buka semua level (mode demo)**.
- Kredit: daftar aset beserta sumber dan lisensi, catatan bahwa potret Pak Mandor dibuat dengan bantuan generator gambar, daftar anggota tim.

### S11. Sandbox
- Arena level yang dipilih ditambah laci **Parameter** (hanya parameter yang relevan untuk level itu: jumlah robot, kapasitas buffer, jumlah token, kebijakan, seed). Tanpa bintang.

### S12. Bandingkan
- Layar terbagi dua panel (A dan B). Tiap panel punya konfigurasi sendiri (alat dan parameter) dengan **seed yang sama**. Run menjalankan keduanya serentak; arena berupa versi mini.
- Di bawah: tabel perbandingan metrik dan grafik batang (throughput, waktu tunggu, pembaruan hilang, deadlock, fairness) beserta penanda "lebih baik" per metrik.

### S13. Menu Jeda (overlay di Arena)
- **Lanjut**, **Ulangi Level**, **Peta Level**, **Pengaturan**.

## 17. Arena dan HUD *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
### 17.1 Tata letak HUD
HUD adalah lapisan React di atas kanvas Phaser yang memenuhi layar.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Badge level]  [Misi ▾]                  [▶/⏸] [⏭ Step] [↻ Reset] [1x] [Seed 10] [≡] │
│                                                                            │
│                         A R E N A  (Phaser)                                │
│                                                                            │
│ [Log Kejadian ▾]                [ Toolbox: Pintu Mutex | Hapus ]  [Metrik ▾]│
└────────────────────────────────────────────────────────────────────────────┘
```

### 17.2 Komponen HUD
| Komponen | Isi dan perilaku |
|---|---|
| Badge level (kiri atas) | Ikon helm dan "Level 1-1: Bug Papan Stok" |
| Chip Misi | Target (mis. stok 10) dan kriteria bintang; dapat dilipat |
| Kontrol (kanan atas) | Tombol toggle Play/Pause, Step, Reset berupa ikon dengan tooltip dan `aria-label`; chip kecepatan (0.5x/1x/5x); chip Seed (klik untuk mengubah, mengubah seed me-reset simulasi); chip status ("Siap/Berjalan/Dijeda/Selesai") dengan penghitung tick |
| Menu (≡) | Menu Jeda (S13) dan legenda arti status robot |
| Toolbox (bawah tengah) | Hanya alat yang tersedia di level, ditambah **Hapus**; alat diseret ke arena; terkunci setelah simulasi dimulai |
| Log Kejadian (kiri bawah) | Daftar kejadian (terbaru di atas), dapat dilipat; perpindahan READY/RUNNING disembunyikan secara default |
| Laci Metrik (kanan bawah) | Nilai variabel target, pembaruan hilang, throughput, waktu tunggu per robot; opsional |
| Tanya Pak Mandor | Tombol petunjuk bertahap (tanpa membocorkan jawaban) |
| Panel error | Pesan error engine; Run dan Step terkunci sampai Reset |

Yang **dihapus** dari mockup: tombol "Jalur (Opsional)" di toolbox, dan panel Metrik yang selalu terbuka (diganti badge waktu tunggu per robot dan laci).

### 17.3 Arena Level 1-1
- **Loop bersama** melengkung dengan dua jalur sejajar (Robot A dan B), arah panah di jalan, **4 checkpoint bulat** (WORK, READ, COMPUTE, WRITE), dan **papan stok di tengah** yang terhubung ke READ dan WRITE (panah aliran nilai saat membaca/menulis).
- **Robot:** sprite dengan nama di atasnya, badge status (READY/RUNNING/WAITING/TERMINATED), badge waktu tunggu, penghitung putaran ("Produk 3/5"), dan **catatan di tangan** (mis. `r = 3`) saat memegang nilai hasil READ.
- **Si Penjadwal:** robot RUNNING menyala; robot READY "dibekukan" (ikon es atau zzz).
- **Pintu mutex:** gerbang melintang di jalan (terbuka/tertutup), pemegang kunci ditampilkan, robot yang menunggu berbaris di depan pintu.
- **Tooltip checkpoint:** penjelasan awam tiap instruksi (mis. READ: "membaca angka stok ke catatan robot").
- **Slot:** penanda di celah antar checkpoint (5 slot untuk 4 checkpoint), menyala saat alat diseret.

### 17.4 Alur memasang pintu mutex
1. Pemain menyeret **Pintu Mutex** dari toolbox ke sebuah slot; pintu masuk terpasang.
2. Pintu keluar otomatis "dipegang": hanya slot yang sah (setelah pintu masuk) yang menyala. Pemain menaruhnya.
3. Segmen yang terlindungi diwarnai dan diberi label ikon kunci.
4. Pintu terpasang dapat dipindah dengan menyeretnya, atau dilepas dengan menyeretnya ke **Hapus**. Esc membatalkan pintu yang sedang dipegang.
5. **Mode klik slot:** klik toolbox lalu klik slot masuk dan slot keluar (alternatif untuk touchpad dan aksesibilitas).
6. Setiap perubahan alat mengembalikan simulasi ke tick 0 (konfigurasi dibangun ulang); alat terkunci setelah Run dimulai sampai Reset.

### 17.5 Perbedaan arena per level
| Level | Jenis arena | Yang berbeda |
|---|---|---|
| 1-2 | loop | Indikator Core 1/Core 2 dan meter utilisasi; pintu bebas ditaruh di slot mana pun termasuk sebelum WORK |
| 1-3 | aula | 8 robot antre di pintu aula, 3 mesin, rak Kartu Akses, slider nilai semaphore (1 sampai 8), percikan "BENTROK" |
| 1-4 | meja | Pengepak dengan meter baterai, meja barang, Lampu Sinyal diseret ke checkpoint pengepak |
| 1-5 | gabungan | Elemen 1-1 sampai 1-4 bersama |
| 2-1 | ban | Jalur producer dan consumer terpisah, ban N slot, efek overflow dan underflow |
| 2-2 | papan | Barisan reader dan writer, sakelar kebijakan, bar kesabaran writer |
| 2-3 | meja bundar | 5 teknisi dan 5 kunci, garis merah siklus tunggu, empat kotak Coffman, tombol "Rampas kunci" |
| 2-4 | gabungan | Tiga area, koin anggaran alat |

### 17.6 Aksesibilitas dan kenyamanan
- Warna status selalu disertai label atau ikon; tombol ikon punya `aria-label` dan tooltip; dialog dapat ditutup dengan Esc dan fokusnya terkelola.
- "Kurangi animasi" menonaktifkan efek berlebihan (bintang berloncatan, goyangan) tetapi tidak mengubah logika simulasi.
- Layar minimal 1280 px; kanvas diskalakan (FIT) di area yang tersedia.

## 18. Aset dan Karakter *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
### 18.1 Prinsip
- **Dunia permainan** (arena, robot, checkpoint) memakai satu keluarga aset pixel (Kenney).
- **Lapisan UI** (dialog, popup, HUD) memuat potret ilustrasi Pak Mandor dengan bingkai bergaya sama. Potret tidak diletakkan di dalam dunia pixel, supaya perbedaan gaya tidak mencolok.
- Gambar mockup hasil generator tidak dipakai langsung sebagai aset (teks dan UI tertanam di dalamnya); hanya sebagai acuan.

### 18.2 Sumber
| Kebutuhan | Sumber | Catatan |
|---|---|---|
| Latar dan properti pabrik | Kenney "Tiny Factory" (2D, ubin 16x16, CC0) | Skala 4x = ubin 64 px (sesuai `TILE_SIZE`); pakai penskalaan nearest-neighbor |
| Robot | Kenney "Robot Pack" (2D, tampak atas dan samping, CC0) | Belum diverifikasi kecocokan gayanya; cek sebelum dipilih; beri tint warna A dan B |
| Tombol dan ikon UI | Ikon SVG buatan sendiri; paket UI Kenney bila perlu | Tanpa library ikon baru |
| Potret Pak Mandor | Hasil generator gambar (gambar resmi dipilih tim) | Wajib dicatat di `docs/AI_USAGE.md` dan Kredit |
| Audio | Paket audio CC0 (mis. dari Kenney atau sumber CC0 lain) | Sumber dan lisensi dicatat; ada pengaturan volume |

### 18.3 Pipeline potret Pak Mandor
1. Tim memilih satu gambar resmi (kanon).
2. Hasilkan ekspresi **netral/menyambut, senang (jempol), sedih, berpikir** (minimal tiga yang pertama) memakai gambar kanon sebagai referensi.
3. Setiap gambar: latar warna polos, **tanpa teks** (tulisan nama di baju sering rusak; label diberikan UI).
4. Hapus latar secara manual (alat bebas, tidak menambah dependency) dan simpan sebagai PNG transparan, tinggi sekitar 1024 px, lalu optimalkan ukuran.
5. Periksa berdampingan; bila tidak konsisten, kurangi menjadi tiga ekspresi.
6. Potong bagian kepala dari gambar yang sama untuk avatar kecil (HUD, tombol petunjuk).
7. Catat prompt, generator, tanggal, dan peninjau; cek ketentuan penggunaan generator.

### 18.4 Pencatatan
- README bagian **Kredit** dan layar Kredit di game memuat semua sumber dan lisensi.
- `docs/ASSETS.md` memuat tabel aset (nama berkas, ukuran, sumber, lisensi, status).
- `docs/AI_USAGE.md` memuat aset hasil generator.
- Aset disimpan di `public/assets/` (`characters/`, `world/`, `ui/`, `audio/`).

### 18.5 Daftar kebutuhan aset
| Aset | Dipakai di | Sumber | Status |
|---|---|---|---|
| Potret Pak Mandor (4 ekspresi) | S1, S4, S6, S7, S8, petunjuk | Generator | Belum |
| Logo Thread Factory | S1 | Dibuat tim/generator | Belum |
| Latar Beranda | S1 | Kenney + komposisi | Belum |
| Tile latar arena (lantai, properti) | S5 | Kenney Tiny Factory | Belum |
| Sprite robot (A, B, dan variasi) | S5 | Kenney Robot Pack | Belum |
| Checkpoint, ikon instruksi | S5 | Dibuat tim | Belum |
| Gerbang/pintu mutex (terbuka/tertutup) | S5 | Kenney/dibuat tim | Belum |
| Papan stok | S5 | Kenney/dibuat tim | Belum |
| Kartu akses, lampu sinyal, ban, kunci inggris | Level 1-3 sampai 2-3 | Kenney/dibuat tim | Belum |
| Ikon HUD (SVG) | S5 | Dibuat tim | Belum |
| Efek (bintang, percikan, zzz) | S5, S6 | Dibuat tim | Belum |
| Audio (klik, benar, salah, kunci) | Semua | CC0 | Belum |

## 19. Riwayat Perubahan *(baru, sesuai kesepakatan akhir, 26 Okt 2026)*
| Versi | Tanggal | Perubahan |
|---|---|---|
| v0.1 | Okt 2026 (awal) | Draf awal: konsep, level, mode, metrik, skor |
| v0.2 | 26 Okt 2026 | Alur layar lengkap (bagian 16), arena dan HUD (17), aset dan karakter (18), aturan buka-kunci, bintang hanya pada seed tutorial, Level 1-2 memakai 2 core, definisi bentrok Level 1-3, tidak ada fitur yang dikorbankan, batas waktu ujian |
