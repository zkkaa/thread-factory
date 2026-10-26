import { describe, expect, it } from 'vitest';
import {
  GLOSSARY,
  GUIDE_STEPS,
  HUD_CONTROLS,
  ROBOT_STATES,
} from '../guideContent';

describe('guideContent', () => {
  it('cara bermain terdiri dari tiga langkah: Amati, Pasang, Jalankan', () => {
    expect(GUIDE_STEPS.map((step) => step.title)).toEqual([
      'Amati',
      'Pasang',
      'Jalankan',
    ]);
    for (const step of GUIDE_STEPS)
      expect(step.text.length).toBeGreaterThan(20);
  });

  it('status robot persis empat: READY, RUNNING, WAITING, TERMINATED', () => {
    expect(ROBOT_STATES.map((info) => info.state)).toEqual([
      'READY',
      'RUNNING',
      'WAITING',
      'TERMINATED',
    ]);
    for (const info of ROBOT_STATES) {
      expect(info.meaning.length).toBeGreaterThan(10);
    }
  });

  it('label kontrol HUD unik dan berisi kontrol utama', () => {
    const labels = HUD_CONTROLS.map((control) => control.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const wajib of ['Play / Pause', 'Step', 'Reset', 'Seed']) {
      expect(labels).toContain(wajib);
    }
  });

  it('glosarium memuat tujuh istilah wajib dari PRD bagian 16', () => {
    expect(GLOSSARY.map((entry) => entry.term).sort()).toEqual(
      [
        'Condition variable',
        'Critical section',
        'Deadlock',
        'Mutex',
        'Race condition',
        'Semaphore',
        'Starvation',
      ].sort(),
    );
  });

  it('setiap istilah punya definisi dan wujudnya di game', () => {
    for (const entry of GLOSSARY) {
      expect(entry.definition.length).toBeGreaterThan(20);
      expect(entry.inGame.length).toBeGreaterThan(10);
    }
  });

  it('deadlock menyebut keempat kondisi Coffman', () => {
    const deadlock = GLOSSARY.find((entry) => entry.term === 'Deadlock');
    const teks = deadlock?.definition.toLowerCase() ?? '';
    for (const kondisi of [
      'mutual exclusion',
      'hold and wait',
      'no preemption',
      'circular wait',
    ]) {
      expect(teks).toContain(kondisi);
    }
  });

  it('mutex dan semaphore tidak dicampur: mutex punya pemilik, semaphore tidak', () => {
    const mutex = GLOSSARY.find((entry) => entry.term === 'Mutex');
    const semaphore = GLOSSARY.find((entry) => entry.term === 'Semaphore');
    expect(mutex?.definition).toContain('pemilik');
    expect(semaphore?.definition).toContain('tidak punya pemilik');
  });
});
