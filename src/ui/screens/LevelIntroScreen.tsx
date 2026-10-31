import type { LevelDefinition } from '../../levels/types';
import { MandorDialog } from '../components/dialogs/MandorDialog';
import { ICONS } from '../components/icons/registry';
import { IconButton } from '../components/IconButton';
import { introBackgroundFor } from '../introBackgrounds';
import type { Navigation } from '../navigation';

interface LevelIntroScreenProps {
  navigation: Navigation;
  level: LevelDefinition;
}

/** Intro Level (S4): dialog Pak Mandor di atas latar arena, lalu masuk Arena. */
export function LevelIntroScreen({ navigation, level }: LevelIntroScreenProps) {
  const Back = ICONS.back;
  const start = (): void => navigation.go({ id: 'play', levelId: level.id });
  const background = introBackgroundFor(level.id);

  return (
    <main className="relative h-screen overflow-hidden bg-navy-900">
      {background !== null && (
        <>
          {/* Latar diburamkan dan digelapkan agar dialog tetap terbaca.
              scale-105 menutup tepi pudar akibat blur. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 scale-105 bg-cover bg-center blur-sm"
            style={{ backgroundImage: `url(${background})` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-navy-900/45"
          />
        </>
      )}

      {/* z-20 supaya tidak tertutup potret besar. */}
      <div className="absolute left-4 top-4 z-20">
        <IconButton label="Kembali" icon={<Back />} onClick={navigation.back} />
      </div>
      <MandorDialog
        pages={level.intro}
        title={`Level ${level.id}: ${level.title}`}
        onFinish={start}
        onSkip={start}
      />
    </main>
  );
}