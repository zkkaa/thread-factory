# CLAUDE.md — Aturan Kerja untuk Asisten AI

Berkas ini dibaca asisten AI (Claude) di awal setiap sesi koding pada proyek ini. Tujuannya menjaga hasil tetap **konsisten** walau banyak orang di tim memakai AI.

## 1. Konteks Proyek

- **Nama:** Thread Factory: Pabrik Rebutan.
- **Apa:** game edukasi web 2D (top-down) untuk memahami sinkronisasi thread (race condition, mutex, semaphore, condition variable, Producer-Consumer, Readers-Writers, Dining Philosophers).
- **Konteks:** Final Project Sistem Operasi (Kategori B), kelompok 6 orang, mayoritas masih pemula (semester 3).
- **Dokumen sumber kebenaran:** `docs/PRD.md` (apa), `docs/ARCHITECTURE.md` (bagaimana), `docs/TASKS.md` (urutan kerja). **Baca bagian yang relevan sebelum mengubah kode.**

## 2. Tech Stack (versi dikunci di `package.json`)

React · TypeScript (strict) · Phaser 3 · Vite · Tailwind CSS · Vitest.
Versi yang disepakati (dikunci exact lewat `package-lock.json`; instal ulang dengan `npm ci`, bukan `npm install`):

| Alat | Versi | Catatan |
|---|---|---|
| Node.js | 24.x (LTS) | Dicatat di `.nvmrc` |
| npm | bawaan Node 24 | Package manager tim |
| Phaser | **3.90.0** (exact) | **Bukan Phaser 4.** Jangan jalankan `npm install phaser` tanpa versi |
| React / React DOM | 19.x | Ikut template resmi Phaser |
| Vite | ikut template | **Jangan upgrade major** selama proyek |
| TypeScript | ikut template | `strict: true` |
| Tailwind CSS | 4.x + `@tailwindcss/vite` | Plugin Vite, tanpa `tailwind.config.js` |
| Vitest | 3.2.6 | Config terpisah di `vitest.config.ts` |

Versi pasti hasil instalasi (dari `npm ls --depth=0`, dicek 23 Okt 2026):
`phaser 3.90.0` · `react 19.1.0` · `react-dom 19.1.0` · `vite 6.3.2` · `typescript 5.7.3` · `tailwindcss 4.3.3` · `@tailwindcss/vite 4.3.3` · `vitest 3.2.6` · `eslint 9.25.1` · `@vitejs/plugin-react 4.4.1`.
Jangan mengubah versi-versi ini tanpa kesepakatan tim. Jika `package.json` berubah, perbarui baris ini.

- **Phaser 4 sudah rilis, tapi proyek ini memakai Phaser 3.90.0.** Jika kamu menyarankan API, pastikan itu API Phaser 3. Jangan mencampur gaya Phaser 4.

- Phaser memakai **Phaser 3**. Jika API yang kamu ingat berbeda dengan versi terpasang, **cek dokumentasi versi tersebut**; jangan menebak.
- **Jangan menambah dependency** (library baru) tanpa persetujuan tim. Jika menurutmu perlu, jelaskan alasannya dan tanyakan dulu.

## 3. Perintah

```
npm run dev-nolog  # jalankan dev server (pakai ini, bukan `npm run dev`)
npm run build-nolog # build produksi (pakai ini, bukan `npm run build`)
npm run test       # Vitest
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```
> `npm run dev` dan `npm run build` bawaan template juga menjalankan `log.js` (mengirim data pemakaian anonim). Tim memakai varian `-nolog`.

Sebelum menyatakan suatu tugas selesai, pastikan `typecheck`, `lint`, dan `test` lulus (atau katakan terus terang bila belum bisa dijalankan).

## 4. Aturan Arsitektur (WAJIB, tidak boleh dilanggar)

1. **`src/engine/` TypeScript murni.** Dilarang mengimpor `phaser`, `react`, atau apa pun dari `game/`, `ui/`, `controller/`. Dilarang memakai DOM, `Math.random()`, `Date.now()`, `performance.now()`, `setTimeout`/`setInterval` di dalam engine.
2. **Keacakan hanya lewat `engine/prng.ts` yang berbasis seed.** Seed sama harus menghasilkan jalannya simulasi yang sama.
3. **Phaser hanya merender.** Tidak ada aturan permainan (benar/salah, menang/kalah, perhitungan metrik) di `game/`. Semuanya dihitung engine.
4. **Jam simulasi hanya di `SimulationController`.** Engine hanya maju saat `step()` dipanggil.
5. **React tidak memanggil Phaser langsung.** Komponen UI memanggil controller; hal non-simulasi memakai `EventBus`.
6. **Level adalah data** di `src/levels/`. Jangan menulis logika khusus level di dalam engine; jika butuh perilaku baru, tambahkan sebagai instruksi/primitif generik (lihat `ARCHITECTURE.md` bagian 11).
7. **Setiap perubahan di `engine/` harus disertai tes Vitest.**
8. Warna state di UI **selalu disertai label atau ikon**, jangan hanya warna.

Jika permintaan pengguna bertentangan dengan aturan di atas, **sampaikan konfliknya dan tanyakan** sebelum menulis kode.

## 5. Cara Bekerja dengan Tim (Pemula)

- **Satu tugas per sesi**, diambil dari `TASKS.md` (sebut ID-nya, mis. `T-021`). Jangan mengerjakan hal di luar tugas itu tanpa izin.
- **Berikan berkas lengkap**, bukan potongan, untuk setiap berkas yang diubah atau dibuat. Tim sering salah menyalin potongan kode.
- **Jelaskan dengan sederhana:** sebelum kode, tulis singkat apa yang akan dibuat dan mengapa; setelah kode, jelaskan fungsi tiap berkas dalam beberapa kalimat. Tiap anggota harus mampu menjelaskan kodenya saat presentasi.
- **Pilih solusi paling sederhana yang memenuhi tugas.** Hindari abstraksi berlebihan, pola desain yang tidak perlu, atau trik yang sulit dipahami pemula.
- **Jujur soal ketidakpastian.** Jika tidak yakin dengan API, perilaku, atau hasil suatu perintah, katakan, dan tunjukkan cara memeriksanya. Jangan mengarang.
- **Beri tahu masalah yang kamu lihat**, termasuk pada desain atau keputusan yang sudah diambil, sambil tetap menghormati keputusan tim. Jangan diam jika ada bug, risiko, atau kekurangan yang jelas.
- Jangan menghapus atau menulis ulang berkas di luar tugas. Jika perlu merombak, minta persetujuan dulu.

## 6. Gaya Kode

- `strict: true`, **tanpa `any`**; gunakan tipe yang jelas (`union` untuk instruksi dan event).
- Fungsi sebisa mungkin murni; mutasi state hanya di dalam kelas engine.
- Nama berkas: `camelCase.ts` untuk modul; `PascalCase.ts(x)` untuk kelas dan komponen.
- **Identifier dalam bahasa Inggris; komentar, pesan UI, dan dokumen dalam bahasa Indonesia** (istilah teknis OS tetap bahasa Inggris: mutex, semaphore, race condition, dst.).
- Satu berkas satu tanggung jawab; hindari berkas lebih dari sekitar 300 baris.
- Komentar menjelaskan **mengapa**, bukan mengulang apa yang sudah jelas dari kode.

## 7. Istilah yang Konsisten

Pakai pemetaan metafora dari `PRD.md` bagian 6 di nama kelas, teks UI, dan komentar:
robot = thread · papan stok = shared variable · pintu kunci = mutex · kartu akses = semaphore · lampu sinyal = condition variable · Si Penjadwal = scheduler · teknisi dan kunci inggris = Dining Philosophers.

Teks UI/penjelasan harus **benar secara konsep sisop** (mis. jangan menyebut mutex dan semaphore sebagai hal yang sama). Jika ragu soal definisi, rujuk materi kuliah atau tanyakan.

## 8. Aset dan Lisensi

- Aset awal: bentuk geometris (kotak/lingkaran) dengan label. Sprite eksternal (mis. Kenney.nl) hanya sebagai polesan akhir.
- Setiap aset, font, atau library eksternal: **catat sumber dan lisensinya** di README bagian "Kredit". Jangan menyalin kode dari repositori lain tanpa mencantumkan sumber dan lisensi; referensi hanya untuk dipelajari.

## 9. Pencatatan Penggunaan AI (Kewajiban Tugas)

Ketentuan tugas mewajibkan pencantuman bagian yang dibantu AI. Setelah menyelesaikan tugas, ingatkan pengguna untuk menambahkan satu baris di `docs/AI_USAGE.md`:
`tanggal · ID tugas · berkas yang dibantu AI · ringkasan peran AI · siapa yang meninjau`.

## 10. Definition of Done (per tugas)

- [ ] Sesuai `PRD.md` dan tidak melanggar aturan bagian 4.
- [ ] `typecheck`, `lint`, dan `test` lulus (atau dijelaskan mengapa belum).
- [ ] Tes baru ditambahkan untuk perubahan di `engine/`.
- [ ] Berkas lengkap diberikan, disertai penjelasan singkat.
- [ ] Baris `docs/AI_USAGE.md` disiapkan.
- [ ] Item yang bersangkutan di `TASKS.md` bisa dicentang.

## 11. Git (Ringkas)

Commit kecil dan sering, satu tugas per branch, pesan commit singkat dengan awalan `feat:`, `fix:`, `test:`, `docs:`, atau `refactor:`. Riwayat commit menjadi bukti kontribusi tiap anggota.
