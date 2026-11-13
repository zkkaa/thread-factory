import type { LevelDefinition } from '../types';

/**
 * Teks Pak Mandor untuk Level 2-4 (Lini Produksi Penuh).
 * Tiga area: Ban Berjalan, Papan Pengumuman, dan Meja Teknisi.
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
        'Anggaran kita pas: 4 koin. Ban butuh dua pengaman, papan satu, dan ' +
        'meja satu. Semuanya perlu, jadi tantanganmu adalah setelannya: ' +
        'kebijakan papan dan jumlah Kartu Akses di meja. Jalankan dan lihat ' +
        'apakah ketiga area aman.',
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
    'Semua pengaman memakai koin dan jumlahnya pas. Setelah semuanya aman, ' +
      'coba ubah kebijakan papan dan nilai Kartu Akses, lalu bandingkan ' +
      'waktu tunggunya.',
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
      'area berjalan lancar. Ban tidak meluap atau kosong, papan menampilkan ' +
      'data yang utuh, dan teknisi makan tanpa saling menunggu. Pilihanmu ' +
      'menunjukkan pemahaman tentang prioritas dan trade-off dalam sistem nyata.',
    fail:
      'Masih ada area yang bermasalah. Mungkin kamu belum memasang pengaman ' +
      'cukup untuk melindungi area kritis, atau kombinasimu belum optimal. ' +
      'Periksa log kejadian untuk melihat di mana masalahnya, lalu coba ' +
      'konfigurasi pengaman yang berbeda.',
  },
  resultTitle: {
    pass: 'Luar Biasa! Pabrik Beroperasi Optimal!',
    fail: 'Ada Area yang Masih Bermasalah!',
  },
};
