import type { LevelDefinition } from '../../levels/types';
import { MandorDialog } from '../components/dialogs/MandorDialog';
import { ICONS } from '../components/icons/registry';
import { IconButton } from '../components/IconButton';
import type { Navigation } from '../navigation';

interface LevelIntroScreenProps {
  navigation: Navigation;
  level: LevelDefinition;
}

/** Intro Level (S4): dialog Pak Mandor, lalu masuk Arena. */
export function LevelIntroScreen({ navigation, level }: LevelIntroScreenProps) {
  const Back = ICONS.back;
  const start = (): void => navigation.go({ id: 'play', levelId: level.id });

  return (
    <main className="relative h-screen bg-navy-900">
      <div className="absolute left-4 top-4">
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
