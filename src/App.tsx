import { SimulationController } from './controller/SimulationController';
import { ProgressStore } from './progress/progressStore';
import { SettingsStore } from './progress/settingsStore';
import { createMemoryStorage, getBrowserStorage } from './progress/storage';
import { AppShell } from './ui/AppShell';

// Satu controller dan satu pasang store untuk seluruh aplikasi, dibuat di luar
// komponen supaya tidak terbuat ulang saat React me-render (termasuk
// StrictMode). Level dimuat AppShell saat pemain masuk Arena.
// Bila localStorage tidak bisa dipakai, progres tetap jalan di memori.
const storage = getBrowserStorage() ?? createMemoryStorage();
const controller = new SimulationController();
const progressStore = new ProgressStore(storage);
const settingsStore = new SettingsStore(storage);

function App() {
  return (
    <AppShell
      controller={controller}
      progressStore={progressStore}
      settingsStore={settingsStore}
    />
  );
}

export default App;
