import type { SchedulerConfig, Snapshot, ThreadDef } from '../engine/types';

/** Jenis alat sinkronisasi yang dapat disediakan atau ditaruh pemain. */
export type ToolType = 'mutex' | 'semaphore' | 'condition';

/**
 * Definisi resource yang ada di level.
 * Digunakan untuk visualisasi awal dan inisialisasi controller/engine.
 */
export type ResourceDef =
  | { kind: 'mutex'; id: string; label?: string }
  | { kind: 'semaphore'; id: string; initialValue: number; label?: string }
  | { kind: 'condition'; id: string; mutex: string; label?: string };

/**
 * Format definisi level (kontrak data level).
 * Mengacu pada docs/ARCHITECTURE.md bagian 9.
 */
export interface LevelDefinition {
  /** Identifier unik level, mis. '1-1'. */
  id: string;
  /** Nomor modul, mis. 1 (Sinkronisasi Dasar) atau 2 (Masalah Klasik). */
  module: 1 | 2;
  /** Judul level, mis. 'Bug Papan Stok'. */
  title: string;
  /** Penjelasan situasi/tutorial oleh Pak Mandor. */
  intro: string;
  /**
   * Penjelasan konsep yang ditampilkan di dialog hasil (opsional).
   * `pass` dipakai bila level lulus, `fail` bila gagal. Isinya harus benar secara
   * konsep sisop (lihat CLAUDE.md bagian 7).
   */
  explanation?: { pass: string; fail: string };
  /** Konfigurasi thread (robot) awal sebelum dipasangi alat pemain. */
  threads: ThreadDef[];
  /** Nilai awal variabel bersama, mis. { stok: 0 }. */
  sharedVars: Record<string, number>;
  /** Resource sinkronisasi yang ada di level (pintu mutex, token semaphore, dst.). */
  resources: ResourceDef[];
  /** Jenis alat yang dapat ditaruh oleh pemain di toolbox level ini. */
  availableTools: ToolType[];
  /** Pengaturan scheduler (acak ber-seed atau scripted). */
  scheduler: SchedulerConfig;
  /** Seed default tutorial yang pasti menghasilkan perilaku tertentu (mis. race condition). */
  tutorialSeed?: number;
  /** Batas pengaman tick eksekusi simulasi sebelum timeout (default 2000 jika tidak diset). */
  maxTicks?: number;
  /** Kriteria keberhasilan dan penilaian bintang. */
  goal: {
    /** Target variabel bersama yang diharapkan, mis. { variable: 'stok', value: 10 }. */
    target: { variable: string; value: number };
    /** Pengecekan invarian dari snapshot akhir untuk menentukan status lulus/gagal. */
    invariant: (snap: Snapshot) => { ok: boolean; message: string };
    /** Ambang batas performa untuk bintang ★★ dan ★★★. */
    stars: {
      /** Batas maksimum tick untuk mendapatkan bintang kecepatan (★★). */
      fast: number;
      /** Batas maksimum total waitTicks untuk mendapatkan bintang efisiensi (★★★). */
      lowWait: number;
    };
  };
}
