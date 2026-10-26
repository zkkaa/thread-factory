# WIREFRAME — Thread Factory: Pabrik Rebutan

> Sketsa teks layar S1 sampai S13 dan arena Level 1-1.
> Rujukan: `PRD.md` bagian 16 dan 17. Jika berbeda, PRD yang benar.
> Tanda: `[ ]` tombol · `( )` chip · `▾` bisa dilipat · `◀` kembali.

## Alur besar

```
S1 Beranda → S2 Pilih Mode ─┬─ Kampanye → Pilih Modul → S3 Pembuka Modul → S3 Peta Level
                            │              → S4 Intro Level → S5 Arena ⇄ S6 Popup Hasil
                            │                 (benar → level berikutnya / S7 Tamat Modul / S8 Tamat Game)
                            ├─ Sandbox   → pilih level terbuka → S11 Arena + laci Parameter
                            └─ Bandingkan → pilih level terbuka → S12 layar terbagi dua
S1 → S9 Panduan | S10 Pengaturan (Kredit)
S5 → S13 Menu Jeda → Lanjut | Ulangi Level | Peta Level | Pengaturan
```

## S1. Beranda

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│        ⚙ THREAD FACTORY ⚙                               │
│        Pabrik Rebutan                                    │
│                                                          │
│   ┌────────────┐   "Rebutan itu seru kalau ada aturan!"  │
│   │ Pak Mandor │                                         │
│   │  (jempol)  │      [  Mulai Game / Lanjutkan  ]       │
│   └────────────┘      [  Panduan                 ]       │
│                       [  Pengaturan              ]       │
│                                                          │
│                                          v0.x.x          │
└──────────────────────────────────────────────────────────┘
```

## S2. Pilih Mode dan Modul

```
┌──────────────────────────────────────────────────────────┐
│ [◀ Kembali]        [ Kampanye | Sandbox | Bandingkan ]   │
│                                                          │
│  ┌──────────────────────┐   ┌──────────────────────┐     │
│  │ MODUL 1              │   │ 🔒 MODUL 2           │     │
│  │ Sinkronisasi Dasar   │   │ Masalah Klasik       │     │
│  │ (pratinjau)          │   │ (pratinjau)          │     │
│  │ deskripsi singkat    │   │ Selesaikan Level 1-4 │     │
│  │ Progres: 1 / 5 level │   │ dahulu               │     │
│  └──────────────────────┘   └──────────────────────┘     │
│  Tab Sandbox/Bandingkan: daftar level terbuka;           │
│  level terkunci diberi keterangan syarat.                │
└──────────────────────────────────────────────────────────┘
```

## S3a. Pembuka Modul (kartu judul, otomatis ±3 detik)

```
┌──────────────────────────────────────────────────────────┐
│                      MODUL 1                             │
│               Sinkronisasi Dasar                         │
│        deskripsi singkat modul                           │
│   Konsep: race condition · mutex · semaphore · ...       │
│                                              [ Lewati ]  │
└──────────────────────────────────────────────────────────┘
```

## S3b. Peta Level

```
┌──────────────────────────────────────────────────────────┐
│ [◀ Kembali]   Modul 1: Sinkronisasi Dasar                │
│                                                          │
│   (1-1)━━━(1-2)━━━(1-3)━━━(1-4)━━━(1-5)                  │
│   ★★☆     sorot    🔒      🔒      🔒                    │
│            (berikutnya)  "Segera hadir" bila tanpa data  │
│                                                          │
│            [ Mulai Level 1-2 / Lanjut ]                  │
│            Level lama dapat diulang untuk bintang.       │
└──────────────────────────────────────────────────────────┘
```

## S4. Intro Level

```
┌──────────────────────────────────────────────────────────┐
│ [Level 1-1: Bug Papan Stok]     (latar arena diburamkan) │
│                                                          │
│  ┌──────────────┐   ╭──────────────────────────────╮     │
│  │              │   │ Dialog Pak Mandor            │     │
│  │  Pak Mandor  │   │ (situasi / misi / petunjuk)  │     │
│  │  (besar)     │   │            halaman 1 dari 3  │     │
│  │              │   ╰──────────────────────────────╯     │
│  └──────────────┘                [ Lewati ] [ Lanjut ]   │
│                                  (terakhir: [ Mulai ])   │
└──────────────────────────────────────────────────────────┘
```

## S5. Arena (HUD): lihat bagian "Arena Level 1-1" di bawah

## S6. Popup Hasil

```
┌──────────────────────────────────────────────────────────┐
│             ╔════════════════════════════╗               │
│             ║ Waduh, Stok Salah!  [SALAH]║               │
│             ║ ┌────────┐ ╭──────────────╮ ║               │
│             ║ │ Mandor │ │ Seharusnya 10,│ ║              │
│             ║ │ sedih  │ │ hasilnya 8.   │ ║              │
│             ║ └────────┘ ╰──────────────╯ ║               │
│             ║ [Pembaruan hilang][Total tick][Waktu tunggu]║
│             ║ ★ ☆ ☆  (satu per satu + rincian kriteria)  ║│
│             ║ Penjelasan konsep dari Pak Mandor          ║│
│             ║ Salah: [Reset Simulasi][Petunjuk*][Tutup]  ║│
│             ║ Benar: [Lanjut ke Level Berikutnya]        ║│
│             ║        [Ulangi untuk Bintang][Tutup]       ║│
│             ╚════════════════════════════╝               │
│  *Petunjuk muncul setelah 2 kegagalan dalam sesi.        │
│  Seed bukan tutorial: catatan "Bintang hanya dinilai     │
│  pada seed tutorial (10)".                               │
└──────────────────────────────────────────────────────────┘
```

## S7. Tamat Modul

```
┌──────────────────────────────────────────────────────────┐
│  Pak Mandor (senang)    "Modul 1 selesai!"               │
│  Bintang modul: 9 / 15                                   │
│  Konsep dipelajari: race condition, mutex, ...           │
│  Modul 2 terbuka!                                        │
│        [ Lanjut ke Modul Berikutnya ] [ Peta Level ]     │
└──────────────────────────────────────────────────────────┘
```

## S8. Tamat Game

```
┌──────────────────────────────────────────────────────────┐
│  Pak Mandor: ucapan selamat                              │
│  Total bintang: x / y                                    │
│  Semua konsep: race condition ... deadlock               │
│  [Sandbox] [Bandingkan] [Ulangi Level] [Kredit] [Beranda]│
└──────────────────────────────────────────────────────────┘
```

## S9. Panduan

```
┌──────────────────────────────────────────────────────────┐
│ [◀ Kembali]   PANDUAN                                    │
│ Cara bermain: 1 Amati · 2 Pasang · 3 Jalankan            │
│ Status robot: READY · RUNNING · WAITING · TERMINATED     │
│ Kontrol HUD: Play/Pause, Step, Reset, kecepatan, seed    │
│ Glosarium: race condition, critical section, mutex,      │
│ semaphore, condition variable, deadlock, starvation      │
└──────────────────────────────────────────────────────────┘
```

## S10. Pengaturan dan Kredit

```
┌──────────────────────────────────────────────────────────┐
│ [◀ Kembali]   PENGATURAN                                 │
│ Volume        [────●────]                                │
│ Kurangi animasi            [ sakelar ]                   │
│ Buka semua level (demo)    [ sakelar ]                   │
│ Reset progres              [ Reset ] → konfirmasi        │
│ KREDIT: aset + sumber + lisensi, catatan potret AI,      │
│         daftar anggota tim                               │
└──────────────────────────────────────────────────────────┘
```

## S11. Sandbox

```
┌──────────────────────────────────────────────────────────┐
│ HUD arena seperti S5 (tanpa bintang)                     │
│            A R E N A                                     │
│ ┌ Parameter ▾ ┐ jumlah robot · kapasitas · token ·       │
│ └─────────────┘ kebijakan · seed (hanya yang relevan)    │
└──────────────────────────────────────────────────────────┘
```

## S12. Bandingkan

```
┌────────────────────────────┬─────────────────────────────┐
│ PANEL A  (konfigurasi A)   │ PANEL B  (konfigurasi B)    │
│   arena mini               │   arena mini                │
├────────────────────────────┴─────────────────────────────┤
│ Seed sama · [Run] [Pause] [Step] [Reset] [1x]            │
│ Tabel metrik A vs B + penanda "lebih baik"               │
│ Grafik batang SVG: throughput, waktu tunggu, ...         │
└──────────────────────────────────────────────────────────┘
```

## S13. Menu Jeda (overlay di Arena)

```
        ┌───────────────────┐
        │  [ Lanjut       ] │
        │  [ Ulangi Level ] │
        │  [ Peta Level   ] │
        │  [ Pengaturan   ] │
        └───────────────────┘
```

## Arena Level 1-1 (S5)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Level 1-1: Bug Papan Stok] [Misi ▾]  [▶/⏸][⏭][↻] (1x) (Seed 10) (Siap·t0) [≡] │
│                                                                        │
│            ┌──────────── jalan melengkung (satu loop) ───────────┐     │
│            │   (1)WORK ──→ (2)READ ──→ (3)COMPUTE ──→ (4)WRITE   │     │
│            │     ▲          ┆   ┌────────────┐   ┆       │      │     │
│            │     │          └──→│ PAPAN STOK │←──┘       │      │     │
│            │     │              │   stok = 0 │           ▼      │     │
│            │     └──────────────────  ← arah panah ──────┘      │     │
│            └──────────────────────────────────────────────────────┘     │
│   Robot A (RUNNING, tunggu 0, Produk 1/5, r = 3)                       │
│   Robot B (READY ❄,  tunggu 2, Produk 1/5)     dua jalur sejajar       │
│                                                                        │
│   Slot: 0 sebelum WORK · 1 sebelum READ · 2 sebelum COMPUTE ·          │
│         3 sebelum WRITE · 4 sesudah WRITE (celah, menyala saat seret)  │
│                                                                        │
│ [Log Kejadian ▾]   [ Pintu Mutex | Hapus ]    [Metrik ▾] [Tanya Mandor]│
└────────────────────────────────────────────────────────────────────────┘
```

Catatan arena:
- 4 checkpoint bulat, 5 slot (n+1), papan stok di tengah, terhubung ke READ dan WRITE.
- Pintu masuk di slot `s`, pintu keluar di slot `e > s`; data alat `start = s`, `end = e - 1`.
- Pintu berlaku untuk semua robot di loop bersama. Esc membatalkan pintu yang dipegang.
- Robot yang menunggu antre di depan pintu; pemegang kunci ditandai.
- Alat terkunci setelah Run sampai Reset.