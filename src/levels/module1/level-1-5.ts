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
        'Perakit, Penggudang, dan Pengepak kini bekerja di lini yang sama. ' +
        'Perakit dan Penggudang masing-masing menambahkan 3 barang ke Papan ' +
        'Stok, sementara Pengepak menunggu barang pertama sebelum mulai.',
    },
    {
      mood: 'berpikir',
      text:
        'Tiga robot berbagi area yang hanya muat satu robot. Papan Stok juga ' +
        'diperbarui oleh lebih dari satu robot, jadi hasil akhirnya harus ' +
        'tepat 5 setelah Pengepak mengambil satu barang. Bintang pertama ' +
        'memerlukan hasil benar tanpa bentrok atau busy waiting.',
    },
    {
      mood: 'senang',
      text:
        'Pilih kombinasi Pintu Mutex untuk baca-hitung-tulis, Kartu Akses ' +
        'bernilai 1 untuk area, dan Lampu Sinyal bersama mutex. Pasang pintu ' +
        'Mutex dari slot 1 sampai 4, gerbang Kartu Akses dari slot 4 sampai 7, ' +
        'dan sinyal setelah WRITE Perakit (slot 4). Pada seed 10, bintang ' +
        'berikutnya perlu selesai paling lama 70 tick dan bintang ketiga perlu ' +
        'total waktu tunggu paling banyak 80 tick.',
    },
  ],
  hints: [
    'Amati tiga masalah berbeda: angka di Papan Stok, kapasitas area bersama, dan Pengepak yang menunggu barang.',
    'Mutex melindungi baca-hitung-tulis. Semaphore membatasi jumlah robot di aula, sedangkan condition variable membuat Pengepak tidur tanpa busy waiting.',
    'Pasang mutex di slot 1–4, semaphore bernilai 1 di slot 4–7, lalu condition variable pada Pengepak dengan sinyal Perakit di slot 4.',
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
      'Pintu Mutex menjaga pembaruan Papan Stok agar tidak ada lost update. ' +
      'Kartu Akses membatasi isi aula sesuai kapasitasnya, dan Lampu Sinyal ' +
      'membuat Pengepak menunggu tanpa busy waiting. Ketiga alat punya tugas ' +
      'berbeda dan dipakai bersama, bukan saling menggantikan.',
    fail:
      'Periksa tiap masalah secara terpisah: pembaruan stok perlu mutex pada ' +
      'READ–COMPUTE–WRITE, aula perlu semaphore bernilai 1, dan ' +
      'Pengepak perlu condition variable yang memberi sinyal setelah barang ' +
      'tersedia. Condition variable digunakan bersama mutex dan syarat barang ' +
      'tetap harus diperiksa setelah bangun.',
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
          message:
            `Pengepak melakukan busy waiting selama ${snapshot.busyWaitTicks} tick.`,
        };
      }
      return { ok: true, message: 'Stok, kapasitas aula, dan sinyal sudah benar.' };
    },
    stars: { fast: 70, lowWait: 80 },
  },
};
