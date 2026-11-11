import type { Instruction, ThreadDef } from '../../engine/types';
import type { LevelDefinition } from '../types';

/** Program asli teknisi memakai dua LOCK terpisah agar Hold & Wait dapat terjadi. */
export const LEVEL_2_3_TECHNICIAN_PROGRAM: Instruction[] = [
  { op: 'WORK', ticks: 2 }, // thinking
  { op: 'LOCK', mutex: 'fork0' },
  { op: 'LOCK', mutex: 'fork1' },
  { op: 'WORK', ticks: 3 }, // eating
  { op: 'UNLOCK', mutex: 'fork1' },
  { op: 'UNLOCK', mutex: 'fork0' },
];

function makeTechnicianThreads(): ThreadDef[] {
  const threads: ThreadDef[] = [];
  for (let i = 0; i < 5; i++) {
    const leftFork = `fork${i}`;
    const rightFork = `fork${(i + 1) % 5}`;
    threads.push({
      id: `T${i + 1}`,
      label: `Teknisi ${i + 1}`,
      program: [
        { op: 'WORK', ticks: 2 },
        { op: 'LOCK', mutex: leftFork },
        { op: 'LOCK', mutex: rightFork },
        { op: 'WORK', ticks: 3 },
        { op: 'UNLOCK', mutex: rightFork },
        { op: 'UNLOCK', mutex: leftFork },
      ],
      repeat: 3,
    });
  }
  return threads;
}

export const LEVEL_2_3_THREADS: ThreadDef[] = makeTechnicianThreads();

/**
 * Level 2-3 (Meja Teknisi / Dining Philosophers).
 * 5 teknisi duduk di meja bundar, 5 kunci inggris.
 * Setiap teknisi butuh 2 kunci (kiri & kanan) untuk makan.
 * Setiap kunci diambil dan dilepas terpisah sehingga semua dapat menahan kunci
 * kiri sambil menunggu kunci kanan.
 */
export const level2_3: LevelDefinition = {
  id: '2-3',
  module: 2,
  title: 'Meja Teknisi',
  intro: [
    {
      mood: 'netral',
      text:
        'Selamat datang di meja teknisi, Mandor! Lima teknisi duduk mengelilingi meja, ' +
        'di antara mereka ada 5 kunci inggris. Tiap teknisi butuh 2 kunci (kiri & kanan) ' +
        'untuk bisa bekerja. Mereka berpikir sebentar, lalu coba ambil kedua kunci.',
    },
    {
      mood: 'sedih',
      text:
        'Masalahnya, kalau semua ambil kunci kiri bersamaan, tidak ada yang bisa ambil kunci kanan. ' +
        'Semua diam menunggu selamanya. Itu namanya DEADLOCK: saling menunggu, tidak ada yang jalan.',
    },
    {
      mood: 'berpikir',
      text:
        'Kamu bisa coba strategi: (1) urutkan pengambilan kunci (mis. semua ambil nomor terkecil dulu), ' +
        '(2) batasi 4 teknisi sekaligus pakai semaphore, (3) genap ambil kiri dulu, ganjil kanan dulu. ' +
        'Atau biarkan deadlock lalu "Rampas kunci" (preemption). Misimu: semua teknisi makan selesai, ' +
        'tanpa saling menunggu, dan fair (jumlah makan merata).',
    },
  ],
  hints: [
    'Deadlock butuh 4 kondisi Coffman: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Coba pecah salah satunya.',
    'Strategi urutan resource: beri nomor urut pada kunci (0-4), teknisi selalu ambil nomor kecil dulu. Ini memutus Circular Wait.',
    'Strategi batasi 4: gunakan semaphore dengan nilai 4. Maksimal 4 teknisi boleh coba ambil kunci, jadi minimal 1 pasti bisa makan.',
    'Strategi asimetris: teknisi genap ambil kiri dulu, ganjil ambil kanan dulu. Ini juga memutus Circular Wait.',
  ],
  concepts: [
    'Deadlock',
    'Kondisi Coffman (4 syarat)',
    'Resource ordering',
    'Semaphore batasi jumlah proses',
    'Asimetris genap/ganjil',
    'Deteksi & pemulihan deadlock',
  ],
  explanation: {
    pass:
      'Tidak ada deadlock. Semua teknisi makan 3x dan selesai. ' +
      'Strategi yang dipakai memutus salah satu kondisi Coffman. ' +
      'Fairness: jumlah makan tiap teknisi merata (selisih maksimal 1).',
    fail:
      'TERJADI DEADLOCK! Semua teknisi ambil kunci kiri, lalu diam menunggu kunci kanan. ' +
      'Empat kondisi Coffman terpenuhi: (1) kunci cuma boleh dipegang 1 orang, ' +
      '(2) teknisi nahan kiri sambil nunggu kanan, (3) tidak bisa dirampas, (4) lingkaran menunggu. ' +
      'Coba strategi: urutkan kunci, batasi 4 teknisi, atau asimetris genap/ganjil.',
  },
  resultTitle: {
    pass: 'Bagus! Semua Teknisi Makan Lancar!',
    fail: 'Waduh, Deadlock! Semua Diam Menunggu!',
  },
  layoutId: '2-3',
  threads: LEVEL_2_3_THREADS,
  sharedVars: { makan: 0 },
  resources: [
    { kind: 'mutex', id: 'fork0', label: 'Kunci 1' },
    { kind: 'mutex', id: 'fork1', label: 'Kunci 2' },
    { kind: 'mutex', id: 'fork2', label: 'Kunci 3' },
    { kind: 'mutex', id: 'fork3', label: 'Kunci 4' },
    { kind: 'mutex', id: 'fork4', label: 'Kunci 5' },
  ],
  availableTools: [],
  scheduler: { kind: 'random', cores: 5 },
  tutorialSeed: 10,
  maxTicks: 500,
  goal: {
    target: { variable: 'makan', value: 15 },
    invariant: (snap) => {
      const allTerminated = snap.threads.every((t) => t.state === 'TERMINATED');
      if (!allTerminated) {
        return {
          ok: false,
          message: 'Simulasi belum selesai (deadlock atau maxTicks).',
        };
      }
      const meals = snap.threads.map((t) => t.iteration);
      const maxMeal = Math.max(...meals);
      const minMeal = Math.min(...meals);
      if (maxMeal - minMeal > 1) {
        return {
          ok: false,
          message: `Fairness gagal: makan ${maxMeal} vs ${minMeal} (selisih > 1).`,
        };
      }
      return {
        ok: true,
        message: 'Semua teknisi makan 3x, fair, tanpa deadlock.',
      };
    },
    stars: { fast: 60, lowWait: 40 },
  },
};