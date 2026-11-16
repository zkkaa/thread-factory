import type { LevelDefinition } from '../types';

/**
 * Teks Pak Mandor untuk Level 2-4 (Lini Produksi Penuh).
 * Tiga area: Ban Berjalan, Papan Pengumuman, dan Meja Teknisi.
 * Angka anggaran (4 koin) harus sama dengan LEVEL_2_4_TOOL_BUDGET.
 */
export const LEVEL_2_4_CONTENT: Required<
  Pick<
    LevelDefinition,
    'intro' | 'hints' | 'concepts' | 'explanation' | 'resultTitle'
  >
> = {
  intro: [
    {
      mood: 'netral',
      text:
        'Mandor, sekarang pabrik kita benar-benar besar! Tiga area bekerja ' +
        'bersamaan: Ban Berjalan di kiri, Papan Pengumuman di tengah, dan ' +
        'Meja Teknisi di kanan.',
    },
    {
      mood: 'sedih',
      text:
        'Tetapi setiap area punya masalahnya sendiri. Di ban, barang bisa ' +
        'terlalu banyak (overflow) atau tidak ada (underflow). Di papan, ' +
        'pembaca bisa melihat tulisan setengah jadi saat penulis sedang ' +
        'bekerja. Di meja, lima teknisi bisa saling menunggu selamanya.',
    },
    {
      mood: 'berpikir',
      text:
        'Anggaran kita terbatas: 4 koin untuk semua pengaman. Perhatikan ' +
        'berapa koin yang dipakai tiap alat di toolbox, lalu bagi dengan ' +
        'cermat. Misimu: ketiga area aman dan tuntas. Pada seed 1, bintang ' +
        'kedua untuk selesai dalam 100 tick, dan bintang ketiga bila total ' +
        'waktu tunggu paling banyak 300 tick. Selamat bekerja!',
    },
  ],
  hints: [
    'Jalankan dulu tanpa pengaman. Perhatikan area mana yang bermasalah dan ' +
      'apa bentuk masalahnya: barang meluap atau kosong, tulisan setengah ' +
      'jadi, atau teknisi saling menunggu.',
    'Ban berjalan butuh dua penjaga: satu agar perakit menunggu slot kosong, ' +
      'satu agar pengepak menunggu barang tersedia.',
    'Papan butuh pengaman baca-tulis. Pilih kebijakannya dengan hati-hati: ' +
      'bila pembaca selalu didahulukan, apakah penulis pernah kebagian giliran?',
    'Meja teknisi macet kalau semua teknisi memegang satu kunci dan menunggu ' +
      'tetangganya. Kartu Akses membatasi berapa teknisi yang boleh mulai.',
    'Semua pengaman memakai koin dan anggarannya pas. Setelah ketiga area ' +
      'aman, coba ubah kebijakan papan dan nilai Kartu Akses, lalu ' +
      'bandingkan waktu tunggunya.',
  ],
  concepts: [
    'Kombinasi masalah klasik konkurensi',
    'Producer-Consumer (bounded buffer)',
    'Readers-Writers dan starvation',
    'Dining Philosophers dan deadlock',
    'Anggaran sumber daya terbatas',
    'Prioritas dan trade-off dalam desain sistem',
  ],
  explanation: {
    pass:
      'Dengan kombinasi pengaman yang tepat dalam anggaran terbatas, ketiga ' +
      'area berjalan tuntas. Ban tidak meluap atau kosong, papan menampilkan ' +
      'data yang utuh dan semua penulis kebagian giliran, dan teknisi ' +
      'menyelesaikan pekerjaan tanpa macet. Tiap area punya masalah dan ' +
      'pengaman yang berbeda, dan pilihanmu menunjukkan trade-off dalam ' +
      'sistem nyata.',
    fail:
      'Masih ada area yang bermasalah. Pesan hasil menyebut level komponen ' +
      'pertama yang gagal: 2-1 untuk ban, 2-2 untuk papan, 2-3 untuk meja ' +
      'teknisi. Periksa log kejadian untuk area itu, lalu coba konfigurasi ' +
      'pengaman yang berbeda.',
  },
  resultTitle: {
    pass: 'Luar Biasa! Pabrik Beroperasi Optimal!',
    fail: 'Ada Area yang Masih Bermasalah!',
  },
};