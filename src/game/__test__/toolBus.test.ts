import { describe, expect, it } from 'vitest';
import { ToolBus } from '../toolBus';

describe('ToolBus', () => {
  it('meneruskan payload ke pelanggan', () => {
    const bus = new ToolBus();
    const got: number[] = [];
    bus.on('dragMove', (point) => got.push(point.clientX));
    bus.emit('dragMove', { clientX: 7, clientY: 0 });
    expect(got).toEqual([7]);
  });

  it('fungsi berhenti mencabut pelanggan', () => {
    const bus = new ToolBus();
    let count = 0;
    const off = bus.on('cancel', () => (count += 1));
    bus.emit('cancel', null);
    off();
    bus.emit('cancel', null);
    expect(count).toBe(1);
  });

  it('berhenti berlangganan saat emit tidak merusak pemrosesan', () => {
    const bus = new ToolBus();
    let calls = 0;
    const off = bus.on('cancel', () => {
      calls += 1;
      off();
    });
    bus.on('cancel', () => (calls += 1));
    bus.emit('cancel', null);
    expect(calls).toBe(2);
  });
});
