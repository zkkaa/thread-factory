import { describe, it, expect } from 'vitest';
import { ALL_LEVELS } from '../index';
import { MODULES, findModuleById, findModuleOfLevel } from '../modules';

/**
 * Level yang sudah direncanakan di modul tetapi datanya belum dibuat.
 * Saat sebuah level didaftarkan di ALL_LEVELS, hapus id-nya dari daftar ini
 * (tes di bawah akan gagal bila lupa).
 */
const BELUM_DIBUAT = ['1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4'];

describe('Daftar modul', () => {
  it('id modul unik dan tiap modul punya level dan konsep', () => {
    const ids = MODULES.map((moduleDef) => moduleDef.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const moduleDef of MODULES) {
      expect(moduleDef.levelIds.length).toBeGreaterThan(0);
      expect(moduleDef.concepts.length).toBeGreaterThan(0);
    }
  });

  it('id level diawali nomor modulnya dan tidak muncul di dua modul', () => {
    const semua = MODULES.flatMap((moduleDef) => moduleDef.levelIds);
    expect(new Set(semua).size).toBe(semua.length);
    for (const moduleDef of MODULES) {
      for (const levelId of moduleDef.levelIds) {
        expect(levelId.startsWith(`${moduleDef.id}-`)).toBe(true);
      }
    }
  });

  it('tiap level terdaftar berada di tepat satu modul yang cocok', () => {
    for (const level of ALL_LEVELS) {
      const pemilik = MODULES.filter((moduleDef) =>
        moduleDef.levelIds.includes(level.id),
      );
      expect(pemilik).toHaveLength(1);
      expect(pemilik[0].id).toBe(level.module);
    }
  });

  it('tiap id di modul sudah terdaftar atau tercatat belum dibuat', () => {
    const terdaftar = new Set(ALL_LEVELS.map((level) => level.id));
    for (const id of MODULES.flatMap((moduleDef) => moduleDef.levelIds)) {
      const belumDibuat = BELUM_DIBUAT.includes(id);
      expect(terdaftar.has(id) || belumDibuat).toBe(true);
      expect(terdaftar.has(id) && belumDibuat).toBe(false);
    }
  });

  it('findModuleById dan findModuleOfLevel', () => {
    expect(findModuleById(2)?.subtitle).toBe('Masalah Klasik Konkurensi');
    expect(findModuleById(3)).toBeUndefined();
    expect(findModuleOfLevel('1-3')?.id).toBe(1);
    expect(findModuleOfLevel('2-1')?.id).toBe(2);
    expect(findModuleOfLevel('9-9')).toBeUndefined();
  });
});
