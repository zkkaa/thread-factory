import type { LevelDefinition } from '../types';

/**
 * Teks Pak Mandor untuk Level 2-4 (Lini Produksi Penuh).
 * Tiga area: Ban Berjalan, Papan Pengumuman, dan Meja Teknisi.
 * Angka anggaran (4 koin) harus sama dengan LEVEL_2_4_TOOL_BUDGET.
 * Kriteria bintang tampil di chip Misi, jadi tidak ditulis di dialog.
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
        'bersamaan: Ban Berjalan dan Papan Pengumuman di bagian atas, ' +
        'serta Meja Teknisi di bagian bawah.',
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
        'cermat. Misimu: ketiga area aman dan tuntas. Selamat bekerja!',
    },
  ],
  hints: [
    'Jalankan dulu tanpa pengaman. Perhatikan area mana yang bermasalah dan ' +
      'apa bentuk masalahnya: barang meluap atau kosong, tulisan setengah ' +
      'jadi, atau teknisi saling menunggu.',
    'Ban berjalan butuh dua penjaga: satu agar perakit menunggu slot kosong, ' +
      'satu agar pengepak menunggu barang tersedia.',
    'Papan butuh pengaman baca-tulis. Jika pembaca selalu didahulukan, ' +
      'penulis bisa menunggu terlalu lama dan tidak kebagian giliran. ' +
      'Bandingkan tiga aturan giliran dan pilih yang membuat keduanya ' +
      'mendapat kesempatan.',
    'Meja teknisi macet kalau semua teknisi memegang satu kunci dan menunggu ' +
      'tetangganya. Kartu Akses membatasi berapa teknisi yang boleh mulai. ' +
      'Pasang gerbang masuk sebelum kunci pertama diambil dan gerbang keluar ' +
      'setelah kunci terakhir dilepas.',
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
      'Ketiga area berjalan tuntas dalam anggaran terbatas. Di ban, dua ' +
      'penjaga membuat perakit menunggu saat ban penuh dan pengepak menunggu ' +
      'saat ban kosong. Di papan, aturan giliran yang adil membuat pembaca ' +
      'tidak melihat tulisan setengah jadi dan semua penulis kebagian ' +
      'giliran. Di meja, Kartu Akses membatasi jumlah teknisi sehingga ' +
      'lingkaran saling menunggu putus. Tiap area punya masalah dan ' +
      'pengaman yang berbeda, dan anggaran terbatas memaksamu memilih ' +
      'dengan cermat. Itulah trade-off dalam sistem nyata.',
    fail:
      'Masih ada area yang bermasalah. Pesan hasil menyebut area pertama ' +
      'yang gagal: Ban Berjalan, Papan Pengumuman, atau Meja Teknisi. ' +
      'Periksa log kejadian untuk area itu, lalu coba konfigurasi pengaman ' +
      'yang berbeda.',
  },
  resultTitle: {
    pass: 'Luar Biasa! Pabrik Beroperasi Optimal!',
    fail: 'Ada Area yang Masih Bermasalah!',
  },
};
