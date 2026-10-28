import { useEffect, useRef, useState } from 'react';
import {
  IDLE_PLACEMENT,
  type PlacementDoor,
  type PlacementState,
} from '../../game/doorPlacement';
import { toolBus } from '../../game/toolBus';

/**
 * Mendengarkan fase pemasangan pintu dari arena dan meneruskan pintu yang
 * sudah lengkap ke `onDoor`. Esc membatalkan selama pintu sedang dipegang.
 */
export function useDoorPlacement(
  onDoor: (door: PlacementDoor) => void,
): PlacementState {
  const [phase, setPhase] = useState<PlacementState>(IDLE_PLACEMENT);
  const latest = useRef(onDoor);

  useEffect(() => {
    latest.current = onDoor;
  });

  useEffect(() => {
    const offPhase = toolBus.on('phase', setPhase);
    const offDoor = toolBus.on('doorPlaced', (door) => latest.current(door));
    return () => {
      offPhase();
      offDoor();
    };
  }, []);

  const holding = phase.phase !== 'idle';
  useEffect(() => {
    if (!holding) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') toolBus.emit('cancel', null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [holding]);

  return phase;
}
