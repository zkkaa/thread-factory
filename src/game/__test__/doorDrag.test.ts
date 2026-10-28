import { describe, expect, it } from 'vitest';
import { DoorDragSession } from '../doorDrag';
import type { PlacementDoor, PlacementState } from '../doorPlacement';
import { ToolBus } from '../toolBus';
import type { SlotMarkerState } from '../views/SlotMarkerView';

const positions = [0, 100, 200, 300, 400].map((x) => ({ x, y: 0 }));
const at = (x: number) => ({ clientX: x, clientY: 0 });
const last = <T>(list: readonly T[]): T | undefined => list[list.length - 1];

function setup() {
  const bus = new ToolBus();
  const markers: SlotMarkerState[] = [];
  const phases: PlacementState[] = [];
  const doors: PlacementDoor[] = [];
  bus.on('phase', (phase) => phases.push(phase));
  bus.on('doorPlaced', (door) => doors.push(door));
  const session = new DoorDragSession({
    bus,
    positions,
    toGame: ({ clientX, clientY }) => ({ x: clientX, y: clientY }),
    setMarkers: (state) => markers.push(state),
  });
  return { bus, markers, phases, doors, session };
}

const start = { kind: 'mutex' } as const;

describe('DoorDragSession', () => {
  it('saat diam: penanda tanpa slot sah', () => {
    const { markers } = setup();
    expect(last(markers)).toEqual({ valid: null, hover: null });
  });

  it('dragStart menyorot slot sah untuk pintu masuk', () => {
    const { bus, markers, phases } = setup();
    bus.emit('dragStart', start);
    expect([...(last(markers)?.valid ?? [])]).toEqual([0, 1, 2, 3]);
    expect(last(phases)).toEqual({ phase: 'holdingEntry' });
  });

  it('dragMove menyorot slot sah terdekat, null bila jauh', () => {
    const { bus, markers } = setup();
    bus.emit('dragStart', start);
    bus.emit('dragMove', at(110));
    expect(last(markers)?.hover).toBe(1);
    bus.emit('dragMove', at(1000));
    expect(last(markers)?.hover).toBeNull();
  });

  it('lepas masuk lalu keluar: pintu lengkap dan kembali idle', () => {
    const { bus, markers, phases, doors } = setup();
    bus.emit('dragStart', start);
    bus.emit('drop', at(100));
    expect(last(phases)).toEqual({ phase: 'holdingExit', entry: 1 });
    expect([...(last(markers)?.valid ?? [])]).toEqual([2, 3, 4]);
    bus.emit('dragEnd', null);
    bus.emit('dragStart', start);
    bus.emit('drop', at(400));
    expect(doors).toEqual([{ entry: 1, exit: 4 }]);
    expect(last(phases)).toEqual({ phase: 'idle' });
    expect(last(markers)?.valid).toBeNull();
  });

  it('lepas di luar jangkauan: tidak terpasang; dragEnd membatalkan', () => {
    const { bus, phases, doors } = setup();
    bus.emit('dragStart', start);
    bus.emit('drop', at(1000));
    expect(doors).toEqual([]);
    expect(last(phases)).toEqual({ phase: 'holdingEntry' });
    bus.emit('dragEnd', null);
    expect(last(phases)).toEqual({ phase: 'idle' });
  });

  it('cancel (Esc) membatalkan pintu masuk yang sudah dilepas', () => {
    const { bus, phases } = setup();
    bus.emit('dragStart', start);
    bus.emit('drop', at(200));
    bus.emit('cancel', null);
    expect(last(phases)).toEqual({ phase: 'idle' });
  });

  it('saat idle, dragMove dan drop diabaikan', () => {
    const { bus, markers, doors } = setup();
    const before = markers.length;
    bus.emit('dragMove', at(100));
    bus.emit('drop', at(100));
    expect(markers).toHaveLength(before);
    expect(doors).toEqual([]);
  });

  it('dispose berhenti mendengarkan dan melepas fase yang tertahan', () => {
    const { bus, phases, session } = setup();
    bus.emit('dragStart', start);
    session.dispose();
    expect(last(phases)).toEqual({ phase: 'idle' });
    const count = phases.length;
    bus.emit('dragStart', start);
    expect(phases).toHaveLength(count);
  });
});
