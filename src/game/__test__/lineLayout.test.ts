import { describe, expect, it } from 'vitest';
import { level1_5 } from '../../levels/module1/level-1-5.old';
import { layout1_5Line } from '../layouts/level-1-5.line.layout';
import type { LineLayout } from '../layouts/types';
import { validateLineLayout } from '../layouts/validateLine';

const copy = (): LineLayout => structuredClone(layout1_5Line);
const errorsOf = (layout: LineLayout): string[] =>
  validateLineLayout(layout, level1_5);
const has = (layout: LineLayout, text: string): boolean =>
  errorsOf(layout).some((error) => error.includes(text));

describe.skip('validateLineLayout (Level 1-5)', () => {
  it('layout awal sah', () => {
    expect(errorsOf(layout1_5Line)).toEqual([]);
  });

  it('menolak papan yang menimpa dok toolbox', () => {
    const layout = copy();
    layout.board.y = 400;
    expect(has(layout, 'dok toolbox')).toBe(true);
  });

  it('menolak urutan slot dan checkpoint yang salah', () => {
    const layout = copy();
    layout.slotX[1] = 700;
    expect(has(layout, 'urutan x')).toBe(true);
  });

  it('menolak jarak slot dan checkpoint yang terlalu rapat', () => {
    const layout = copy();
    layout.checkpointX[0] = 490;
    expect(has(layout, 'jarak slot dan checkpoint 0')).toBe(true);
  });

  it('menolak lajur yang hilang', () => {
    const layout = copy();
    layout.lanes.pop();
    expect(has(layout, 'semua thread')).toBe(true);
  });

  it('menolak lajur yang terlalu berdekatan', () => {
    const layout = copy();
    const lane = layout.lanes[1];
    if (lane === undefined) throw new Error('lajur 1 tidak ada');
    lane.y = 150;
    expect(has(layout, 'jarak lajur')).toBe(true);
  });

  it('menolak gerbang aula yang tidak membungkus ENTER_AREA dan LEAVE_AREA', () => {
    const layout = copy();
    layout.hall.gate.start = 3;
    expect(has(layout, 'ENTER_AREA')).toBe(true);
  });

  it('menolak lampu di luar kartu Pengepak', () => {
    const layout = copy();
    layout.packer.lamp = { x: 900, y: 200 };
    expect(has(layout, 'lampu sinyal')).toBe(true);
  });

  it('menolak panel yang bertumpuk dengan jalur robot', () => {
    const layout = copy();
    layout.mutexPanel.y = 250;
    expect(has(layout, 'bertumpuk dengan jalur robot')).toBe(true);
  });
});
