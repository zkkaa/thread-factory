import { SimulationController } from './controller/SimulationController';
import { ProgressStore } from './progress/progressStore';
import { SettingsStore } from './progress/settingsStore';
import { createMemoryStorage, getBrowserStorage } from './progress/storage';
import { AppShell } from './ui/AppShell';
import { createBrowserAudioPlayer } from './ui/audio/audioPlayer';
import { SoundContext } from './ui/audio/soundContext';

// Satu controller dan satu pasang store untuk seluruh aplikasi, dibuat di luar
// komponen supaya tidak terbuat ulang saat React me-render (termasuk
// StrictMode). Level dimuat AppShell saat pemain masuk Arena.
// Bila localStorage tidak bisa dipakai, progres tetap jalan di memori.
const storage = getBrowserStorage() ?? createMemoryStorage();
const controller = new SimulationController();
const progressStore = new ProgressStore(storage);
const settingsStore = new SettingsStore(storage);
const audio = createBrowserAudioPlayer();

function App() {
  return (
    <SoundContext.Provider value={audio}>
      <AppShell
        controller={controller}
        progressStore={progressStore}
        settingsStore={settingsStore}
      />
    </SoundContext.Provider>
  );
}

export default App;
