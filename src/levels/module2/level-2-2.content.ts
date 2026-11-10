import type { LevelDefinition } from '../types';

/**
 * Teks Pak Mandor untuk Level 2-2 (Papan Pengumuman, Readers-Writers), T-100.
 * Dipisah dari data level agar bisa ditulis sebelum level-2-2.ts dan layout
 * papan (T-099) selesai; level-2-2.ts menyebarkan objek ini ke LevelDefinition.
 *
 * Sesuai mekanik di engine: kunci baca-tulis dengan kebijakan reader, writer,
 * dan fair; penulis dianggap kelaparan (starvation) bila menunggu
 * terus-menerus melewati ambang `starvationTicks`.
 */
export const LEVEL_2_2_CONTENT: Required<
  Pick<
    LevelDefinition,
    'intro' | 'hints' | 'concepts' | 'explanation' | 'resultTitle'
  >
> = {
  intro: [
    {
      mood: 'netral',
      text:
        'Mandor, sekarang kita punya Papan Pengumuman besar. Banyak pembaca ' +
        'datang untuk membaca isinya, dan beberapa penulis datang untuk ' +
        'memperbarui isinya. Semuanya memakai papan yang sama.',
    },
    {
      mood: 'berpikir',
      text:
        'Aturannya begini: banyak pembaca boleh membaca bersamaan, karena ' +
        'membaca tidak mengubah apa pun. Tetapi penulis harus sendirian di ' +
        'papan. Kalau pembaca melihat papan saat penulis belum selesai, ia ' +
        'akan membaca tulisan setengah jadi.',
    },
    {
      mood: 'netral',
      text:
        'Pasang pengaman di papan, lalu pilih kebijakannya: utamakan ' +
        'pembaca (reader), utamakan penulis (writer), atau bergiliran ' +
        'sesuai urutan datang (fair). Tiap kebijakan ada untung dan ' +
        'ruginya, jadi perhatikan waktu tunggu pembaca dan penulis. ' +
        'Selamat bekerja!',
    },
  ],
  hints: [
    'Jalankan dulu tanpa pengaman. Perhatikan apa yang dilihat pembaca ' +
      'ketika penulis sedang bekerja di papan.',
    'Pembaca boleh bersamaan, tetapi penulis harus sendirian. Pengaman ' +
      'perlu membedakan keduanya, bukan memperlakukan semua orang sama.',
    'Bila pembaca selalu didahulukan dan terus berdatangan, perhatikan ' +
      'penulis yang menunggu. Apakah gilirannya pernah tiba?',
    'Coba ketiga kebijakan dengan seed yang sama, lalu bandingkan waktu ' +
      'tunggu pembaca dan penulis. Kebijakan mana yang menjamin semua ' +
      'akhirnya mendapat giliran?',
  ],
  concepts: [
    'Readers-Writers',
    'Akses bersama untuk pembaca, akses eksklusif untuk penulis',
    'Starvation',
    'Trade-off kebijakan antrean',
  ],
  explanation: {
    pass:
      'Pembaca boleh membaca bersamaan karena membaca tidak mengubah data, ' +
      'sedangkan penulis mendapat akses eksklusif sehingga tidak ada ' +
      'tulisan setengah jadi yang terbaca. Kebijakan menentukan siapa yang ' +
      'didahulukan: reader priority cepat bagi pembaca tetapi dapat membuat ' +
      'penulis kelaparan (starvation), writer priority sebaliknya, dan fair ' +
      '(FIFO) menjamin semua akhirnya dilayani dengan harga throughput yang ' +
      'bisa lebih rendah.',
    fail:
      'Ada dua kemungkinan penyebab. Pertama, pembaca dan penulis berada ' +
      'di papan bersamaan sehingga pembaca melihat data setengah jadi: ' +
      'penulis harus mendapat akses eksklusif. Kedua, satu pihak menunggu ' +
      'terus-menerus karena kebijakannya selalu mendahulukan pihak lain ' +
      '(starvation). Periksa mana yang terjadi, lalu ganti kebijakannya.',
  },
  resultTitle: {
    pass: 'Bagus! Papan Aman dan Adil!',
    fail: 'Waduh, Papan Bermasalah!',
  },
};
