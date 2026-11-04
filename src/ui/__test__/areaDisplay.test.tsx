import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../controller/SimulationController';
import type { Clock } from '../../controller/clock';
import type { PlacedTool } from '../../engine/tools';
import { level1_1 } from '../../levels/module1/level-1-1';
import { level1_3 } from '../../levels/module1/level-1-3';
import type { LevelDefinition } from '../../levels/types';
import { areaOf } from '../areaMode';
import { MetricsHud } from '../components/hud/MetricsHud';
import { deriveMetrics } from '../metricsView';
import { deriveMission } from '../missionSummary';
import { deriveResultView } from '../resultView';

const noClock: Clock = { requestFrame: () => 1, cancelFrame: () => {} };

/** Gerbang Kartu Akses yang menutupi ENTER_AREA sampai LEAVE_AREA. */
function cardGate(value: number): PlacedTool {
  return {
    id: 'sem-kartu',
    kind: 'semaphore',
    sem: 'kartu',
    value,
    spans: level1_3.threads.map((t) => ({ thread: t.id, start: 1, end: 3 })),
  };
}

function load(level: LevelDefinition): SimulationController {
  const controller = new SimulationController(undefined, noClock);
  controller.loadLevel(level);
  return controller;
}

function playToEnd(
  level: LevelDefinition,
  gate: number | null,
): SimulationController {
  const controller = load(level);
  if (gate !== null) controller.placeTool(cardGate(gate));
  for (
    let i = 0;
    i < 500 && controller.getState().runState !== 'finished';
    i += 1
  ) {
    controller.step();
  }
  return controller;
}

function resultViewOf(controller: SimulationController) {
  const { level, snapshot, result } = controller.getState();
  if (level === null || snapshot === null || result === null) {
    throw new Error('Simulasi belum selesai');
  }
  return deriveResultView(level, snapshot, result);
}

describe('areaOf', () => {
  it('mengembalikan area pertama level berarea, null bila tidak ada', () => {
    expect(areaOf(level1_3)).toEqual({ name: 'aula', capacity: 3 });
    expect(areaOf(level1_1)).toBeNull();
  });
});

describe('Misi level berarea (T-042)', () => {
  it('Level 1-3 menyebut bentrok, bukan variabel kosong', () => {
    const mission = deriveMission(level1_3);
    expect(mission.targetText).toBe('tanpa bentrok di aula (kapasitas 3)');
    expect(mission.stars[0]?.text).toContain('tanpa bentrok');
  });

  it('Level 1-1 tidak berubah', () => {
    expect(deriveMission(level1_1).targetText).toBe('stok = 10');
  });
});

describe('Metrik level berarea (T-042)', () => {
  it('Level 1-3: data area ada pada tick 0', () => {
    const view = deriveMetrics(load(level1_3).getState());
    expect(view?.area).toEqual({
      name: 'aula',
      capacity: 3,
      occupancy: 0,
      overloadTicks: 0,
      utilization: '0%',
    });
  });

  it('Level 1-1: tidak ada data area', () => {
    expect(deriveMetrics(load(level1_1).getState())?.area).toBeNull();
  });

  it('laci Metrik Level 1-3 menampilkan aula, bukan pembaruan hilang', () => {
    const html = renderToStaticMarkup(
      <MetricsHud state={load(level1_3).getState()} />,
    ).replace(/<!-- -->/g, '');
    expect(html).toContain('Metrik: aula 0 / 3');
    expect(html).toContain('Tick bentrok');
    expect(html).toContain('Utilisasi area');
    expect(html).not.toContain('Pembaruan hilang');
  });

  it('laci Metrik Level 1-1 tetap seperti semula', () => {
    const html = renderToStaticMarkup(
      <MetricsHud state={load(level1_1).getState()} />,
    ).replace(/<!-- -->/g, '');
    expect(html).toContain('Metrik: stok 0 / 10');
    expect(html).toContain('Pembaruan hilang');
  });
});

describe('Popup hasil level berarea (T-042)', () => {
  it('tanpa gerbang: gagal dengan jumlah tick bentrok', () => {
    const view = resultViewOf(playToEnd(level1_3, null));
    expect(view.ok).toBe(false);
    expect(view.quote).toMatch(
      /^Seharusnya tanpa bentrok, hasilnya \d+ tick bentrok\.$/,
    );
    expect(view.keyFigure.label).toBe('Bentrok');
    expect(view.keyFigure.target).toBe('0');
    expect(view.keyFigure.match).toBe(false);
    expect(view.criteria[0]?.label).toBe('Benar: tidak ada bentrok di aula');
    expect(view.cards[0]?.label).toBe('Tick bentrok');
    expect(view.cards.some((c) => c.label === 'Pembaruan hilang')).toBe(false);
  });

  it('gerbang kapasitas 3: lulus tanpa bentrok', () => {
    const view = resultViewOf(playToEnd(level1_3, 3));
    expect(view.ok).toBe(true);
    expect(view.quote).toBe('Tanpa bentrok di aula, semua robot aman.');
    expect(view.keyFigure.actual).toBe('0');
    expect(view.keyFigure.match).toBe(true);
    expect(view.cards[0]).toEqual({ label: 'Tick bentrok', value: '0' });
  });

  it('Level 1-1 tidak berubah', () => {
    const view = resultViewOf(playToEnd(level1_1, null));
    expect(view.quote).toBe('Seharusnya 10, hasilnya 8.');
    expect(view.keyFigure.label).toBe('Stok');
    expect(view.cards[0]?.label).toBe('Pembaruan hilang');
  });
});