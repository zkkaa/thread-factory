import { describe, expect, it } from 'vitest';
import type { PlacementDoor } from '../doorPlacement';
import { GateDragSession, isNearDoor, type GateDropState } from '../gateDrag';
import { ToolBus, type ClientPoint } from '../toolBus';

const door = { x: 100, y: 100 };
const at = (x: number, y: number): ClientPoint => ({ clientX: x, clientY: y });
const identity = ({ clientX, clientY }: ClientPoint) => ({
  x: clientX,
  y: clientY,
});

function setup(toGame = identity) {
  const bus = new ToolBus();
  const log: string[] = [];
  const placed: PlacementDoor[] = [];
  bus.on('gatePlaced', (gate) => {
    placed.push(gate);
    log.push('placed');
  });
  const session = new GateDragSession({
    bus,
    door,
    hitRadius: 50,
    gate: { start: 1, end: 3 },
    toGame,
    setState: (state: GateDropState) => log.push(`state:${state}`),
  });
  return { bus, log, placed, session };
}

describe('isNearDoor', () => {
  it('menghitung jarak ke pintu, batas ikut dihitung, NaN tidak dekat', () => {
    expect(isNearDoor({ x: 110, y: 100 }, door, 50)).toBe(true);
    expect(isNearDoor({ x: 150, y: 100 }, door, 50)).toBe(true);
    expect(isNearDoor({ x: 151, y: 100 }, door, 50)).toBe(false);
    expect(isNearDoor({ x: Number.NaN, y: Number.NaN }, door, 50)).toBe(false);
  });
});

describe('GateDragSession (T-042)', () => {
  it('saat diam tidak ada perubahan', () => {
    const { log } = setup();
    expect(log).toEqual([]);
  });

  it('dragStart semaphore menyorot pintu; dragStart mutex diabaikan', () => {
    const { bus, log } = setup();
    bus.emit('dragStart', { kind: 'mutex' });
    expect(log).toEqual([]);
    bus.emit('dragStart', { kind: 'semaphore' });
    expect(log).toEqual(['state:ready']);
  });

  it('dragMove: over di dekat pintu, kembali ready bila menjauh', () => {
    const { bus, log } = setup();
    bus.emit('dragStart', { kind: 'semaphore' });
    bus.emit('dragMove', at(110, 100));
    bus.emit('dragMove', at(500, 500));
    expect(log).toEqual(['state:ready', 'state:over', 'state:ready']);
  });

  it('lepas di pintu: sorotan mati dulu, lalu gerbang masuk slot 1 dan keluar slot 4', () => {
    const { bus, log, placed } = setup();
    bus.emit('dragStart', { kind: 'semaphore' });
    bus.emit('dragMove', at(110, 100));
    bus.emit('drop', at(110, 100));
    bus.emit('dragEnd', null);
    expect(placed).toEqual([{ entry: 1, exit: 4 }]);
    expect(log).toEqual([
      'state:ready',
      'state:over',
      'state:off',
      'placed',
    ]);
  });

  it('lepas jauh dari pintu: tidak terpasang dan sorotan mati', () => {
    const { bus, log, placed } = setup();
    bus.emit('dragStart', { kind: 'semaphore' });
    bus.emit('drop', at(500, 500));
    expect(placed).toEqual([]);
    expect(log).toEqual(['state:ready', 'state:off']);
  });

  it('dragEnd atau cancel tanpa drop mematikan sorotan', () => {
    const first = setup();
    first.bus.emit('dragStart', { kind: 'semaphore' });
    first.bus.emit('dragEnd', null);
    expect(first.log).toEqual(['state:ready', 'state:off']);

    const second = setup();
    second.bus.emit('dragStart', { kind: 'semaphore' });
    second.bus.emit('cancel', null);
    expect(second.log).toEqual(['state:ready', 'state:off']);
  });

  it('saat idle, dragMove dan drop diabaikan', () => {
    const { bus, log, placed } = setup();
    bus.emit('dragMove', at(100, 100));
    bus.emit('drop', at(100, 100));
    expect(log).toEqual([]);
    expect(placed).toEqual([]);
  });

  it('kanvas berukuran nol (koordinat NaN) tidak pernah mengenai pintu', () => {
    const { bus, placed } = setup(() => ({ x: Number.NaN, y: Number.NaN }));
    bus.emit('dragStart', { kind: 'semaphore' });
    bus.emit('drop', at(100, 100));
    expect(placed).toEqual([]);
  });

  it('dispose berhenti mendengarkan', () => {
    const { bus, log, session } = setup();
    session.dispose();
    bus.emit('dragStart', { kind: 'semaphore' });
    expect(log).toEqual([]);
  });

  it('dispose di dalam penanganan gatePlaced tidak menyentuh view lagi', () => {
    const { bus, log, session } = setup();
    // Meniru arena dibangun ulang (dibuang) begitu alat terpasang.
    bus.on('gatePlaced', () => session.dispose());
    bus.emit('dragStart', { kind: 'semaphore' });
    bus.emit('drop', at(100, 100));
    bus.emit('dragEnd', null);
    expect(log).toEqual(['state:ready', 'state:off', 'placed']);
  });
});