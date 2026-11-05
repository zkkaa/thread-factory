import { describe, expect, it } from 'vitest';
import { deriveBatteryLook } from '../batteryMeter';
import { BATTERY_STYLE } from '../theme';

describe('deriveBatteryLook', () => {
  it('penuh: 100%, pita hijau, label persen', () => {
    expect(deriveBatteryLook(1)).toEqual({
      fraction: 1,
      percent: 100,
      band: 'full',
      color: BATTERY_STYLE.fullColor,
      label: '100%',
    });
  });

  it('menipis: pita kuning di antara dua ambang', () => {
    const look = deriveBatteryLook(0.35);
    expect(look.band).toBe('low');
    expect(look.color).toBe(BATTERY_STYLE.lowColor);
    expect(look.label).toBe('35%');
  });

  it('kritis: pita merah tetapi belum habis', () => {
    const look = deriveBatteryLook(0.1);
    expect(look.band).toBe('empty');
    expect(look.color).toBe(BATTERY_STYLE.emptyColor);
    expect(look.label).toBe('10%');
  });

  it('habis: label HABIS, bukan hanya warna merah', () => {
    const look = deriveBatteryLook(0);
    expect(look.band).toBe('empty');
    expect(look.label).toBe('HABIS');
  });

  it('ambang tepat: 50% masih menipis, 20% sudah kritis', () => {
    expect(deriveBatteryLook(BATTERY_STYLE.fullAbove).band).toBe('low');
    expect(deriveBatteryLook(BATTERY_STYLE.lowAbove).band).toBe('empty');
  });

  it('nilai di luar 0..1 dan NaN dibatasi', () => {
    expect(deriveBatteryLook(1.7).fraction).toBe(1);
    expect(deriveBatteryLook(-0.4).fraction).toBe(0);
    expect(deriveBatteryLook(Number.NaN).label).toBe('HABIS');
  });

  it('persen dibulatkan: nilai kecil yang membulat ke 0 dianggap habis', () => {
    expect(deriveBatteryLook(0.004).label).toBe('HABIS');
    expect(deriveBatteryLook(0.006).label).toBe('1%');
  });
});
