import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import type { LevelDefinition } from '../../levels/types';
import { ToolboxHud } from '../components/hud/ToolboxHud';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

function makeSemaphoreLevel(initialTokens = 3): LevelDefinition {
  return {
    id: 'test-sem',
    module: 1,
    title: 'Uji Semaphore',
    layoutId: 'loop',
    intro: [{ text: 'Intro' }],
    hints: ['H1', 'H2', 'H3'],
    concepts: ['Semaphore'],
    threads: [
      {
        id: 'A',
        label: 'Robot A',
        program: [
          { op: 'WORK', ticks: 1 },
          { op: 'READ', from: 'stok', into: 'r' },
        ],
        repeat: 1,
      },
    ],
    sharedVars: { stok: 0 },
    resources: [
      { kind: 'semaphore', id: 'kartu', initialValue: initialTokens },
    ],
    availableTools: ['semaphore'],
    scheduler: { kind: 'random', cores: 1 },
    goal: {
      target: { variable: 'stok', value: 1 },
      invariant: () => ({ ok: true, message: 'ok' }),
      stars: { fast: 10, lowWait: 10 },
    },
  };
}

function makeController(initialTokens = 3): SimulationController {
  const controller = new SimulationController(undefined, noClock);
  controller.loadLevel(makeSemaphoreLevel(initialTokens));
  return controller;
}

function render(controller: SimulationController): string {
  return renderToStaticMarkup(
    <ToolboxHud controller={controller} state={controller.getState()} />,
  );
}

describe('SemaphoreToolbox (T-042)', () => {
  it('menampilkan panel Kartu Akses (Semaphore) dan nilai token awal', () => {
    const html = render(makeController(3));
    expect(html).toContain('Kartu Akses (Semaphore)');
    expect(html).toContain('Kapasitas:');
    expect(html).toContain('Gerbang Kartu (belum dipasang)');
    expect(html).toContain('data-testid="semaphore-value"');
    expect(html).toContain('>3</span>');
  });

  it('tombol stepper [-] dan [+] memiliki aria-label yang tepat', () => {
    const html = render(makeController(3));
    expect(html).toContain('aria-label="Kurangi nilai semaphore"');
    expect(html).toContain('aria-label="Tambah nilai semaphore"');
  });

  it('menonaktifkan tombol [-] bila nilai mencapai batas bawah 1', () => {
    const html = render(makeController(1));
    const minusBtn =
      /<button[^>]*aria-label="Kurangi nilai semaphore"[^>]*>/.exec(
        html,
      )?.[0] ?? '';
    expect(/\sdisabled=""/.test(minusBtn)).toBe(true);
  });

  it('menonaktifkan tombol [+] bila nilai mencapai batas atas 8', () => {
    const html = render(makeController(8));
    const plusBtn =
      /<button[^>]*aria-label="Tambah nilai semaphore"[^>]*>/.exec(html)?.[0] ??
      '';
    expect(/\sdisabled=""/.test(plusBtn)).toBe(true);
  });

  it('mengunci kontrol dan menampilkan pesan saat simulasi berjalan / paused', () => {
    const controller = makeController(3);
    controller.step();
    const html = render(controller);
    expect(html).toContain('Alat terkunci karena simulasi sudah dimulai');

    const minusBtn =
      /<button[^>]*aria-label="Kurangi nilai semaphore"[^>]*>/.exec(
        html,
      )?.[0] ?? '';
    const plusBtn =
      /<button[^>]*aria-label="Tambah nilai semaphore"[^>]*>/.exec(html)?.[0] ??
      '';
    expect(/\sdisabled=""/.test(minusBtn)).toBe(true);
    expect(/\sdisabled=""/.test(plusBtn)).toBe(true);
  });
});
