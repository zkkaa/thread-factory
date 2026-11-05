import { useEffect, useRef } from 'react';
import type { PlacementDoor } from '../../game/doorPlacement';
import { toolBus } from '../../game/toolBus';

/**
 * Mendengarkan Kartu Akses yang dilepas di pintu aula pada arena dan meneruskan
 * rentang gerbangnya ke `onGate`. Terpisah dari useDoorPlacement (mutex) supaya
 * dua jenis alat di satu level tidak saling menerima event.
 */
export function useGatePlacement(onGate: (gate: PlacementDoor) => void): void {
  const latest = useRef(onGate);

  useEffect(() => {
    latest.current = onGate;
  });

  useEffect(() => toolBus.on('gatePlaced', (gate) => latest.current(gate)), []);
}