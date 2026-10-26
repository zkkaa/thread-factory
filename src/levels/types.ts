import type { SchedulerConfig, Snapshot, ThreadDef } from '../engine/types';

/** Jenis alat sinkronisasi yang dapat disediakan atau ditaruh pemain. */
export type ToolType = 'mutex' | 'semaphore' | 'condition';

/** Ekspresi potret Pak Mandor (PRD bagian 18.3). */
export type MandorMood = 'netral' | 'senang' | 'sedih' | 'berpikir';

/** Satu halaman dialog Pak Mandor di layar Intro Level (PRD bagian 16, S4). */
export interface IntroPage {
  /** Isi gelembung dialog. */
  text: string;
  /** Ekspresi potret; bila kosong, tampilan memakai 'netral'. */
  mood?: MandorMood;
}

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
  /**
   * Dialog pembuka oleh Pak Mandor, 2 sampai 3 halaman: situasi, misi beserta
   * kriteria bintang, dan cara memakai alat (PRD bagian 9).
   */
  intro: IntroPage[];
  /**
   * Petunjuk bertahap untuk tombol "Tanya Pak Mandor", urut dari samar sampai
   * hampir jelas. Minimal 3 tingkat.
   */
  hints: string[];
  /** Konsep yang dipelajari di level ini (dipakai layar Tamat Modul dan Tamat Game). */
  concepts: string[];
  /**
   * Penjelasan konsep yang ditampilkan di dialog hasil (opsional di tipe, tetapi
   * wajib terisi pada level asli; dijaga oleh tes data level).
   * `pass` dipakai bila level lulus, `fail` bila gagal. Isinya harus benar secara
   * konsep sisop (lihat CLAUDE.md bagian 7).
   */
  explanation?: { pass: string; fail: string };
  /**
   * Kunci tata letak arena di game/layouts/. Koordinat tidak disimpan di data
   * level (CLAUDE.md bagian 4 aturan 9).
   */
  layoutId: string;
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

/** Satu modul pembelajaran: kumpulan level berurutan (data di levels/modules.ts). */
export interface ModuleDefinition {
  /** Nomor modul. */
  id: 1 | 2;
  /** Judul pendek, mis. 'Modul 1'. */
  title: string;
  /** Subjudul, mis. 'Sinkronisasi Dasar'. */
  subtitle: string;
  /** Deskripsi singkat untuk kartu modul dan kartu pembuka. */
  description: string;
  /** Konsep yang dipelajari di seluruh modul. */
  concepts: string[];
  /** Id level dalam urutan main. */
  levelIds: string[];
}
