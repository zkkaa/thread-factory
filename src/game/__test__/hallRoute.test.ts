import { describe, expect, it } from 'vitest';
import { planMove, type HallPlace } from '../hallRoute';
import { hall1_3 } from '../layouts/level-1-3.hall.layout';

const work = (i: number): HallPlace => ({
  zone: 'work',
  point: hall1_3.workSpots[i] ?? { x: 0, y: 0 },
});
const queue = (i: number): HallPlace => ({
  zone: 'queue',
  point: hall1_3.queueSpots[i] ?? { x: 0, y: 0 },
});
const inHall = (i: number): HallPlace => ({
  zone: 'hall',
  point: hall1_3.machines[i] ?? { x: 0, y: 0 },
});
const done = (i: number): HallPlace => ({
  zone: 'done',
  point: hall1_3.doneSpots[i] ?? { x: 0, y: 0 },
});

describe('planMove', () => {
  it('penempatan pertama tidak dianimasikan', () => {
    expect(planMove(hall1_3, null, work(0))).toEqual({ kind: 'none' });
  });

  it('titik yang sama tidak berpindah', () => {
    expect(planMove(hall1_3, work(2), work(2))).toEqual({ kind: 'none' });
  });

  it('pijakan ke antrean lewat sumbu tegak lalu ke lajur tujuan', () => {
    const route = hall1_3.art?.route;
    if (route === undefined) throw new Error('layout 1-3 harus punya rute');
    const target = queue(0);
    const move = planMove(hall1_3, work(0), target);
    expect(move.kind).toBe('walk');
    if (move.kind !== 'walk') return;
    expect(move.points[0]).toEqual({ x: route.spineX, y: work(0).point.y });
    expect(move.points[1]?.x).toBe(route.spineX);
    expect(move.points[1]?.y).toBe(target.point.y);
    expect(move.points[move.points.length - 1]).toEqual(target.point);
  });

  it('antrean ke aula lewat gerbang, belok, dan titik gabung', () => {
    const route = hall1_3.art?.route;
    if (route === undefined) throw new Error('layout 1-3 harus punya rute');
    const from = queue(1);
    const move = planMove(hall1_3, from, inHall(0));
    expect(move.kind).toBe('walk');
    if (move.kind !== 'walk') return;
    expect(move.points[0]).toEqual({ x: hall1_3.door.x, y: from.point.y });
    expect(move.points).toContainEqual(route.merge);
    expect(move.points[move.points.length - 1]).toEqual(inHall(0).point);
  });

  it('pijakan langsung ke aula (tanpa gerbang) tetap lewat jalan', () => {
    const move = planMove(hall1_3, work(5), inHall(2));
    expect(move.kind).toBe('walk');
    if (move.kind !== 'walk') return;
    expect(move.points.length).toBeGreaterThan(3);
  });

  it('keluar dari aula atau parkir selesai memudar, bukan berjalan', () => {
    expect(planMove(hall1_3, inHall(0), work(0))).toEqual({ kind: 'respawn' });
    expect(planMove(hall1_3, inHall(0), done(0))).toEqual({ kind: 'respawn' });
    expect(planMove(hall1_3, work(0), done(0))).toEqual({ kind: 'respawn' });
  });

  it('layout tanpa rute berjalan lurus ke tujuan', () => {
    const plain = { ...hall1_3, art: undefined };
    const target = queue(0);
    expect(planMove(plain, work(0), target)).toEqual({
      kind: 'walk',
      points: [target.point],
    });
  });
});