# Catatan Uji Manual: Thread Factory

> Hasil uji yang tidak bisa dicek otomatis. Diisi per tugas; sertakan tanggal, penguji, dan peramban.

## U-062: Skala FIT, HiDPI, dan ukuran jendela

| Skenario | Hasil | Catatan |
|---|---|---|
| 1280x720: kanvas penuh, tanpa scroll | | |
| 1920x1080: kanvas diskalakan, HUD tidak bergeser | | |
| Ubah ukuran jendela saat bermain: kanvas ikut menyesuaikan | | |
| Zoom peramban 125% dan 150% | | |
| Layar HiDPI (devicePixelRatio 2): teks arena tajam | | |
| Seret pintu ke slot setelah ukuran diubah: slot menyala tepat di bawah kursor | | |
| Chrome dan Firefox/Edge | | |

## U-063: Kinerja arena Level 1-1

Perangkat: ______ (CPU, RAM, peramban). Cara ukur: DevTools, Rendering, Frame Rendering Stats.

| Skenario | FPS rata-rata | FPS terendah | Catatan |
|---|---|---|---|
| Diam (idle), tanpa alat | | | |
| Run 1x, mutex terpasang | | | |
| Run 5x, mutex terpasang | | | |
| Run 5x, tanpa alat (banyak tabrakan) | | | |