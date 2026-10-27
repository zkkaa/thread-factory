import { useState } from 'react';
import { ICONS } from '../components/icons/registry';
import { IconButton } from '../components/IconButton';
import { PauseMenu } from '../components/hud/PauseMenu';
import type { SimulationController } from '../../controller/SimulationController';
import { PhaserGame } from '../../PhaserGame';
import { ControlHud } from '../components/hud/ControlHud';
import { MissionChip } from '../components/hud/MissionChip';
import { PlayLayout } from '../components/hud/PlayLayout';
import { MetricsHud } from '../components/hud/MetricsHud';
import { ResultDialog } from '../components/ResultDialog';
import { LogHud } from '../components/hud/LogHud';
import { ToolboxHud } from '../components/hud/ToolboxHud';
import { useSimulation } from '../hooks/useSimulation';

interface PlayScreenProps {
  controller: SimulationController;
  /** Keluar ke Peta Level. Sementara; diganti Menu Jeda pada U-036. */
  onExit: () => void;
  onSettings: () => void;
}

// Gaya panel HUD sementara; tiap komponen HUD final (U-031 sampai U-037)
// menggantikan panel yang bersangkutan.
const PANEL =
  'rounded-lg border border-navy-500 bg-navy-900/90 p-3 shadow-lg overflow-y-auto';

/**
 * Layar Arena (S5): kanvas Phaser memenuhi layar, komponen lama dipasang
 * sementara di slot HUD sampai penggantinya selesai (U-064 menghapus sisanya).
 */
export function PlayScreen({
  controller,
  onExit,
  onSettings,
}: PlayScreenProps) {
  const state = useSimulation(controller);
  const [menu, setMenu] = useState<{ wasRunning: boolean } | null>(null);
  const Menu = ICONS.menu;

  const openMenu = (): void => {
    const wasRunning = state.runState === 'running';
    if (wasRunning) controller.pause();
    setMenu({ wasRunning });
  };
  const closeMenu = (): void => {
    if (menu?.wasRunning) controller.run();
    setMenu(null);
  };

  return (
    <PlayLayout
      canvas={<PhaserGame controller={controller} />}
      topLeft={
        <div className="w-80 space-y-2">
          <div className={`${PANEL} space-y-2`}>
            {state.level !== null && (
              <h1 className="text-base font-bold">
                Level {state.level.id}: {state.level.title}
              </h1>
            )}
          </div>
          {state.level !== null && <MissionChip level={state.level} />}
        </div>
      }
      topRight={
        <div className="flex items-start gap-2">
          <ControlHud controller={controller} state={state} />
          <IconButton label="Menu" icon={<Menu />} onClick={openMenu} />
        </div>
      }
      bottomLeft={<LogHud controller={controller} />}
      bottomCenter={
        <div className="w-[420px]">
          <ToolboxHud controller={controller} state={state} />
        </div>
      }
      bottomRight={<MetricsHud state={state} />}
      overlay={
        <>
          <ResultDialog controller={controller} state={state} />
          {menu !== null && (
            <PauseMenu
              onResume={closeMenu}
              onRestart={() => {
                controller.reset();
                setMenu(null);
              }}
              onMap={onExit}
              onSettings={onSettings}
            />
          )}
        </>
      }
    />
  );
}
