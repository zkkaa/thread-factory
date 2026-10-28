import { useEffect, useRef, useState } from 'react';
import type { SimulationController } from '../../controller/SimulationController';
import { PhaserGame } from '../../PhaserGame';
import { toolBus } from '../../game/toolBus';
import { HintDialog } from '../components/dialogs/HintDialog';
import { ResultDialog } from '../components/dialogs/ResultDialog';
import { ControlHud } from '../components/hud/ControlHud';
import { LogHud } from '../components/hud/LogHud';
import { MetricsHud } from '../components/hud/MetricsHud';
import { MissionChip } from '../components/hud/MissionChip';
import { PauseMenu } from '../components/hud/PauseMenu';
import { PlayLayout } from '../components/hud/PlayLayout';
import { ToolboxHud } from '../components/hud/ToolboxHud';
import { ICONS } from '../components/icons/registry';
import { IconButton } from '../components/IconButton';
import { useSimulation } from '../hooks/useSimulation';
import {
  INITIAL_HINT_STATE,
  type HintState,
  hasMoreHints,
  recordFailure,
  revealNext,
  shouldOfferHint,
  visibleHints,
} from '../hints';

interface PlayScreenProps {
  controller: SimulationController;
  /** Keluar ke Peta Level (dari Menu Jeda). */
  onExit: () => void;
  onSettings: () => void;
  /** Pindah ke level berikutnya; dipanggil dari popup hasil. */
  onNext?: () => void;
  reduceMotion?: boolean;
}

type Overlay = { kind: 'menu' | 'hint'; wasRunning: boolean };

// Gaya panel judul level (kiri atas); komponen HUD lain membawa gayanya sendiri.
const PANEL =
  'rounded-lg border border-navy-500 bg-navy-900/90 p-3 shadow-lg overflow-y-auto';

/**
 * Layar Arena (S5): kanvas Phaser memenuhi layar, HUD React ditumpuk di atasnya.
 */
export function PlayScreen({
  controller,
  onExit,
  onSettings,
  onNext,
  reduceMotion = false,
}: PlayScreenProps) {
  const state = useSimulation(controller);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [hintState, setHintState] = useState<HintState>(INITIAL_HINT_STATE);
  const countedResult = useRef<unknown>(null);
  const Menu = ICONS.menu;
  const Help = ICONS.help;
  const hints = state.level?.hints ?? [];

  // Hitung tiap hasil gagal satu kali (per objek result).
  useEffect(() => {
    const result = state.result;
    if (result === null || result === countedResult.current) return;
    countedResult.current = result;
    if (!result.ok) setHintState(recordFailure);
  }, [state.result]);

  const open = (kind: Overlay['kind']): void => {
    const wasRunning = state.runState === 'running';
    if (wasRunning) controller.pause();
    if (kind === 'hint') {
      setHintState((s) => (s.revealed === 0 ? revealNext(s, hints.length) : s));
    }
    setOverlay({ kind, wasRunning });
  };
  const close = (): void => {
    if (overlay?.wasRunning) controller.run();
    setOverlay(null);
  };

  return (
    <PlayLayout
      canvas={
        <PhaserGame controller={controller} reduceMotion={reduceMotion} />
      }
      onDragOver={(event) => {
        event.preventDefault();
        toolBus.emit('dragMove', {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }}
      onDrop={(event) => {
        event.preventDefault();
        toolBus.emit('drop', {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }}
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
          <IconButton
            label="Tanya Pak Mandor"
            icon={<Help />}
            onClick={() => open('hint')}
          />
          <IconButton
            label="Menu"
            icon={<Menu />}
            onClick={() => open('menu')}
          />
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
          <ResultDialog
            controller={controller}
            state={state}
            reduceMotion={reduceMotion}
            offerHint={shouldOfferHint(hintState)}
            onHint={() => open('hint')}
            onNext={onNext}
          />
          {overlay?.kind === 'menu' && (
            <PauseMenu
              onResume={close}
              onRestart={() => {
                controller.reset();
                setOverlay(null);
              }}
              onMap={onExit}
              onSettings={onSettings}
            />
          )}
          {overlay?.kind === 'hint' && (
            <HintDialog
              hints={visibleHints(hints, hintState)}
              hasMore={hasMoreHints(hints, hintState)}
              onMore={() => setHintState((s) => revealNext(s, hints.length))}
              onClose={close}
            />
          )}
        </>
      }
    />
  );
}
