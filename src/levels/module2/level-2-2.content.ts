import type { LevelDefinition } from '../types';

// Konten teks Level 2-2 (Papan Pengumuman).
// Kriteria bintang dan batas waktu tunggu ada di goal dan chip Misi.

type Level22Content = Pick<
  LevelDefinition,
  'intro' | 'hints' | 'concepts'
> & {
  explanation: NonNullable<LevelDefinition['explanation']>;
  resultTitle: NonNullable<LevelDefinition['resultTitle']>;
};

export const LEVEL_2_2_CONTENT: Level22Content = {
  intro: [
    {
      mood: 'netral',
      text:
        'Mandor, sekarang kita punya Papan Pengumuman besar. Banyak Pembaca datang untuk membaca isinya, ' +
        'dan beberapa Penulis datang untuk memperbarui isinya. Semuanya memakai papan yang sama.',
    },
    {
      mood: 'berpikir',
      text:
        'Banyak Pembaca boleh membaca bersamaan karena membaca tidak mengubah isi papan. ' +
        'Tetapi Penulis harus bekerja sendiri. Jika Pembaca melihat papan saat Penulis belum selesai, ' +
        'ia bisa membaca tulisan yang belum selesai diperbarui.',
    },
    {
      mood: 'netral',
      text:
        'Misimu adalah menjaga agar tidak ada tulisan setengah jadi yang terbaca dan tidak ada pihak yang menunggu terlalu lama. ' +
        'Coba aturan giliran Tanpa Aturan, Pembaca Duluan, Penulis Duluan, dan Adil (FIFO). Selamat bekerja!',
    },
  ],

  hints: [
    'Jalankan dengan Tanpa Aturan terlebih dahulu. Perhatikan apa yang terjadi ketika Pembaca melihat papan saat Penulis sedang mengubah isinya.',
    'Beberapa Pembaca boleh membaca bersamaan, tetapi Penulis harus bekerja sendiri. Aturan giliran harus mengatur keduanya agar tidak saling mengganggu.',
    'Jika Pembaca selalu didahulukan dan terus berdatangan, Penulis bisa menunggu terlalu lama. Perhatikan apakah Penulis akhirnya mendapat giliran.',
    'Coba ketiga aturan giliran dengan seed yang sama. Bandingkan waktu tunggu Pembaca dan Penulis. Aturan mana yang membuat keduanya mendapat kesempatan?',
  ],

  concepts: [
    'Readers-Writers',
    'Starvation',
    'Aturan Giliran',
    'FIFO',
  ],

  explanation: {
    fail:
      'Papan belum aman. Ada dua kemungkinan masalah. Pertama, Pembaca melihat papan saat Penulis belum selesai memperbarui isinya. Kedua, salah satu pihak menunggu terlalu lama karena pihak lain terus didahulukan. Kondisi ini disebut starvation. Periksa aturan giliran yang digunakan.',

    pass:
      'Papan aman! Beberapa Pembaca boleh membaca bersamaan karena tidak mengubah isi papan, sedangkan Penulis harus mendapat akses eksklusif untuk memperbarui isinya. Pembaca Duluan (Reader Priority) mendahulukan Pembaca, tetapi Penulis bisa menunggu terlalu lama. Penulis Duluan (Writer Priority) mendahulukan Penulis, tetapi Pembaca bisa menunggu lama. Adil (FIFO) memberikan giliran sesuai urutan kedatangan agar keduanya mendapat kesempatan.',
  },

  resultTitle: {
    pass: 'Papan Pengumuman Aman!',
    fail: 'Waduh, Papan Bermasalah!',
  },
};
