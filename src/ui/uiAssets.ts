/** Jalur gambar lapisan UI (relatif terhadap halaman; berkasnya di public/assets/ui). */
export const UI_ASSETS = {
  logo: 'assets/ui/logo-thread-factory.png',
  homeBackground: 'assets/ui/bg-beranda.jpg',
  /** Peta denah pabrik untuk layar Pilih Modul (S2), dengan dua lahan kosong. */
  mapModules: 'assets/ui/map-modules.jpg',
  /** Bangunan tiap modul, PNG transparan. */
  buildingModule1: 'assets/ui/building-module-1.png',
  buildingModule2: 'assets/ui/building-module-2.png',
  /** Peta Level (S3b): satu peta per modul, dengan lahan bundar kosong untuk tiap level. */
  mapLevelsModule1: 'assets/ui/map-levels-1.jpg',
  mapLevelsModule2: 'assets/ui/map-levels-2.jpg',
  /** Pedestal penanda level di Peta Level, PNG transparan. */
  pedestal: 'assets/ui/pedestal.png',
  /** Robot kecil pemandu di Peta Level, PNG transparan. */
  robotGuide: 'assets/ui/robot-guide.png',
  /** Papan catatan (Pengaturan, Panduan): latar, papan klip kosong, Pak Mandor mengintip. */
  catatanBackground: 'assets/ui/catatan/bg-catatan.jpg',
  catatanBoard: 'assets/ui/catatan/papan-klip.png',
  mandorIntip: 'assets/ui/catatan/mandor-intip.png',
  catatanKuning: 'assets/ui/catatan/catatan-kuning.png',
} as const;
