import type { ReactNode } from 'react';
import { findLevelById } from '../../levels';
import type { ModuleDefinition } from '../../levels/types';
import type { SettingsData } from '../../progress/settingsStore';
import type { Navigation } from '../navigation';

interface PlaceholderScreenProps {
  navigation: Navigation;
  modules: readonly ModuleDefinition[];
  settings: Readonly<SettingsData>;
  onToggleDemo: () => void;
  onResetProgress: () => void;
}

interface ActionButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ children, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded bg-yellow-500 px-4 py-2 font-semibold text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * Layar sementara agar seluruh alur (Beranda sampai Arena) sudah bisa
 * dijalankan sebelum layar aslinya dibuat. Dihapus bertahap pada U-016 s.d. U-022.
 */
export function PlaceholderScreen({
  navigation,
  modules,
  settings,
  onToggleDemo,
  onResetProgress,
}: PlaceholderScreenProps) {
  const { screen, canGo, go, replace, back } = navigation;

  const body = (): ReactNode => {
    switch (screen.id) {
      case 'home':
        return (
          <>
            <ActionButton onClick={() => go({ id: 'mode', tab: 'campaign' })}>
              Mulai Game
            </ActionButton>
            <ActionButton onClick={() => go({ id: 'guide' })}>
              Panduan
            </ActionButton>
            <ActionButton onClick={() => go({ id: 'settings' })}>
              Pengaturan
            </ActionButton>
          </>
        );
      case 'mode':
        return (
          <>
            {modules.map((moduleDef) => {
              const target = {
                id: 'moduleIntro',
                moduleId: moduleDef.id,
              } as const;
              return (
                <ActionButton
                  key={moduleDef.id}
                  disabled={!canGo(target)}
                  onClick={() => go(target)}
                >
                  {moduleDef.title}: {moduleDef.subtitle}
                </ActionButton>
              );
            })}
            <ActionButton
              disabled={!canGo({ id: 'sandbox', levelId: '1-1' })}
              onClick={() => go({ id: 'sandbox', levelId: '1-1' })}
            >
              Sandbox 1-1
            </ActionButton>
            <ActionButton
              disabled={!canGo({ id: 'compare', levelId: '1-1' })}
              onClick={() => go({ id: 'compare', levelId: '1-1' })}
            >
              Bandingkan 1-1
            </ActionButton>
          </>
        );
      case 'moduleIntro':
        return (
          <ActionButton
            onClick={() =>
              replace({ id: 'levelMap', moduleId: screen.moduleId })
            }
          >
            Lanjut ke Peta Level
          </ActionButton>
        );
      case 'levelMap': {
        const moduleDef = modules.find((item) => item.id === screen.moduleId);
        return (
          <>
            {(moduleDef?.levelIds ?? []).map((levelId) => {
              const target = { id: 'levelIntro', levelId } as const;
              const exists = findLevelById(levelId) !== undefined;
              return (
                <ActionButton
                  key={levelId}
                  disabled={!exists || !canGo(target)}
                  onClick={() => go(target)}
                >
                  Level {levelId}
                  {exists ? '' : ' (belum dibuat)'}
                </ActionButton>
              );
            })}
          </>
        );
      }
      case 'levelIntro': {
        const level = findLevelById(screen.levelId);
        return (
          <>
            <p className="max-w-xl rounded bg-gray-800 p-3 text-sm leading-relaxed">
              {level?.intro.map((page) => page.text).join(' ')}
            </p>
            <ActionButton
              onClick={() => replace({ id: 'play', levelId: screen.levelId })}
            >
              Mulai
            </ActionButton>
          </>
        );
      }
      case 'settings':
        return (
          <>
            <ActionButton onClick={onToggleDemo}>
              Mode demo: {settings.demoMode ? 'AKTIF' : 'mati'} (klik untuk
              mengubah)
            </ActionButton>
            <ActionButton
              onClick={() => {
                if (window.confirm('Hapus seluruh progres?')) onResetProgress();
              }}
            >
              Reset progres
            </ActionButton>
          </>
        );
      default:
        return null;
    }
  };

  const showBack = screen.id !== 'home';

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-900 p-8 text-gray-100">
      <h1 className="text-2xl font-bold">Layar: {screen.id}</h1>
      <p className="text-sm text-gray-400">
        Layar sementara (akan diganti layar asli).
      </p>
      {body()}
      {showBack && <ActionButton onClick={back}>Kembali</ActionButton>}
    </main>
  );
}
