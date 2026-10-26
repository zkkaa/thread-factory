# ASSETS — Thread Factory: Pabrik Rebutan

> Daftar seluruh aset (gambar, audio, font) beserta sumber dan lisensinya.
> Aturan: CLAUDE.md bagian 8 dan PRD bagian 18. Setiap aset yang masuk ke
> `public/assets/` wajib tercatat di sini dan di README bagian "Kredit".
> Aset hasil generator gambar juga dicatat di `docs/AI_USAGE.md`.

Status: `Belum` (belum ada) · `Diunduh` · `Terpasang` · `Dihapus`.
Nama berkas di bawah adalah rencana dan boleh berubah saat aset dipilih.

## Aset bawaan template

| Berkas | Kegunaan | Ukuran | Sumber | Lisensi | Status |
|---|---|---|---|---|---|
| public/assets/bg.png | Bawaan template, belum dipastikan dipakai | - | phaserjs/template-react-ts | MIT (repo template), belum diverifikasi per berkas | Dihapus |
| public/assets/star.png | Bawaan template, belum dipastikan dipakai | - | phaserjs/template-react-ts | MIT (repo template), belum diverifikasi per berkas | Dihapus |
| public/assets/logo.png | Bawaan template, belum dipastikan dipakai | - | phaserjs/template-react-ts | MIT (repo template), belum diverifikasi per berkas | Dihapus |

Ketiganya tidak dipakai kode (dicek 26 Okt 2026) dan sudah dihapus.

## Aset game

| Berkas (rencana) | Kegunaan | Ukuran | Sumber | Lisensi | Status |
|---|---|---|---|---|---|
| characters/mandor-netral.png | Potret Pak Mandor (S1, S4, S6 sampai S8, petunjuk) | - | Generator gambar | Cek ketentuan generator (U-074) | Belum |
| characters/mandor-senang.png | Potret Pak Mandor, senang | - | Generator gambar | Cek ketentuan generator (U-074) | Belum |
| characters/mandor-sedih.png | Potret Pak Mandor, sedih | - | Generator gambar | Cek ketentuan generator (U-074) | Belum |
| characters/mandor-berpikir.png | Potret Pak Mandor, berpikir (opsional) | - | Generator gambar | Cek ketentuan generator (U-074) | Belum |
| characters/mandor-avatar.png | Avatar kepala untuk HUD dan tombol petunjuk | - | Dipotong dari potret | Mengikuti potret | Belum |
| ui/logo-thread-factory.png | Logo di Beranda (S1) | - | Dibuat tim atau generator | Milik tim | Belum |
| world/bg-beranda.png | Latar Beranda (S1) | - | Kenney + komposisi tim | CC0 | Belum |
| world/tiny-factory.png | Ubin latar arena dan properti (S5) | 16x16 per ubin | Kenney "Tiny Factory" | CC0 (verifikasi di halaman paket saat diunduh) | Belum |
| world/robot-a.png, robot-b.png | Sprite robot A dan B (S5) | - | Kenney "Robot Pack" | CC0 (verifikasi; kecocokan gaya belum dicek) | Belum |
| world/checkpoint.png, gate.png, board.png | Checkpoint, gerbang mutex, papan stok (S5) | - | Kenney atau dibuat tim | CC0 atau milik tim | Belum |
| world/props-level-1-3-sampai-2-3.png | Kartu akses, lampu sinyal, ban, kunci inggris | - | Kenney atau dibuat tim | CC0 atau milik tim | Belum |
| world/fx-*.png | Efek: bintang, percikan, zzz | - | Dibuat tim | Milik tim | Belum |
| audio/click.ogg, success.ogg, fail.ogg, lock.ogg | Efek suara | - | Paket audio CC0 | CC0 (catat sumber pasti) | Belum |

Ikon HUD berupa SVG di dalam komponen React (`src/ui/components/icons/`), bukan berkas aset.