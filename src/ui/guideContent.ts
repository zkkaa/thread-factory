import type { ThreadState } from '../engine/types';

/** Satu langkah di bagian "Cara bermain". */
export interface GuideStep {
  title: string;
  text: string;
}

/** Arti satu status thread (robot). NEW tidak ditampilkan ke pemain. */
export interface RobotStateInfo {
  state: Exclude<ThreadState, 'NEW'>;
  meaning: string;
}

/** Satu kontrol atau komponen HUD. */
export interface HudControlInfo {
  label: string;
  text: string;
}

/** Satu istilah glosarium beserta wujudnya di game. */
export interface GlossaryEntry {
  term: string;
  definition: string;
  inGame: string;
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    title: 'Amati',
    text:
      'Jalankan level tanpa pengaman apa pun. Perhatikan apa yang salah: ' +
      'angka stok tidak sesuai, robot menganggur, atau robot saling menunggu.',
  },
  {
    title: 'Pasang',
    text:
      'Seret alat dari toolbox di bawah layar ke slot di jalur robot. Pintu ' +
      'mutex dipasang dua kali: pintu masuk dahulu, lalu pintu keluar. ' +
      'Kesulitan menyeret? Klik alatnya, lalu klik slotnya.',
  },
  {
    title: 'Jalankan',
    text:
      'Tekan Run dan bandingkan hasilnya. Pak Mandor menjelaskan apa yang ' +
      'terjadi dan memberi bintang untuk hasil yang benar, cepat, dan hemat.',
  },
];

/** Catatan di bawah tiga langkah. */
export const GUIDE_TIPS: readonly string[] = [
  'Alat hanya bisa diubah sebelum simulasi berjalan. Tekan Reset untuk memasang ulang.',
  'Bintang hanya dinilai pada seed tutorial level, supaya adil bagi semua pemain.',
];

/** Penjelasan Si Penjadwal, ditaruh di atas daftar status. */
export const SCHEDULER_NOTE =
  'Si Penjadwal (scheduler) memilih robot mana yang boleh jalan di tiap ' +
  'tick; jumlah robot yang bisa jalan sekaligus sebanyak core. Robot yang ' +
  'tidak terpilih dibekukan sementara.';

export const ROBOT_STATES: readonly RobotStateInfo[] = [
  {
    state: 'READY',
    meaning:
      'Siap jalan, tetapi menunggu dipilih Si Penjadwal. Robot dibekukan.',
  },
  {
    state: 'RUNNING',
    meaning: 'Sedang dipilih dan menjalankan satu instruksi (menyala).',
  },
  {
    state: 'WAITING',
    meaning:
      'Diblokir: menunggu pintu yang dipegang robot lain, kartu akses, atau ' +
      'lampu sinyal. Si Penjadwal tidak memilihnya sampai ia dibangunkan.',
  },
  {
    state: 'TERMINATED',
    meaning: 'Seluruh program robot sudah selesai.',
  },
];

export const HUD_CONTROLS: readonly HudControlInfo[] = [
  { label: 'Play / Pause', text: 'Menjalankan atau menjeda simulasi.' },
  {
    label: 'Step',
    text: 'Maju tepat satu tick, yaitu satu langkah simulasi, lalu berhenti.',
  },
  {
    label: 'Reset',
    text: 'Kembali ke awal (tick 0). Setelah itu alat bisa diubah lagi.',
  },
  {
    label: 'Kecepatan (0.5x / 1x / 5x)',
    text:
      'Mengatur seberapa cepat tick berjalan. Hasil simulasi tidak berubah, ' +
      'hanya tampilannya yang lebih lambat atau cepat.',
  },
  {
    label: 'Seed',
    text:
      'Angka yang menentukan urutan giliran robot. Seed yang sama selalu ' +
      'menghasilkan kejadian yang sama persis. Mengubah seed mengulang ' +
      'simulasi dari awal.',
  },
  {
    label: 'Misi',
    text: 'Target level dan kriteria bintang. Bisa dilipat.',
  },
  {
    label: 'Log Kejadian',
    text: 'Daftar kejadian simulasi, terbaru di atas. Bisa dilipat.',
  },
  {
    label: 'Metrik',
    text: 'Angka kinerja seperti waktu tunggu tiap robot. Bisa dibuka atau ditutup.',
  },
  {
    label: 'Tanya Pak Mandor',
    text: 'Petunjuk bertahap, dari samar sampai hampir jelas, tanpa membocorkan jawaban.',
  },
  {
    label: 'Menu',
    text: 'Membuka Menu Jeda (lanjut, ulangi level, peta level, pengaturan) dan legenda status robot.',
  },
];

export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    term: 'Race condition',
    definition:
      'Hasil program ikut berubah menurut urutan selang-seling (interleaving) ' +
      'beberapa thread yang mengakses data bersama tanpa pengaman. Hasilnya ' +
      'bisa salah dan berbeda dari satu jalan ke jalan berikutnya.',
    inGame:
      'Dua robot sama-sama membaca stok lama lalu menulis hasil masing-masing, ' +
      'sehingga satu penambahan hilang (lost update).',
  },
  {
    term: 'Critical section',
    definition:
      'Bagian program yang mengakses data atau resource bersama dan hanya ' +
      'boleh dijalankan satu thread pada satu waktu (mutual exclusion).',
    inGame: 'Rentang READ sampai WRITE pada papan stok.',
  },
  {
    term: 'Mutex',
    definition:
      'Kunci dengan satu pemilik. Thread yang berhasil lock menjadi pemilik, ' +
      'thread lain yang mencoba lock harus menunggu, dan hanya pemilik yang ' +
      'boleh unlock.',
    inGame:
      'Pintu masuk (LOCK) dan pintu keluar (UNLOCK). Robot yang menunggu ' +
      'berbaris di depan pintu.',
  },
  {
    term: 'Semaphore',
    definition:
      'Penghitung bilangan bulat dengan dua operasi: wait (mengambil jatah; ' +
      'bila jatah habis, thread menunggu) dan signal (mengembalikan jatah dan ' +
      'membangunkan satu thread yang menunggu). Counting semaphore bernilai N ' +
      'mengizinkan sampai N thread sekaligus. Berbeda dengan mutex, semaphore ' +
      'tidak punya pemilik.',
    inGame:
      'Kartu Akses: hanya robot yang memegang kartu yang boleh masuk aula mesin.',
  },
  {
    term: 'Condition variable',
    definition:
      'Tempat menunggu sampai suatu kondisi terpenuhi, selalu berpasangan ' +
      'dengan mutex. Thread yang menunggu tidur (diblokir) dan baru ' +
      'dibangunkan saat thread lain memberi sinyal. Dengan begitu tidak ada ' +
      'busy waiting, yaitu mengecek kondisi berulang-ulang sambil menghabiskan ' +
      'CPU.',
    inGame:
      'Lampu Sinyal: pengepak tidur sampai lampu hijau (barang di meja cukup).',
  },
  {
    term: 'Deadlock',
    definition:
      'Sekelompok thread saling menunggu resource yang dipegang anggota lain, ' +
      'sehingga tidak ada yang bisa maju. Terjadi hanya bila keempat kondisi ' +
      'Coffman terpenuhi bersamaan: mutual exclusion, hold and wait, no ' +
      'preemption, dan circular wait.',
    inGame:
      'Lima teknisi masing-masing memegang satu kunci inggris dan menunggu ' +
      'kunci tetangganya.',
  },
  {
    term: 'Starvation',
    definition:
      'Sebuah thread terus-menerus tidak kebagian giliran atau resource, ' +
      'padahal thread lain tetap berjalan. Berbeda dengan deadlock: sistem ' +
      'tidak macet total.',
    inGame:
      'Writer di Papan Pengumuman tak pernah dapat giliran karena reader ' +
      'terus berdatangan (reader priority).',
  },
];
