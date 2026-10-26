# Wireframe Teks - Thread Factory: Pabrik Rebutan

> Tugas **U-004**. Sketsa teks (ASCII) untuk layar S1 sampai S13 dan arena Level 1-1. Sumber: `PRD.md` bagian 16 dan 17. Mockup gambar hasil generator hanyalah acuan suasana; tata letak resmi ada di berkas ini dan di PRD.

**Cara membaca:** `[ ... ]` tombol, `( ... )` chip atau badge, `[#]` ikon kunci, `***` bintang, `>` panah. Ukuran acuan layar 1280 x 720 px. Kotak bertitik adalah placeholder aset.

**Kode layar dan berkas komponen**

| Kode | Layar | Komponen (`src/ui/screens/`) |
|---|---|---|
| S1 | Beranda | HomeScreen |
| S2 | Pilih Mode dan Modul | ModeSelectScreen |
| S3a | Pembuka Modul | ModuleIntroScreen |
| S3b | Peta Level | LevelMapScreen |
| S4 | Intro Level | LevelIntroScreen |
| S5 | Arena | PlayScreen |
| S6 | Popup Hasil | ResultDialog (overlay S5) |
| S7 | Tamat Modul | ModuleCompleteScreen |
| S8 | Tamat Game | GameCompleteScreen |
| S9 | Panduan | GuideScreen |
| S10 | Pengaturan dan Kredit | SettingsScreen |
| S11 | Sandbox | SandboxScreen |
| S12 | Bandingkan | CompareScreen |
| S13 | Menu Jeda | PauseMenu (overlay S5) |

## S1 - Beranda

```
+- S1 Beranda  [latar: pabrik] --------------------------------------------+
| +--------------------------------+      +----------------------+         |
| |                                |      |                      |         |
| | THREAD FACTORY                 |      | Pak Mandor           |         |
| | (Pabrik Rebutan)               |      | (jempol)             |         |
| |                                |      |                      |         |
| | Belajar sinkronisasi dan       |      |    . . . .           |         |
| | konkurensi thread lewat        |      |   . potret .         |         |
| | simulasi pabrik.               |      |    . . . .           |         |
| |                                |      |                      |         |
| | [ > Mulai Game ]               |      +----------------------+         |
| |    (jadi "Lanjutkan"           |                                       |
| |     bila ada progres)          |                                       |
| | [ Panduan ]                    |                                       |
| | [ Pengaturan ]                 |                                       |
| |                                |                                       |
| | v0.1.0                         |                                       |
| +--------------------------------+                                       |
+--------------------------------------------------------------------------+
```

- Transisi: Mulai/Lanjutkan -> S2; Panduan -> S9; Pengaturan -> S10.
- Aset: logo (U-075), potret Pak Mandor (U-074), latar pabrik (U-075).

## S2 - Pilih Mode dan Modul

```
+- S2 Pilih Mode ----------------------------------------------------------+
| < Kembali              [ Kampanye ]  Sandbox  Bandingkan                 |
|                                                                          |
| +- terbuka --------------------+    +- terkunci -------------------+     |
| | Modul 1                      |    | Modul 2                      |     |
| | Sinkronisasi Dasar           |    | Masalah Klasik               |     |
| |                              |    |                              |     |
| | [ pratinjau arena ]          |    | [ pratinjau arena ]          |     |
| |                              |    |                              |     |
| | 2 / 5 level                  |    | 0 / 4 level                  |     |
| | [=========-------]           |    | [----------------]           |     |
| |                              |    |                              |     |
| | Mutex, semaphore,            |    | [#] Selesaikan Level         |     |
| | condition variable.          |    |     1-4 dahulu.              |     |
| +------------------------------+    +------------------------------+     |
+--------------------------------------------------------------------------+
```

Tab **Sandbox** dan **Bandingkan** (daftar level):

```
+- S2 tab Sandbox ---------------------------------------------------------+
| < Kembali              Kampanye  [ Sandbox ]  Bandingkan                 |
|                                                                          |
|   Level 1-1  Bug Papan Stok            [ Buka ]                          |
|   Level 1-2  Pintu Kebesaran           [#] Selesaikan Level 1-2 dahulu   |
|   Level 1-3  Tiga Mesin, Delapan Robot [#] Selesaikan Level 1-2 dahulu   |
|   ...                                                                    |
+--------------------------------------------------------------------------+
```

- Transisi: kartu modul terbuka -> S3a; level Sandbox -> S11; level Bandingkan -> S12; kembali -> S1.
- Level yang datanya belum dibuat tampil abu dengan keterangan "Segera hadir".

## S3a - Pembuka Modul (kartu judul)

```
+- S3a Pembuka Modul ------------------------------------------------------+
| +----------------------------------------------------------------+       |
| |                                                                |       |
| | MODUL 1                                                        |       |
| | Sinkronisasi Dasar                                             |       |
| |                                                                |       |
| | Robot pabrik berebut papan stok dan mesin. Kamu belajar        |       |
| | memasang pengaman agar data benar tanpa membuat pabrik lambat. |       |
| |                                                                |       |
| | Yang akan dipelajari:                                          |       |
| |   - Race condition       - Critical section                    |       |
| |   - Mutex                - Semaphore                           |       |
| |   - Condition variable                                         |       |
| |                                                                |       |
| | Lanjut otomatis sekitar 3 detik        [ Lewati > ]            |       |
| |                                                                |       |
| +----------------------------------------------------------------+       |
+--------------------------------------------------------------------------+
```

- Transisi: otomatis atau Lewati -> S3b (mengganti layar, bukan menumpuk riwayat).

## S3b - Peta Level

```
+- S3b Peta Level ---------------------------------------------------------+
| < Kembali                Modul 1: Sinkronisasi Dasar                     |
|                                                                          |
|   (1-1)=======(1-2)=======(1-3)=======(1-4)=======(1-5)                  |
|    ***          **          [#]         [#]         [#]                  |
|   selesai      selesai    berikutnya   terkunci    terkunci              |
|                                                                          |
|   (sorot: level berikutnya, berdenyut)                                   |
|                                                                          |
|                    [ Mulai Level 1-3 ]       ( Ulangi Level 1-1 )        |
+--------------------------------------------------------------------------+
```

- Tombol utama otomatis menunjuk level berikutnya ("Mulai" atau "Lanjut"). Level lama bisa dipilih untuk mengejar bintang.
- Transisi: pilih level -> S4; kembali -> S2.

## S4 - Intro Level (dialog Pak Mandor)

```
+- S4 Intro Level ---------------------------------------------------------+
| (Level 1-1: Bug Papan Stok)    [latar arena diburamkan]                  |
|                                                                          |
| +------------------+  +------------------------------------------+       |
| |                  |  | Level 1-1: Bug Papan Stok                |       |
| |  Pak Mandor      |  |                                          |       |
| |  (besar,         |  | Halo Mandor baru! Dua robot kita merakit |       |
| |  hampir          |  | 5 produk lalu mencatatnya di Papan Stok. |       |
| |  memenuhi        |  | Seharusnya total akhir 10, tapi sering   |       |
| |  tinggi)         |  | kurang.                                  |       |
| |                  |  |                                          |       |
| +------------------+  | Halaman 1 / 3                            |       |
|                       |           [ Lewati ]  [ Lanjut > ]       |       |
|                       +------------------------------------------+       |
+--------------------------------------------------------------------------+
```

- 3 halaman: situasi, misi (target dan kriteria bintang), petunjuk alat. Halaman terakhir: tombol **Mulai**.
- Transisi: Mulai atau Lewati -> S5 (mengganti layar).

## S5 - Arena: tata letak HUD

```
+- S5 HUD (lapisan React di atas kanvas) ----------------------------------------+
| (Level 1-1)  (Misi v)         [>/||] [Step] [Reset] (1x) (Seed 10) [=]         |
|                                                     (Siap - tick 0)            |
|                                                                                |
|                                                                                |
|                       A R E N A   (kanvas Phaser, skala FIT)                   |
|                       lihat gambar arena di bawah                              |
|                                                                                |
|                                                                                |
| (Log Kejadian v)        [ Toolbox: Pintu Mutex | Hapus ]        (Metrik v)     |
| (Tanya Pak Mandor)                                                             |
+--------------------------------------------------------------------------------+
```

| Komponen | Isi |
|---|---|
| Badge level | nama level, kiri atas |
| Misi | target dan kriteria bintang, dapat dilipat |
| Kontrol | toggle Play/Pause, Step, Reset (ikon + tooltip), chip kecepatan, chip seed, chip status + tick |
| Menu (=) | membuka S13 dan legenda status robot |
| Toolbox | hanya alat level ini + Hapus; terkunci saat simulasi mulai |
| Log Kejadian | terbaru di atas, dapat dilipat |
| Metrik | laci opsional |
| Panel error | pesan engine; Run dan Step terkunci sampai Reset |

## S5 - Arena Level 1-1 (U-004 inti)

Satu loop bersama dengan dua jalur sejajar (Robot A di jalur luar, Robot B di jalur dalam), searah jarum jam. Checkpoint di sisi atas, jalur kembali di sisi bawah, papan stok di tengah. Gambar di bawah memperlihatkan loop yang dibentangkan; di game, ujung kiri dan kanan jalan melengkung menyambung sisi atas dan sisi bawah.

```
+------------------------------------------------------------------------+
|      Robot A: Produk 3/5, tunggu 0   Robot B: Produk 2/5, tunggu 0     |
|       [0]  WORK    [1]  READ    [2] COMPUTE  [3]  WRITE   [4]          |
|  A ====>====(o)=====>====(o)=====>====(o)=====>====(o)=====>=======    |
|  B ====>====(o)=====>====(o)=====>====(o)=====>====(o)=====>=======    |
|                      tautan baca              tautan tulis             |
|                           v                         v                  |
|              +--------------------------------------+                  |
|              |   PAPAN STOK        stok: 0 / 10     |                  |
|              +--------------------------------------+                  |
|    <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<    |
|     jalur kembali (tanpa checkpoint) menuju awal putaran berikutnya    |
+------------------------------------------------------------------------+
```

Arena dengan **pintu mutex terpasang** (`|G|` = gerbang, `#` = segmen terlindungi; masuk di slot 1, keluar di slot 4):

```
+------------------------------------------------------------------------+
|      Robot A: Produk 3/5, tunggu 0   Robot B: Produk 2/5, tunggu 0     |
|       [0]  WORK    [1]  READ    [2] COMPUTE  [3]  WRITE   [4]          |
|  A ====>====(o)====|G|###(o)#####>####(o)#####>####(o)####|G|======    |
|  B ====>====(o)====|G|###(o)#####>####(o)#####>####(o)####|G|======    |
|                     ^tautan baca              tautan tulis ^           |
|                   masuk   v                         v   keluar         |
|              +--------------------------------------+                  |
|              |   PAPAN STOK        stok: 0 / 10     |                  |
|              +--------------------------------------+                  |
|    <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<    |
|     jalur kembali (tanpa checkpoint) menuju awal putaran berikutnya    |
+------------------------------------------------------------------------+
```

Robot yang menunggu berbaris di depan gerbang masuk dengan label WAITING; pemegang kunci tampil di gerbang.

**Slot, checkpoint, dan data ToolSpan**

| Elemen | Jumlah | Keterangan |
|---|---|---|
| Checkpoint | 4 | WORK, READ, COMPUTE, WRITE (indeks 0..3) |
| Slot | 5 | slot k = celah sebelum checkpoint k; slot 4 = sesudah WRITE |
| Pintu masuk | slot `s` | menjadi `LOCK` sebelum instruksi `s`, `start = s` |
| Pintu keluar | slot `e`, `e > s` | menjadi `UNLOCK` sesudah instruksi `e-1`, `end = e - 1` |
| Contoh | masuk 1, keluar 4 | `start = 1`, `end = 3` (READ sampai WRITE) |

**Usulan koordinat awal untuk U-051** (pecahan dari ukuran `ARENA`; disetel ulang saat melihat hasil nyata). "Pecahan jalur" adalah posisi sepanjang jalan dari 0 sampai 1, harus menaik.

| Elemen | x | y | Pecahan jalur |
|---|---|---|---|
| Slot 0 | 0.12 | 0.28 | 0.050 |
| WORK | 0.20 | 0.28 | 0.105 |
| Slot 1 | 0.29 | 0.28 | 0.160 |
| READ | 0.38 | 0.28 | 0.215 |
| Slot 2 | 0.47 | 0.28 | 0.270 |
| COMPUTE | 0.56 | 0.28 | 0.325 |
| Slot 3 | 0.65 | 0.28 | 0.380 |
| WRITE | 0.74 | 0.28 | 0.435 |
| Slot 4 | 0.83 | 0.28 | 0.490 |
| Jalur kembali | 0.90 ke 0.10 | 0.72 | 0.50 sampai 1.00 |
| Papan stok | 0.47 | 0.50 | - (tautan ke READ dan WRITE) |
| Gerbang | di slot terpilih | y jalur A dan B | melintang di dua jalur |

Lengkung ujung kiri dan kanan berjari-jari sekitar 0.14 tinggi arena. Jarak antar-jalur sekitar 0.04. Robot A dan B memakai jalur berbeda tetapi gerbang yang sama.

**Catatan perilaku**
- Panah aliran nilai muncul dari papan ke READ (membaca) dan dari WRITE ke papan (menulis).
- Catatan di tangan robot (`r = 3`) muncul di atas robot setelah READ.
- Robot RUNNING menyala, READY "dibekukan" (ikon es/zzz), semua dengan label teks.
- Tooltip checkpoint menjelaskan instruksi dengan bahasa awam.
- Saat alat diseret: slot yang sah menyala; Esc membatalkan; menyeret ke Hapus melepas pintu.

## S6 - Popup Hasil

```
+- salah ------------------------------+  +- benar ------------------------------+
| Waduh, Stok Salah!                   |  | Bagus! Sinkronisasi Berhasil!        |
| (X SALAH)                            |  | (V BENAR)                            |
|                                      |  |                                      |
| +---------------------+              |  | +---------------------+              |
| | Seharusnya 10,      |              |  | | Stok tepat 10!      |              |
| | hasilnya 8.         |              |  | | Data aman.          |              |
| +---------------------+              |  | +---------------------+              |
| (Pak Mandor sedih)                   |  | (Pak Mandor senang)                  |
|                                      |  |                                      |
| [Hilang: 2] [Tick: 40] [Tunggu: 0]   |  | [Hilang: 0] [Tick: 38] [Tunggu: 0]   |
|                                      |  |                                      |
| (bintang kosong)  0 dari 3           |  | *** muncul satu per satu             |
|                                      |  |   benar / efisien / hemat            |
| Pesan Pak Mandor:                    |  |                                      |
| Race condition terjadi...            |  | Pesan Pak Mandor:                    |
|                                      |  | Mutex menjaga critical section.      |
| [ Reset ] [ Petunjuk ] [ Tutup ]     |  | [ Lanjut ke Level Berikutnya ]       |
+--------------------------------------+  | [ Ulangi untuk Bintang ] [ Tutup ]   |
                                          +--------------------------------------+
```

- **Petunjuk** hanya muncul setelah 2 kegagalan dalam sesi. Di seed bukan tutorial: catatan "Bintang hanya dinilai pada seed tutorial (10)".
- Di Sandbox dan Bandingkan: ringkasan angka dan penjelasan, tanpa bintang.

## S7 - Tamat Modul

```
+- S7 Tamat Modul ---------------------------------------------------------+
|                                                                          |
|       (Pak Mandor senang)       MODUL 1 SELESAI!                         |
|                                                                          |
|       Bintang modul: 11 / 15                                             |
|                                                                          |
|       Konsep yang dikuasai:                                              |
|         - Race condition                                                 |
|         - Critical section                                               |
|         - Mutex, semaphore, condition variable                           |
|                                                                          |
|       Modul 2 terbuka!                                                   |
|                                                                          |
|             [ Lanjut ke Modul Berikutnya ]   [ Peta Level ]              |
|                                                                          |
+--------------------------------------------------------------------------+
```

## S8 - Tamat Game

```
+- S8 Tamat Game ----------------------------------------------------------+
|                                                                          |
|       (Pak Mandor, ucapan selamat)      SELAMAT, MANDOR!                 |
|                                                                          |
|       Total bintang: 24 / 27                                             |
|                                                                          |
|       Semua konsep: race condition, critical section, mutex, semaphore,  |
|       condition variable, producer-consumer, readers-writers,            |
|       starvation, dining philosophers, deadlock.                         |
|                                                                          |
|    [ Sandbox ] [ Bandingkan ] [ Ulangi Level ] [ Kredit ] [ Beranda ]    |
|                                                                          |
+--------------------------------------------------------------------------+
```

- Tampil setelah seluruh level kampanye selesai (kecuali mode demo).

## S9 - Panduan

```
+- S9 Panduan -------------------------------------------------------------+
| < Kembali                         PANDUAN                                |
|                                                                          |
| 1. AMATI    Jalankan tanpa pengaman, lihat masalahnya.                   |
| 2. PASANG   Seret alat dari toolbox ke slot di jalur.                    |
| 3. JALANKAN Tekan Run, bandingkan hasilnya.                              |
|                                                                          |
| Status robot:  READY (siap, menunggu giliran)  RUNNING (sedang jalan)    |
|                WAITING (menunggu pintu)        TERMINATED (selesai)      |
|                                                                          |
| Kontrol: Play/Pause, Step, Reset, kecepatan, seed                        |
|                                                                          |
| Glosarium: race condition, critical section, mutex, semaphore,           |
|            condition variable, deadlock, starvation                      |
+--------------------------------------------------------------------------+
```

## S10 - Pengaturan dan Kredit

```
+- S10 Pengaturan ---------------------------------------------------------+
| < Kembali                       PENGATURAN                               |
|                                                                          |
| Volume suara        [=========-----]  70%                                |
| Kurangi animasi     [ ] mati  [x] aktif                                  |
| Buka semua level    [ ] mati  [x] aktif   (mode demo untuk penguji)      |
| Reset progres       [ Hapus Progres ]   -> konfirmasi dulu               |
|                                                                          |
| KREDIT                                                                   |
|   Aset dunia: Kenney (CC0). Ikon: buatan tim.                            |
|   Potret Pak Mandor: dibuat dengan bantuan generator gambar.             |
|   Tim: (daftar anggota)                                                  |
+--------------------------------------------------------------------------+
```

## S11 - Sandbox

```
+- S11 Sandbox ------------------------------------------------------------+
| (Level 1-1) (Sandbox)    [>/||] [Step] [Reset] (1x) (Seed ..) [=]        |
|                                                                          |
|                                             +- Parameter ------------+   |
| arena level                                 | Jumlah robot  [ 2 ]    |   |
| yang sama                                   | Seed          [ 10 ]   |   |
| (robot, pintu)                              +------------------------+   |
|                                                                          |
|                                                                          |
| (Log v)        [ Toolbox ]        (Metrik v)       tanpa bintang         |
+--------------------------------------------------------------------------+
```

- Hanya parameter yang relevan untuk level itu (robot, kapasitas buffer, token, kebijakan, seed).

## S12 - Bandingkan

```
+- S12 Bandingkan ---------------------------------------------------------+
| < Kembali              [ > Run keduanya ]  [ Reset ]  Seed sama: 10      |
|                                                                          |
| +------------------------------+    +------------------------------+     |
| | Panel A                      |    | Panel B                      |     |
| | (arena mini)                 |    | (arena mini)                 |     |
| |                              |    |                              |     |
| | Alat: Pintu READ-WRITE       |    | Alat: Pintu semua            |     |
| | Seed 10                      |    | Seed 10                      |     |
| +------------------------------+    +------------------------------+     |
|                                                                          |
| Metrik            A        B      Lebih baik                             |
| Throughput        0.25     0.20   A                                      |
| Waktu tunggu      12       30     A                                      |
| Pembaruan hilang  0        0      sama                                   |
| [bar A | bar B] per metrik (grafik batang SVG)                           |
+--------------------------------------------------------------------------+
```

## S13 - Menu Jeda (overlay di Arena)

```
+- S13 Menu Jeda ------------------+
|                                  |
|           JEDA                   |
|                                  |
|      [ Lanjut ]                  |
|      [ Ulangi Level ]            |
|      [ Peta Level ]              |
|      [ Pengaturan ]              |
|                                  |
+----------------------------------+
```

- Dibuka dari tombol menu (=) di HUD. Esc menutup dan kembali ke Arena.

## Alur antar layar (ringkasan PRD bagian 16)

```
S1 Beranda -> S2 Pilih Mode
S2 Kampanye -> S3a -> S3b -> S4 -> S5 <-> S6
   S6 benar -> level berikutnya (S4) | S7 Tamat Modul | S8 Tamat Game
   S6 salah -> Reset atau Petunjuk -> S5
S2 Sandbox -> S11     S2 Bandingkan -> S12
S1 -> S9 Panduan | S10 Pengaturan
S5 -> S13 Menu Jeda -> Lanjut | Ulangi | Peta Level (S3b) | Pengaturan (S10)
```

## Daftar periksa persetujuan

- [ ] Tata letak S1 sampai S13 dapat dipakai sebagai acuan U-016 sampai U-042.
- [ ] Gambar arena Level 1-1 dapat dipakai sebagai acuan U-050 dan U-051.
- [ ] Koordinat awal disetel ulang setelah melihat hasil nyata di U-051.