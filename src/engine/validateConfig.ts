import type { EngineConfig } from './types';

function isPositiveInt(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function hasKey(record: Record<string, number>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/**
 * Memeriksa EngineConfig dan melempar Error berpesan jelas bila ada yang salah.
 * Tujuannya: kesalahan data level muncul saat load(), bukan sebagai perilaku
 * aneh di tengah simulasi.
 */
export function validateConfig(config: EngineConfig): void {
  if (config.threads.length === 0) {
    throw new Error('Konfigurasi harus punya minimal satu thread');
  }
  if (!isPositiveInt(config.maxTicks)) {
    throw new Error(
      `maxTicks harus bilangan bulat >= 1, diterima: ${config.maxTicks}`,
    );
  }

  const mutexNames = new Set<string>();
  for (const name of config.mutexes) {
    if (mutexNames.has(name)) {
      throw new Error(`Nama mutex ganda: "${name}"`);
    }
    mutexNames.add(name);
  }

  // Area yang dipakai ENTER_AREA/LEAVE_AREA harus punya kapasitas yang jelas.
  const areas = config.areas ?? {};
  for (const [name, capacity] of Object.entries(areas)) {
    if (!isPositiveInt(capacity)) {
      throw new Error(
        `Kapasitas area "${name}" harus bilangan bulat >= 1, diterima: ${capacity}`,
      );
    }
  }

  const ids = new Set<string>();
  for (const thread of config.threads) {
    if (ids.has(thread.id)) {
      throw new Error(`Id thread ganda: "${thread.id}"`);
    }
    ids.add(thread.id);

    if (thread.program.length === 0) {
      throw new Error(`Thread "${thread.id}" tidak punya instruksi`);
    }
    if (thread.repeat !== undefined && !isPositiveInt(thread.repeat)) {
      throw new Error(
        `repeat thread "${thread.id}" harus bilangan bulat >= 1, diterima: ${thread.repeat}`,
      );
    }

    for (const instruction of thread.program) {
      if (instruction.op === 'WORK' && !isPositiveInt(instruction.ticks)) {
        throw new Error(
          `WORK pada thread "${thread.id}": ticks harus bilangan bulat >= 1, diterima: ${instruction.ticks}`,
        );
      }
      if (instruction.op === 'COMPUTE' && !Number.isFinite(instruction.add)) {
        throw new Error(
          `COMPUTE pada thread "${thread.id}": add harus bilangan hingga`,
        );
      }
      if (
        instruction.op === 'READ' &&
        !hasKey(config.sharedVars, instruction.from)
      ) {
        throw new Error(
          `READ pada thread "${thread.id}": variabel bersama "${instruction.from}" tidak ada`,
        );
      }
      if (
        instruction.op === 'WRITE' &&
        !hasKey(config.sharedVars, instruction.to)
      ) {
        throw new Error(
          `WRITE pada thread "${thread.id}": variabel bersama "${instruction.to}" tidak ada`,
        );
      }
      if (
        (instruction.op === 'LOCK' || instruction.op === 'UNLOCK') &&
        !mutexNames.has(instruction.mutex)
      ) {
        throw new Error(
          `${instruction.op} pada thread "${thread.id}": mutex "${instruction.mutex}" tidak dideklarasikan`,
        );
      }
      if (
        (instruction.op === 'SEM_WAIT' || instruction.op === 'SEM_SIGNAL') &&
        !hasKey(config.semaphores, instruction.sem)
      ) {
        throw new Error(
          `${instruction.op} pada thread "${thread.id}": semaphore "${instruction.sem}" tidak dideklarasikan`,
        );
      }
      if (
        (instruction.op === 'ENTER_AREA' || instruction.op === 'LEAVE_AREA') &&
        !hasKey(areas, instruction.area)
      ) {
        throw new Error(
          `${instruction.op} pada thread "${thread.id}": area "${instruction.area}" tidak dideklarasikan`,
        );
      }
    }

    // Thread yang menunggu LOCK atau SEM_WAIT dilanjutkan oleh thread lain
    // (handoff: thread itu dibangunkan lalu pc-nya dimajukan). Bila instruksi
    // pemblokir itu juga instruksi terakhir, pemajuan pc memaksa transisi
    // READY -> TERMINATED yang tidak sah, jadi program seperti itu ditolak.
    const last = thread.program[thread.program.length - 1];
    if (last !== undefined && (last.op === 'LOCK' || last.op === 'SEM_WAIT')) {
      throw new Error(
        `Thread "${thread.id}": instruksi terakhir tidak boleh ${last.op}`,
      );
    }
  }

  if (!isPositiveInt(config.scheduler.cores)) {
    throw new Error(
      `cores harus bilangan bulat >= 1, diterima: ${config.scheduler.cores}`,
    );
  }
  if (config.scheduler.kind === 'scripted') {
    for (const id of config.scheduler.script) {
      if (!ids.has(id)) {
        throw new Error(
          `Script scheduler menyebut thread "${id}" yang tidak ada`,
        );
      }
    }
  }
}
