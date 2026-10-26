import type { ModeTab, Screen } from './screenState';

/** Yang diterima setiap layar dari AppShell untuk berpindah layar. */
export interface Navigation {
  screen: Screen;
  /** Apakah transisi ke target sah dan terbuka (untuk menonaktifkan tombol)? */
  canGo: (target: Screen) => boolean;
  /** Pindah dan menumpuk riwayat (atau memotongnya bila target sudah ada). */
  go: (target: Screen) => void;
  /** Mengganti layar tanpa menambah riwayat. */
  replace: (target: Screen) => void;
  back: () => void;
  selectModeTab: (tab: ModeTab) => void;
}
