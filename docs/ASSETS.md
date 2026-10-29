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
| characters/mandor-netral.png | Potret Pak Mandor, netral (S1, S4, S6 sampai S8, petunjuk) | 569 KB | ChatGPT (OpenAI), 29 Okt 2026; latar dihapus dengan Photoroom | Hasil generator; ketentuan OpenAI dan Photoroom dicek Azka | Terpasang |
| characters/mandor-senang.png | Potret Pak Mandor, senang | 564 KB | idem | idem | Terpasang |
| characters/mandor-sedih.png | Potret Pak Mandor, sedih | 590 KB | idem | idem | Terpasang |
| characters/mandor-berpikir.png | Potret Pak Mandor, berpikir | 549 KB | idem | idem | Terpasang |
| characters/mandor-avatar.png | Avatar kepala untuk tombol petunjuk | 81 KB, 256x256 | Dipotong dari mandor-netral.png | Mengikuti potret | Terpasang |
| ui/logo-thread-factory.png | Logo di Beranda (S1) | 325 KB | ChatGPT (OpenAI), 29 Okt 2026; latar dihapus dengan Photoroom | Hasil generator; ketentuan dicek Azka | Terpasang |
| ui/bg-beranda.jpg | Latar Beranda (S1) | 191 KB, 1920x1080 | ChatGPT (OpenAI), 29 Okt 2026 | Hasil generator; ketentuan dicek Azka | Terpasang |
| world/tiny-factory.png | Spritesheet Tiny Factory (192x176, 12x11 ubin 16x16 tanpa jarak): lantai, ban berjalan, mesin, barikade, lampu, perkakas. Peta nomor frame: docs/tiny-factory-frames.png | 192x176 | Kenney "Tiny Factory" v1.0 (kenney.nl), berkas `Tilemap/tilemap_packed.png` | CC0 (License.txt tersalin di `world/tiny-factory-license.txt`; kredit tidak wajib) | Terpasang |
| (frame di world/tiny-factory.png: 111-113, 87-89, 99-101, 75-77) | Sprite robot A dan B (S5): mesin kecil bermuka layar, satu frame per warna; tanpa animasi jalan | - | Kenney "Tiny Factory" (sama seperti di atas); Robot Pack tidak dipakai karena gayanya vektor dan tidak seragam | CC0 | Dipakai di U-072 |
| (frame di world/tiny-factory.png: 122, 114, 130 untuk ikon checkpoint; 73 untuk ikon peti di papan stok) | Ikon instruksi di checkpoint dan penanda stok (S5). Gerbang mutex tetap digambar kode (batang berwarna + label) agar status jelas | - | Kenney "Tiny Factory" | CC0 | Terpasang |
| world/props-level-1-3-sampai-2-3.png | Kartu akses, lampu sinyal, ban, kunci inggris | - | Kenney atau dibuat tim | CC0 atau milik tim | Belum |
| world/fx-*.png | Efek: bintang, percikan, zzz | - | Dibuat tim | Milik tim | Belum |
| audio/click.ogg, success.ogg, fail.ogg, lock.ogg | Efek suara | - | Paket audio CC0 | CC0 (catat sumber pasti) | Belum |

Ikon HUD berupa SVG di dalam komponen React (`src/ui/components/icons/`), bukan berkas aset.