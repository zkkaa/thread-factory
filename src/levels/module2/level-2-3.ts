import type { Snapshot } from '../../engine/types';
import type { LevelDefinition, ResourceDef } from '../types';
import {
  LEVEL_2_3_FORKS,
  LEVEL_2_3_MEALS,
  LEVEL_2_3_SCHEDULER,
  LEVEL_2_3_SEAT_SEMAPHORE,
  LEVEL_2_3_TECHNICIANS,
  LEVEL_2_3_THREADS,
} from './level-2-3.scenario';

/**
 * Seed tutorial: harus seed yang PASTI membuat tanpa alat berujung deadlock
 * (dijaga tes level-2-3.test.ts). Ubah bila tes itu gagal.
 */
export const LEVEL_2_3_TUTORIAL_SEED = 1;

const FORK_RESOURCES: ResourceDef[] = LEVEL_2_3_FORKS.map((id, i) => ({
  kind: 'mutex',
  id,
  label: `Kunci inggris ${i + 1}`,
}));

/**
 * Level ini tidak punya variabel bersama yang ditulis robot. `computeMetrics`
 * mewajibkan variabel target ada di snapshot, jadi dipakai penanda "selesai"
 * yang nilainya tetap 0 dan targetnya 0 (lostUpdates selalu 0).
 */
const MARKER = 'selesai';

function invariant(snap: Snapshot): { ok: boolean; message: string } {
  const allDone = snap.threads.every((t) => t.state === 'TERMINATED');
  if (!allDone || Boolean(snap.deadlock)) {
    return {
      ok: false,
      message: 'Masih ada teknisi yang belum selesai bekerja.',
    };
  }
  const preemptions = snap.preemptions ?? 0;
  const rescued = preemptions > 0;
  return {
    ok: true,
    message: rescued
      ? `Semua teknisi selesai ${LEVEL_2_3_MEALS} kali, tetapi lewat ${preemptions} kali merampas kunci (deteksi dan pemulihan).`
      : `Semua teknisi selesai ${LEVEL_2_3_MEALS} kali tanpa pernah deadlock (pencegahan).`,
  };
}

export const level2_3: LevelDefinition = {
  id: '2-3',
  module: 2,
  title: 'Meja Teknisi',
  intro: [
    {
      text: `Ada ${LEVEL_2_3_TECHNICIANS} teknisi duduk melingkar, dan di antara tiap dua teknisi ada satu kunci inggris. Untuk bekerja, seorang teknisi butuh DUA kunci: kiri dan kanannya.`,
      mood: 'netral',
    },
    {
      text: `Misimu: semua teknisi harus selesai bekerja ${LEVEL_2_3_MEALS} kali. Tekan Run tanpa alat dulu dan perhatikan apa yang terjadi.`,
      mood: 'berpikir',
    },
    {
      text:
        'Kalau semua teknisi mengambil kunci kirinya bersamaan, masing-masing menunggu kunci kanan yang dipegang tetangganya, dan tidak ada yang bisa maju. ' +
        'Kalau mereka macet, kamu punya dua jalan: cegah macet dengan Kartu Akses di sekeliling pekerjaan, ' +
        'atau biarkan macet lalu tekan "Rampas kunci" untuk memaksa satu teknisi melepas kuncinya (pekerjaannya diulang dari awal).',
      mood: 'netral',
    },
  ],
  hints: [
    'Coba jalankan tanpa alat. Siapa memegang apa saat semuanya berhenti?',
    'Semua teknisi mengambil kunci kiri lebih dulu, lalu menunggu kunci kanan yang dipegang tetangganya. Lingkaran saling menunggu ini yang membuat macet.',
    'Kartu Akses bisa membatasi berapa teknisi yang boleh mulai mengambil kunci. Bungkus seluruh pekerjaan dari ambil kunci sampai lepas kunci.',
    'Dengan 5 teknisi dan 5 kunci, batasi menjadi 4 teknisi. Selalu ada satu yang bisa mendapat dua kunci, selesai, lalu melepasnya.',
    'Batas 4 sudah bebas macet, tetapi belum tentu paling cepat. Coba nilai Kartu Akses yang lebih kecil dan bandingkan total tick serta waktu tunggunya untuk mengejar bintang penuh.',
  ],
  concepts: [
    'Deadlock',
    'Kondisi Coffman',
    'Circular wait',
    'Pencegahan deadlock',
    'Deteksi dan pemulihan deadlock',
  ],
  explanation: {
    pass:
      'Macet total (deadlock) terjadi kalau empat hal ini ada bersamaan: kunci hanya boleh dipegang satu orang, ' +
      'orang yang sudah memegang kunci tetap menunggu kunci lain, kunci tidak bisa direbut paksa, ' +
      'dan mereka saling menunggu melingkar (circular wait). ' +
      'Dengan membatasi teknisi jadi 4, lingkaran tunggu putus karena selalu ada satu teknisi yang bisa mendapat dua kunci. ' +
      'Merampas kunci memutus syarat "tidak bisa direbut", tetapi pekerjaan yang sudah berjalan harus diulang.',
    fail: 'Semua teknisi memegang satu kunci dan menunggu kunci tetangganya: itu circular wait, jadi tidak ada yang bisa maju. Ini deadlock. Menunggu lebih lama tidak akan membantu; salah satu syarat deadlock harus diputus, misalnya dengan membatasi jumlah teknisi atau dengan merampas kunci.',
  },
  resultTitle: {
    pass: 'Bagus! Tidak Ada yang Saling Tunggu!',
    fail: 'Waduh, Semua Teknisi Macet!',
  },
  layoutId: '2-3',
  resultMode: 'verdict',
  threads: LEVEL_2_3_THREADS,
  sharedVars: { [MARKER]: 0 },
  resources: [
    ...FORK_RESOURCES,
    {
      kind: 'semaphore',
      id: LEVEL_2_3_SEAT_SEMAPHORE,
      initialValue: LEVEL_2_3_TECHNICIANS,
      label: 'Kartu Akses Meja',
    },
  ],
  availableTools: ['semaphore'],
  scheduler: LEVEL_2_3_SCHEDULER,
  tutorialSeed: LEVEL_2_3_TUTORIAL_SEED,
  maxTicks: 500,
  recovery: 'manual',
  goal: {
    target: { variable: MARKER, value: 0 },
    invariant,
    // Diukur pada seed tutorial 1 (13 Nov 2026), kursi 1..4: tick 106/58/42/64,
    // total tunggu 340/134/69/160. Kursi 3 optimal. Ukur ulang bila skenario berubah.
    stars: { fast: 80, lowWait: 100 },
  },
};
