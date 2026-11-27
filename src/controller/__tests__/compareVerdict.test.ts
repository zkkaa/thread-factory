import { describe, expect, it } from 'vitest';
import { judgeMetric, verdictFrom, type SideFigures } from '../compareMetrics';

function figures(overrides: Partial<SideFigures> = {}): SideFigures {
  return {
    ticks: 40,
    wait: 0,
    lostUpdates: 0,
    allTerminated: true,
    ...overrides,
  };
}

describe('judgeMetric', () => {
  it('angka sama selalu sama, bahkan bila tidak dinilai', () => {
    expect(judgeMetric(5, 5, true, true)).toBe('sama');
    expect(judgeMetric(5, 5, true, false)).toBe('sama');
  });

  it('menilai biasa bila dinilai', () => {
    expect(judgeMetric(40, 60, true)).toBe('A');
    expect(judgeMetric(40, 60, false)).toBe('B');
  });

  it('metrik efisiensi tidak dinilai bila tidak adil dibandingkan', () => {
    expect(judgeMetric(40, 60, true, false)).toBe('tidak-dinilai');
  });
});

describe('verdictFrom', () => {
  const base = { complete: true, okA: true, okB: true };

  it('pending bila belum selesai atau hasil belum ada', () => {
    expect(
      verdictFrom({ ...base, complete: false, a: figures(), b: figures() })
        .kind,
    ).toBe('pending');
    expect(
      verdictFrom({ ...base, okA: null, a: figures(), b: figures() }).kind,
    ).toBe('pending');
  });

  it('yang lulus menang walau yang gagal lebih cepat, dengan harga', () => {
    const verdict = verdictFrom({
      complete: true,
      okA: false,
      okB: true,
      a: figures({ ticks: 40, wait: 0, lostUpdates: 2 }),
      b: figures({ ticks: 60, wait: 23 }),
    });
    expect(verdict.kind).toBe('winner');
    expect(verdict.winner).toBe('B');
    expect(verdict.loser).toBe('A');
    expect(verdict.reason).toBe('benar');
    expect(verdict.tickDelta).toBe(20);
    expect(verdict.waitDelta).toBe(23);
    expect(verdict.loserLostUpdates).toBe(2);
    expect(verdict.loserFinished).toBe(true);
  });

  it('simetris: A lulus, B gagal', () => {
    const verdict = verdictFrom({
      complete: true,
      okA: true,
      okB: false,
      a: figures({ ticks: 60, wait: 23 }),
      b: figures({ ticks: 40, lostUpdates: 1 }),
    });
    expect(verdict.winner).toBe('A');
    expect(verdict.loserLostUpdates).toBe(1);
  });

  it('harga tidak bermakna bila yang gagal tidak selesai (macet atau batas tick)', () => {
    const verdict = verdictFrom({
      complete: true,
      okA: false,
      okB: true,
      a: figures({ ticks: 500, allTerminated: false }),
      b: figures({ ticks: 60, wait: 23 }),
    });
    expect(verdict.winner).toBe('B');
    expect(verdict.loserFinished).toBe(false);
    expect(verdict.tickDelta).toBeNull();
    expect(verdict.waitDelta).toBeNull();
  });

  it('harga negatif bila pemenang justru lebih cepat', () => {
    const verdict = verdictFrom({
      complete: true,
      okA: false,
      okB: true,
      a: figures({ ticks: 60 }),
      b: figures({ ticks: 51 }),
    });
    expect(verdict.tickDelta).toBe(-9);
  });

  it('keduanya gagal', () => {
    const verdict = verdictFrom({
      complete: true,
      okA: false,
      okB: false,
      a: figures(),
      b: figures({ ticks: 10 }),
    });
    expect(verdict.kind).toBe('bothFail');
    expect(verdict.winner).toBeNull();
  });

  it('keduanya lulus: lebih cepat dan lebih sedikit menunggu menang', () => {
    const verdict = verdictFrom({
      ...base,
      a: figures({ ticks: 40, wait: 5 }),
      b: figures({ ticks: 60, wait: 23 }),
    });
    expect(verdict.kind).toBe('winner');
    expect(verdict.winner).toBe('A');
    expect(verdict.reason).toBe('efisien');
  });

  it('keduanya lulus: tick sama, waktu tunggu menentukan', () => {
    const verdict = verdictFrom({
      ...base,
      a: figures({ ticks: 40, wait: 9 }),
      b: figures({ ticks: 40, wait: 3 }),
    });
    expect(verdict.winner).toBe('B');
  });

  it('keduanya lulus dengan arah berlawanan: tradeoff (contoh screenshot: A 51 tick/37 tunggu, B 60 tick/23 tunggu)', () => {
    const verdict = verdictFrom({
      ...base,
      a: figures({ ticks: 51, wait: 37 }),
      b: figures({ ticks: 60, wait: 23 }),
    });
    expect(verdict.kind).toBe('tradeoff');
    expect(verdict.winner).toBeNull();
    expect(verdict.faster).toBe('A');
    expect(verdict.tickGap).toBe(9);
    expect(verdict.waitGap).toBe(14);
  });

  it('tradeoff simetris: B lebih cepat', () => {
    const verdict = verdictFrom({
      ...base,
      a: figures({ ticks: 60, wait: 23 }),
      b: figures({ ticks: 51, wait: 37 }),
    });
    expect(verdict.faster).toBe('B');
  });

  it('keduanya lulus dan sama persis: tie', () => {
    const verdict = verdictFrom({
      ...base,
      a: figures({ ticks: 40, wait: 5 }),
      b: figures({ ticks: 40, wait: 5 }),
    });
    expect(verdict.kind).toBe('tie');
  });
});
