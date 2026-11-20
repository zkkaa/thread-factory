import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';

const ASSEMBLER_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 1 },
  { op: 'READ', from: 'barang', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: 1 },
  { op: 'WRITE', reg: 'r', to: 'barang' },
  { op: 'ENTER_AREA', area: 'aula' },
  { op: 'WORK', ticks: 1 },
  { op: 'LEAVE_AREA', area: 'aula' },
];

const WAREHOUSE_PROGRAM: Instruction[] = ASSEMBLER_PROGRAM.map((instruction) =>
  instruction.op === 'WORK' ? { ...instruction, ticks: 2 } : { ...instruction },
);

const PACKER_PROGRAM: Instruction[] = [
  { op: 'SPIN_UNTIL', variable: 'barang', atLeast: 1 },
  { op: 'READ', from: 'barang', into: 'r' },
  { op: 'COMPUTE', reg: 'r', add: -1 },
  { op: 'WRITE', reg: 'r', to: 'barang' },
  { op: 'ENTER_AREA', area: 'aula' },
  { op: 'WORK', ticks: 3 },
  { op: 'LEAVE_AREA', area: 'aula' },
];

export const LEVEL_1_5_THREADS: ThreadDef[] = [
  {
    id: 'A',
    label: 'Perakit',
    program: ASSEMBLER_PROGRAM,
    repeat: 3,
  },
  {
    id: 'W',
    label: 'Penggudang',
    program: WAREHOUSE_PROGRAM,
    repeat: 3,
  },
  {
    id: 'P',
    label: 'Pengepak',
    program: PACKER_PROGRAM,
  },
];

export const level1_5: LevelDefinition = {
  id: '1-5',
  module: 1,
  title: 'Lini Gabungan',
  intro: [
    {
      mood: 'netral',
      text:
        'Perakit, Penggudang, dan Pengepak kini bekerja di satu lini. Perakit dan ' +
        'Penggudang masing-masing menambah 3 barang ke Papan Stok. Pengepak menunggu ' +
        'barang pertama, lalu mengambil satu.',
    },
    {
      mood: 'berpikir',
      text:
       'Ada tiga masalah sekaligus. Papan Stok diubah banyak robot, aula hanya muat ' +
        'satu robot, dan Pengepak tidak boleh terus mengecek barang. Hasil akhir harus ' +
        'tepat 5. Bintang 1 butuh hasil benar tanpa bentrok dan tanpa busy waiting. ' +
        'Pada seed 10, bintang 2 jika selesai dalam 70 tick, dan bintang 3 jika total ' +
        'waktu tunggu paling banyak 80 tick.',
    },
    {
      mood: 'senang',
      text:
        'Tiap masalah punya alatnya sendiri: Pintu Mutex, Kartu Akses, dan Lampu ' +
        'Sinyal. Satu alat tidak bisa menggantikan yang lain. Amati dulu apa yang ' +
        'salah, baru pilih alatnya. Selamat bekerja!',
    },
  ],  

  hints: [
    'Jalankan tanpa alat dan perhatikan: mana yang salah angka, mana yang bentrok, mana yang kehabisan baterai?',
    'Salah angka: Pintu Mutex. Bentrok karena kepenuhan: Kartu Akses. Boros baterai: Lampu Sinyal.',
    'Jangan pasang alat di tempat yang tidak bermasalah. Setiap alat punya harga berupa waktu menunggu.',
  ],

  concepts: [
    'Race condition dan critical section',
    'Mutex dan granularitas lock',
    'Counting semaphore dan kapasitas resource',
    'Condition variable',
    'Blocking vs busy waiting',
  ],

  explanation: {
    pass:
      'Pintu Mutex menjaga agar pembaruan Papan Stok tidak saling bertabrakan. ' +
      'Kartu Akses membatasi jumlah robot yang boleh masuk ke aula. Sementara itu, ' +
      'Lampu Sinyal membuat Pengepak bisa menunggu tanpa terus-menerus mengecek barang. ' +
      'Ketiga alat memiliki fungsi masing-masing dan digunakan bersama karena ' +
      'saling melengkapi, bukan menggantikan satu sama lain.',

    fail:
      'Periksa setiap masalah satu per satu. Pembaruan stok membutuhkan mutex untuk ' +
      'melindungi proses READ, COMPUTE, dan WRITE. Aula membutuhkan semaphore dengan ' +
      'nilai 1 agar hanya satu robot yang boleh masuk. Sementara itu, Pengepak ' +
      'membutuhkan condition variable agar bisa menunggu sampai barang tersedia tanpa ' +
      'terus-menerus mengecek meja. Condition variable harus digunakan bersama mutex, ' +
      'dan jumlah barang tetap harus diperiksa kembali setelah robot bangun.',
  },
  resultTitle: {
    pass: 'Bagus! Lini Berjalan Serempak!',
    fail: 'Waduh, Lini Masih Bermasalah!',
  },
  layoutId: '1-5',
  threads: LEVEL_1_5_THREADS,
  sharedVars: { barang: 0 },
  areas: { aula: 1 },
  resources: [
    { kind: 'mutex', id: 'meja', label: 'Pintu Papan Stok' },
    {
      kind: 'semaphore',
      id: 'kartu',
      initialValue: 1,
      label: 'Kartu Akses Aula',
    },
    { kind: 'condition', id: 'lampu', mutex: 'meja', label: 'Lampu Sinyal' },
  ],
  availableTools: ['mutex', 'semaphore', 'condition'],
  scheduler: {
    kind: 'scripted',
    cores: 2,
    script: ['P', 'A', 'W'],
  },
  tutorialSeed: 10,
  maxTicks: 2000,
  goal: {
    target: { variable: 'barang', value: 5 },
    invariant: (snapshot) => {
      if (snapshot.sharedVars['barang'] !== 5) {
        return {
          ok: false,
          message:
            `Barang tersisa ${snapshot.sharedVars['barang']}, seharusnya 5 ` +
            'setelah Pengepak mengambil satu barang.',
        };
      }
      if (snapshot.overloadTicks > 0) {
        return {
          ok: false,
          message: `Terjadi ${snapshot.overloadTicks} tick bentrok di aula.`,
        };
      }
      if (snapshot.busyWaitTicks > 0) {
        return {
          ok: false,
          message: `Pengepak melakukan busy waiting selama ${snapshot.busyWaitTicks} tick.`,
        };
      }
      return {
        ok: true,
        message: 'Stok, kapasitas aula, dan sinyal sudah benar.',
      };
    },
    stars: { fast: 70, lowWait: 80 },
  },
};
