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
        'Anggaran kita terbatas. Kamu hanya punya 4 koin untuk membeli ' +
        'pengaman. Pikirkan mana yang paling kritis untuk dilindungi, lalu ' +
        'pasang dengan bijak. Jalankan simulasi dan lihat bagaimana pilihanmu ' +
        'memengaruhi ketiga area.',
    },
  ],
  hints: [
    'Jalankan dulu tanpa pengaman untuk melihat di mana masalah terberat. ' +
      'Apakah di ban, papan, atau meja teknisi?',
    'Ban berjalan butuh tiga semaphore: empty (menghitung slot kosong), full ' +
      '(menghitung barang), dan mutex (melindungi operasi baca-tulis pada ' +
      'indeks). Jika ban sering penuh atau kosong, berarti sinkronisasi ' +
      'producer-consumer belum tepat.',
    'Papan pengumuman membutuhkan rwlock. Pembaca boleh bersamaan, tetapi ' +
      'penulis harus eksklusif. Pilih kebijakan yang sesuai: reader-priority ' +
      'cepat tapi bisa kelaparan penulis, writer-priority adil tapi lambat, ' +
      'atau fair (FIFO).',
    'Meja teknisi bisa deadlock kalau semua teknisi ambil kunci kiri ' +
      'bersamaan. Coba strategi urutan resource (nomor terkecil dulu), ' +
      'batas 4 teknisi, atau asimetris genap/ganjil.',
    'Dengan hanya 4 koin, kamu harus prioritas. Apakah kamu fokus melindungi ' +
      'area yang paling sering bermasalah, atau mencoba menyeimbangkan ketiga ' +
      'area?',
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
