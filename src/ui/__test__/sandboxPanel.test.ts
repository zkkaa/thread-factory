import { describe, expect, it } from 'vitest';
import { level1_1 } from '../../levels/module1/level-1-1';
import { level2_1 } from '../../levels/module2/level-2-1';
import { level2_2 } from '../../levels/module2/level-2-2';
import { defaultSandboxValues } from '../../levels/sandbox';
import {
  changeValue,
  clampToDef,
  planSandbox,
  stepValue,
} from '../sandboxPanel';

describe('stepValue dan changeValue', () => {
  it('menambah dan mengurangi satu langkah', () => {
    const awal = defaultSandboxValues('2-1');
    expect(stepValue('2-1', awal, 'bufferCapacity', 1).bufferCapacity).toBe(4);
    expect(stepValue('2-1', awal, 'bufferCapacity', -1).bufferCapacity).toBe(2);
  });

  it('dibatasi pada min dan max', () => {
    const atas = { ...defaultSandboxValues('2-1'), bufferCapacity: 8 };
    expect(stepValue('2-1', atas, 'bufferCapacity', 1).bufferCapacity).toBe(8);
    const bawah = { ...defaultSandboxValues('2-1'), bufferCapacity: 1 };
    expect(stepValue('2-1', bawah, 'bufferCapacity', -1).bufferCapacity).toBe(1);
  });

  it('tidak memutasi masukan', () => {
    const awal = defaultSandboxValues('2-1');
    const salinan = { ...awal };
    stepValue('2-1', awal, 'cores', 1);
    expect(awal).toEqual(salinan);
  });

  it('kunci yang tidak ada di level diabaikan', () => {
    const awal = defaultSandboxValues('2-1');
    expect(changeValue('2-1', awal, 'lockPolicy', 'fair')).toBe(awal);
    expect(stepValue('2-1', awal, 'lockPolicy', 1)).toBe(awal);
  });

  it('pilihan kebijakan: sah diterima, tidak sah diabaikan', () => {
    const awal = defaultSandboxValues('2-2');
    expect(changeValue('2-2', awal, 'lockPolicy', 'fair').lockPolicy).toBe(
      'fair',
    );
    expect(changeValue('2-2', awal, 'lockPolicy', 'acak')).toBe(awal);
  });

  it('clampToDef membulatkan dan menangani NaN', () => {
    const def = {
      kind: 'number' as const,
      key: 'cores' as const,
      label: 'Core',
      min: 1,
      max: 4,
      initial: 2,
    };
    expect(clampToDef(def, 2.6)).toBe(3);
    expect(clampToDef(def, 99)).toBe(4);
    expect(clampToDef(def, Number.NaN)).toBe(2);
  });
});

describe('planSandbox', () => {
  it('selalu tanpa bintang', () => {
    const plan = planSandbox(level2_1, defaultSandboxValues('2-1'));
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.options.rated).toBe(false);
      expect(plan.options.rwPolicy).toBeUndefined();
    }
  });

  it('Level 2-2 membawa kebijakan pilihan', () => {
    const plan = planSandbox(level2_2, {
      ...defaultSandboxValues('2-2'),
      lockPolicy: 'writer',
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) expect(plan.options.rwPolicy).toBe('writer');
  });

  it('level tanpa dukungan menghasilkan pesan, bukan error', () => {
    const plan = planSandbox(level1_1, {});
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.message).toMatch(/belum mendukung/);
  });
});