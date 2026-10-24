import type { Prng } from './prng';
import type { SchedulerConfig, ThreadId } from './types';

/**
 * Si Penjadwal: tiap tick memilih thread mana (maksimal `cores`) yang boleh
 * mengeksekusi satu instruksi. Thread lain "dibekukan" pada tick itu.
 */
export interface Scheduler {
  /**
   * @param runnable id thread yang boleh jalan (READY atau RUNNING), dalam
   *                 urutan definisi thread (urutan stabil demi determinisme).
   * @returns id thread terpilih, tanpa duplikat, panjang <= cores. Selalu
   *          minimal satu bila `runnable` tidak kosong.
   */
  pick(runnable: readonly ThreadId[]): ThreadId[];
}

/** Memilih acak (dari PRNG berbasis seed) di antara thread yang boleh jalan. */
function createRandomScheduler(cores: number, prng: Prng): Scheduler {
  return {
    pick(runnable) {
      const pool = [...runnable];
      const picked: ThreadId[] = [];
      while (picked.length < cores && pool.length > 0) {
        const chosen = prng.pick(pool);
        picked.push(chosen);
        pool.splice(pool.indexOf(chosen), 1);
      }
      return picked;
    },
  };
}

/**
 * Mengikuti urutan `script` (satu entri = satu jatah eksekusi). Dipakai di level
 * tutorial agar race condition PASTI muncul.
 *
 * Aturan:
 * - Entri untuk thread yang tidak bisa jalan (WAITING/TERMINATED) dilewati,
 *   supaya script tidak membuat simulasi macet.
 * - Dengan cores > 1, satu tick mengambil entri berurutan; bila ketemu thread
 *   yang sudah terpilih pada tick itu, tick berakhir dan entri tersebut
 *   dipakai di tick berikutnya.
 * - Setelah script habis, sisa jatah diisi thread yang boleh jalan menurut
 *   urutan definisi, sehingga simulasi tetap bisa selesai.
 */
function createScriptedScheduler(
  cores: number,
  script: readonly ThreadId[],
): Scheduler {
  let cursor = 0;
  return {
    pick(runnable) {
      const runnableSet = new Set(runnable);
      const picked: ThreadId[] = [];

      while (picked.length < cores && cursor < script.length) {
        const id = script[cursor] as ThreadId;
        if (picked.includes(id)) break;
        cursor += 1;
        if (runnableSet.has(id)) picked.push(id);
      }

      // Script habis: isi sisa jatah secara deterministik.
      if (cursor >= script.length) {
        for (const id of runnable) {
          if (picked.length >= cores) break;
          if (!picked.includes(id)) picked.push(id);
        }
      }
      return picked;
    },
  };
}

/**
 * Membuat scheduler sesuai konfigurasi. Panggil ulang tiap load()/reset()
 * karena scheduler menyimpan keadaan (posisi script, PRNG).
 */
export function createScheduler(config: SchedulerConfig, prng: Prng): Scheduler {
  switch (config.kind) {
    case 'random':
      return createRandomScheduler(config.cores, prng);
    case 'scripted':
      return createScriptedScheduler(config.cores, config.script);
  }
}
